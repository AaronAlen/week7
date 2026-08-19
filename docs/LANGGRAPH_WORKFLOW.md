# LangGraph Agent Workflow

## State Graph Architecture

The workflow is constructed using `@langchain/langgraph`'s `StateGraph` API with standard JavaScript ES Modules.

```text
       [START]
          │
          ↓
  evaluateStockNode
          │
          │ (Conditional Edge: routeDecision)
          ├── totalCost <= 1000 ──> executeRestockNode ──> [END]
          │
          └── totalCost > 1000  ──> humanApprovalNode (interrupt)
                                           │
                                    Command({ resume })
                                           │
                                           ↓
                                   executeRestockNode ──> [END]
```

## Graph Nodes

1. **`evaluateStockNode`**:
   - Reads current stock, safety threshold, target stock, and unit cost.
   - Uses standard JS business logic to calculate:
     - `calculatedReorderQty = targetStock - currentStock`
     - `totalCost = calculatedReorderQty * unitCost`
     - `requiresHumanReview = totalCost > 1000`
   - Creates/updates `RestockRequest` record and writes `AgentLog`.

2. **`humanApprovalNode`**:
   - Invokes `interrupt(payload)` to suspend execution when `totalCost > 1000`.
   - Payload includes product details, order quantity, total cost, and warning message.
   - Workflow stays paused until administrator calls `/api/approve-restock`.

3. **`executeRestockNode`**:
   - If approved or auto-approved: Creates PurchaseOrder (`SENT`), dispatches Nodemailer email, updates `RestockRequest` status to `APPROVED`, writes `AgentLog`.
   - If rejected: Marks PO as `CANCELLED`, `RestockRequest` as `REJECTED`, writes `AgentLog`, does not send email.
