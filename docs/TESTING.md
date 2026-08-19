# Automated Testing Guide

## Automated Verification Suite

StockPilot includes a dedicated node test runner (`tests/runTests.js`) that validates all 8 critical scenarios end-to-end.

To run the automated tests:
```bash
npm test
```

## Scenarios Tested

1. **Test 1 — Normal Stock**: Validates that products with stock >= safety threshold do not trigger restock orders.
2. **Test 2 — Auto Approval PO (Cost <= $1000)**: Validates that low stock products with total reorder cost <= $1000 automatically generate a Purchase Order with status `SENT`.
3. **Test 3 — High Cost HITL Interrupt (Cost > $1000)**: Validates that purchase orders exceeding $1000 trigger a LangGraph `interrupt()` and create a `PENDING` approval item.
4. **Test 4 — HITL Approval Flow**: Validates that calling `resumeRestockWorkflow` with `approved: true` resumes the workflow, creates a PO, and dispatches email.
5. **Test 5 — HITL Rejection Flow**: Validates that calling `resumeRestockWorkflow` with `approved: false` marks PO cancelled, leaves stock low, and avoids auto-retry loops.
6. **Test 6 — Receive Stock Transaction**: Validates ACID transaction execution when stock is delivered, increasing product stock, creating a `RESTOCK` transaction, and marking PO `RECEIVED`.
7. **Test 7 — Auth & JWT Verification**: Tests password hashing and JWT token signing/decoding.
8. **Test 8 — RBAC Roles**: Verifies permission scopes for `ADMIN`, `MANAGER`, and `STAFF`.
