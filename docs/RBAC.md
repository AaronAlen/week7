# Role-Based Access Control (RBAC)

## Permissions Matrix

StockPilot enforces strict role-based access control across Express middleware (`authorizeRoles`) and React frontend routes.

| Feature / Endpoint | ADMIN | MANAGER | STAFF |
| :--- | :---: | :---: | :---: |
| View Dashboard & Catalog | ✅ | ✅ | ✅ |
| Record Sales (`/api/inventory/sell`) | ✅ | ✅ | ✅ |
| Create/Edit Products (`/api/products`) | ✅ | ✅ | ❌ |
| Delete Products (`/api/products/:id`) | ✅ | ❌ | ❌ |
| Upload Product Images | ✅ | ✅ | ❌ |
| Trigger Restock Workflow | ✅ | ✅ | ❌ |
| Approve/Reject HITL Orders | ✅ | ✅ | ❌ |
| Receive Stock | ✅ | ✅ | ❌ |
| Manage User Accounts (`/api/users`) | ✅ | ❌ | ❌ |
| Real-Time Chat Room | ✅ | ✅ | ✅ |

Backend enforcement is primary: `authorizeRoles('ADMIN', 'MANAGER')` checks `req.user.role` from the verified JWT.
