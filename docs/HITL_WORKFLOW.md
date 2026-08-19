# Human-in-the-Loop (HITL) Workflow

## Concept & Purpose

In automated agent systems, high-value financial actions should not execute automatically without explicit human consent.

In StockPilot, purchase orders with `totalCost > $1000` trigger an immediate Human-in-the-Loop interrupt.

## Flow Scenarios

### Scenario A — Low Cost Automatic Order (Total Cost <= $1000)
```text
Product stock < safety threshold
        ↓
Trigger Restock
        ↓
evaluateStockNode (Total Cost = $875)
        ↓
routeDecision -> executeRestockNode
        ↓
PO Created & Email Dispatched (Status: SENT)
```

### Scenario B — High Cost Approval (Total Cost > $1000)
```text
Product stock < safety threshold
        ↓
Trigger Restock
        ↓
evaluateStockNode (Total Cost = $7,200)
        ↓
humanApprovalNode -> interrupt()
        ↓
Workflow Paused (ApprovalsQueue status: PENDING)
        ↓
Admin opens Pending Approvals UI -> Clicks [ Approve ]
        ↓
POST /api/approve-restock ({ threadId, approved: true })
        ↓
restockAgent.invoke(Command({ resume: { approved: true } }))
        ↓
Workflow Resumes -> executeRestockNode
        ↓
PO Created & Email Dispatched (Status: SENT)
```

### Scenario C — High Cost Rejection (Total Cost > $1000)
```text
Workflow Paused at interrupt()
        ↓
Admin clicks [ Reject ]
        ↓
POST /api/approve-restock ({ threadId, approved: false })
        ↓
Workflow Resumes -> executeRestockNode
        ↓
RestockRequest status = REJECTED, PO status = CANCELLED
        ↓
No email sent. Product remains LOW_STOCK.
        ↓
No infinite auto-retry loop. Manual retry available.
```
