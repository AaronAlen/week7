# StockPilot System Walkthrough & Verification Report

## Project Overview

StockPilot is a full-stack inventory restock management system incorporating **LangGraph.js agent orchestration**, **Human-in-the-Loop (HITL) purchase approval**, **ACID SQL transactions**, **WebSocket chat**, and **Multer product image uploads**.

## Setup & Running Instructions

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Run Automated Verification Test Suite
```bash
npm test
```

### 4. Start Server & Client
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/api-docs`

---

## Verification Test Results

All 8 core test scenarios were executed via `npm test` and passed cleanly:

```text
======================================================
🧪 RUNNING STOCKPILOT AUTOMATED VERIFICATION SUITE
======================================================

--- Scenario 1: Normal Healthy Stock Evaluation ---
  ✅ [PASS] Test 1: Normal Stock

--- Scenario 2: Low Stock + Low Cost (<= $1000 Auto PO) ---
  ✅ [PASS] Test 2: Auto Approval PO Creation
  ✅ [PASS] Test 2: Purchase Order Status SENT

--- Scenario 3: Low Stock + High Cost (> $1000 HITL Interrupt) ---
  ✅ [PASS] Test 3: LangGraph Interrupt Triggered
  ✅ [PASS] Test 3: Thread ID captured
  ✅ [PASS] Test 3: Approval Queue Entry

--- Scenario 4: HITL Approval Decision (approved = true) ---
  ✅ [PASS] Test 4: Workflow Resume with Approval
  ✅ [PASS] Test 4: High Cost PO Status SENT

--- Scenario 5: HITL Rejection Decision (approved = false) ---
  ✅ [PASS] Test 5: Workflow Resume with Rejection
  ✅ [PASS] Test 5: Product Stock Remains LOW_STOCK

--- Scenario 6: Receive Stock ACID Transaction ---
  ✅ [PASS] Test 6: Product Stock Increment
  ✅ [PASS] Test 6: PO & Request Status Update

--- Scenario 7: Authentication & JWT Verification ---
  ✅ [PASS] Test 7: JWT Signing & Decoding
  ✅ [PASS] Test 7: Bcrypt Password Hashing Match

--- Scenario 8: Role Based Access Control (RBAC) ---
  ✅ [PASS] Test 8: Admin Role Check
  ✅ [PASS] Test 8: Manager Role Check
  ✅ [PASS] Test 8: Staff Role Check

======================================================
📊 TEST SUITE SUMMARY: 14 PASSED | 0 FAILED
======================================================
```

---

## End-to-End Core User Scenarios Tested

### Scenario A — Automatic Low Cost Restock (<= $1000)
1. Product stock falls below safety threshold (e.g. `SKU-HUB-003`, cost $962).
2. Admin/Manager clicks **[ Trigger Restock Agent ]**.
3. LangGraph evaluates stock (`calculatedReorderQty = 52`, `totalCost = $962`).
4. Since `totalCost <= 1000`, workflow automatically creates Purchase Order `#PO-xxx` with status `SENT` and dispatches supplier email.

### Scenario B — High Cost HITL Approval (> $1000)
1. Product stock falls below safety threshold (e.g. `SKU-MONITOR-002`, cost $7,200).
2. Trigger restock initiates `evaluateStockNode`.
3. Since `totalCost > 1000`, `humanApprovalNode` calls `interrupt()`.
4. Workflow pauses state execution; item appears in **Pending Approvals** UI.
5. Admin clicks **[ Approve & Send PO ]**.
6. `resumeRestockWorkflow` sends `Command({ resume: { approved: true } })` to LangGraph.
7. Workflow resumes, creates PO, sends email, status updated to `SENT`.

### Scenario C — High Cost HITL Rejection
1. Workflow pauses at `interrupt()`.
2. Admin clicks **[ Reject Order ]**.
3. `resumeRestockWorkflow` sends `Command({ resume: { approved: false } })`.
4. PO status set to `CANCELLED`, RestockRequest status set to `REJECTED`, no email sent.
5. Product stock remains `LOW_STOCK` without entering infinite auto-retry loops. Manual retry is available.

### Scenario D — Receive Stock ACID Transaction
1. Admin clicks **[ Receive Stock ]** for SENT purchase order.
2. Backend starts database transaction (`BEGIN`).
3. Product stock updated (`stock = stock + qty`).
4. `InventoryTransaction` logged (`type: RESTOCK`).
5. PO marked `RECEIVED`, Restock Request marked `COMPLETED`.
6. Transaction committed (`COMMIT`).

---

## Known Limitations & External Dependencies

- **Email Transporter**: When real SMTP credentials (`EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`) are not supplied in `.env`, Nodemailer uses an automated dev log transporter to print clean formatted email structures without throwing network connection errors.
- **Database Switching**: Operates on SQLite out-of-the-box for zero-dependency local development and testing, and seamlessly switches to MySQL when `DB_DIALECT=mysql` is configured.
