# Inventory & Stock Mutation Workflow

## Sales & Stock Reduction

When an admin or staff member records a sale:
1. Client sends `POST /api/inventory/sell` with `productId`, `quantity`, and `referenceId`.
2. Backend starts an ACID transaction (`sequelize.transaction()`).
3. Fetches product with row locking (`lock: true`).
4. Checks sufficiency (`currentStock >= requestedQuantity`).
5. Updates `currentStock = currentStock - quantity`.
6. Inserts `InventoryTransaction` record (`type: 'SALE'`).
7. Commits transaction (`transaction.commit()`).
8. Evaluates if new stock is below `safetyThreshold`. If true, returns `isLowStock: true` so the UI presents the [Trigger Restock] button.

## Receiving Stock Workflow

When supplier delivers inventory:
1. Admin clicks **[ Receive Stock ]** on an approved/sent restock request (`POST /api/restocks/:id/receive`).
2. Backend starts an ACID transaction (`BEGIN`).
3. Fetches `RestockRequest` and related `PurchaseOrder` & `Product`.
4. Validates PO status is `SENT`.
5. Increments product stock: `currentStock = currentStock + po.quantity`.
6. Inserts `InventoryTransaction` record (`type: 'RESTOCK'`, `referenceId: 'PO-xxx'`).
7. Updates PO status to `RECEIVED`.
8. Updates RestockRequest status to `COMPLETED`.
9. Writes `AgentLog` entry (`action: 'RECEIVE_STOCK'`).
10. Commits transaction (`COMMIT`). If any step fails, all operations roll back (`ROLLBACK`).
