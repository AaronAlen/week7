# 🛡️ Role-Based Access Control (RBAC) Specification

StockPilot enforces strict, layered Role-Based Access Control at both the **Express.js API middleware layer** (`authorizeRoles`) and the **React frontend route & component layer** (`<ProtectedRoute>` & `hasRole()`).

---

## 👥 Supported Roles

1. **`ADMIN`**: Full unrestricted system privileges. Authorized to manage users, delete products, execute financial approvals, adjust inventory counts, manage supplier awards, and review audit traces.
2. **`MANAGER`**: Operational management permissions. Can create/edit products, trigger restock workflows, approve/reject high-value purchase orders, evaluate vendor RFPs, manage customer refunds, and create staff accounts. Cannot delete products or demote admins.
3. **`STAFF`**: Warehouse and store personnel. Can view product catalogs, record customer sales (`POST /api/inventory/sell`), participate in operations chat, and query the AI Analytics Copilot. Cannot edit product thresholds, approve purchases, or alter user accounts.

---

## 📊 Complete Permissions Matrix (All 11 Modules)

| Feature / Action | API Endpoint | ADMIN | MANAGER | STAFF |
| :--- | :--- | :---: | :---: | :---: |
| **Authentication & Session** | `/api/auth/*` | ✅ | ✅ | ✅ |
| **View Dashboard & Catalog** | `GET /api/products` | ✅ | ✅ | ✅ |
| **View Product Details** | `GET /api/products/:id` | ✅ | ✅ | ✅ |
| **Create Catalog Items** | `POST /api/products` | ✅ | ✅ | ❌ |
| **Edit Catalog Items** | `PUT /api/products/:id` | ✅ | ✅ | ❌ |
| **Delete Catalog Items** | `DELETE /api/products/:id` | ✅ | ❌ | ❌ |
| **Upload Product Photos** | `POST /api/products/:id/image` | ✅ | ✅ | ❌ |
| **Record Customer Sales** | `POST /api/inventory/sell` | ✅ | ✅ | ✅ |
| **Manual Stock Adjustments** | `POST /api/inventory/adjust` | ✅ | ✅ | ❌ |
| **View Inventory Audit Trail** | `GET /api/inventory/transactions` | ✅ | ✅ | ✅ |
| **View Restock Requests** | `GET /api/restocks` | ✅ | ✅ | ✅ |
| **Trigger Restock Engine** | `POST /api/restocks/trigger` | ✅ | ✅ | ❌ |
| **Retry Escalated Orders** | `POST /api/restocks/:id/retry` | ✅ | ✅ | ❌ |
| **Receive Stock Deliveries** | `POST /api/restocks/:id/receive` | ✅ | ✅ | ❌ |
| **View Executive Approvals** | `GET /api/approvals` | ✅ | ✅ | ❌ |
| **Approve/Reject Orders** | `POST /api/approvals/approve` | ✅ | ✅ | ❌ |
| **Cancel Approval Requests** | `DELETE /api/approvals/:id` | ✅ | ✅ | ❌ |
| **View Purchase Orders** | `GET /api/purchase-orders` | ✅ | ✅ | ✅ |
| **View Agent Execution Logs** | `GET /api/agent-logs` | ✅ | ✅ | ✅ |
| **Operations Team Chat** | `/api/chat/messages` | ✅ | ✅ | ✅ |
| **Query AI Analytics Copilot** | `POST /api/chat/query` | ✅ | ✅ | ✅ |
| **View Own Profile** | `GET /api/users/profile` | ✅ | ✅ | ✅ |
| **List User Accounts** | `GET /api/users` | ✅ | ✅ | ❌ |
| **Create User Accounts** | `POST /api/users` | ✅ | ✅ | ❌ |
| **Trigger AI Refund Analysis** | `POST /api/refunds/process` | ✅ | ✅ | ✅ |
| **View Customer Refund Claims** | `GET /api/refunds` | ✅ | ✅ | ✅ |
| **Override/Decide Refunds** | `POST /api/refunds/:id/decide` | ✅ | ✅ | ❌ |
| **Send Refund Customer Email** | `POST /api/refunds/*send-email`| ✅ | ✅ | ❌ |
| **Run Vendor PDF Evaluation** | `POST /api/vendor-evaluations/evaluate` | ✅ | ✅ | ✅ |
| **Award Vendor (Email/SMS)** | `POST /api/vendor-evaluations/send-*` | ✅ | ✅ | ✅ |
| **Delete Vendor Evaluation** | `DELETE /api/vendor-evaluations/:id` | ✅ | ✅ | ❌ |

---

## 🔒 Security Enforcement Architecture

1. **Server-Side Token Verification**: The `authenticateToken` middleware decodes the JWT access token and binds `req.user = { id, email, role }`.
2. **Role Verification Guard**:
   ```javascript
   export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
     if (!allowedRoles.includes(req.user.role)) {
       return res.status(403).json({ error: 'Access denied: insufficient permissions' });
     }
     next();
   };
   ```
3. **Client-Side Route Protection**: `<ProtectedRoute roles={['ADMIN', 'MANAGER']}>` blocks unauthorized URL navigation and hides restricted UI controls.
