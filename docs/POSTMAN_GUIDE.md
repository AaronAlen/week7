# 📬 StockPilot Postman Collection & Integration Guide

This guide describes how to import and run end-to-end API tests against the StockPilot Express backend using Postman.

---

## 🚀 Quick Setup

1. Open Postman.
2. Click **Import** and select `postman/stockpilot.postman_collection.json`.
3. Configure your Environment Variables:
   * `baseUrl`: `http://localhost:5000/api`
   * `accessToken`: *(Automatically populated by the Tests script after sending `POST /api/auth/login`)*
   * `refreshToken`: *(Handled automatically via HttpOnly cookies)*
   * `threadId`: *(Populated after triggering restocks exceeding $1,000)*
   * `productId`: `1`

---

## 📁 Request Folders & Coverage (42 Endpoints)

The Postman collection organizes requests across **11 core folders**:

### 1. 🔐 Authentication (`/api/auth`)
* `POST /login` — Log in as Administrator (`admin@stockpilot.io` / `password123`)
* `POST /refresh` — Issue a new short-lived access token
* `POST /logout` — Invalidate session

### 2. 📦 Products (`/api/products`)
* `GET /products` — Fetch full catalog
* `GET /products/:id` — Single product details
* `POST /products` — Create new SKU
* `PUT /products/:id` — Update pricing & thresholds
* `DELETE /products/:id` — Delete product
* `POST /products/:id/image` — Upload product image multipart

### 3. 🔄 Inventory Movements (`/api/inventory`)
* `POST /inventory/sell` — Record customer sale
* `POST /inventory/adjust` — Manual stock count adjustment
* `GET /inventory/transactions` — ACID transaction audit log

### 4. 🤖 Restocks & Replenishment (`/api/restocks`)
* `GET /restocks` — List active/historical restock workflows
* `GET /restocks/:id` — Specific restock details
* `POST /restocks/trigger` — Trigger replenishment calculation
* `POST /restocks/:id/retry` — Retry failed/rejected restock
* `POST /restocks/:id/receive` — Receive delivered goods

### 5. ⚖️ Executive Approvals (`/api/approvals`)
* `GET /approvals` — Pending orders exceeding $1,000
* `POST /approvals/approve` — Approve or reject high-value restock
* `POST /approve-restock` — Route alias
* `DELETE /approvals/:id` — Cancel approval request

### 6. 📄 Purchase Orders (`/api/purchase-orders`)
* `GET /purchase-orders` — List supplier POs
* `GET /purchase-orders/:id` — Single PO detail

### 7. 📜 Agent Logs (`/api/agent-logs`)
* `GET /agent-logs` — Trace logs of autonomous agent decisions

### 8. 💬 Operations Chat & AI Copilot (`/api/chat`)
* `GET /chat/messages` — Warehouse communication history
* `POST /chat/messages` — Send message (WebSockets broadcast)
* `POST /chat/query` — Natural language inventory analytics prompt

### 9. 👥 User Management (`/api/users`)
* `GET /users/profile` — Logged-in user profile
* `GET /users` — List staff and managers (RBAC)
* `POST /users` — Create new user account

### 10. 💰 Refunds & Customer Claims (`/api/refunds`)
* `POST /refunds/process` — Run AI reasoning agent on refund claim
* `GET /refunds` — List refund claims
* `POST /refunds/:id/decide` — Human approval/rejection override
* `POST /refunds/:id/send-email` — Dispatch AI-drafted reply
* `POST /refunds/send-email` — Direct email dispatch

### 11. 📑 Vendor Intelligence (`/api/vendor-evaluations`)
* `GET /vendor-evaluations/samples` — List sample PDF quote files
* `POST /vendor-evaluations/evaluate` — Multipart upload & LLM evaluation
* `POST /vendor-evaluations/send-email` — Send award email via Nodemailer
* `POST /vendor-evaluations/send-sms` — Send SMS via Twilio
* `GET /vendor-evaluations` — Historical RFP evaluations
* `GET /vendor-evaluations/:id` — Specific evaluation details
* `DELETE /vendor-evaluations/:id` — Delete evaluation report

---

## ⚡ Real-Time Testing with Postman WebSocket Client
Connect to the Socket.IO server at:
```
ws://localhost:5000/socket.io/?EIO=4&transport=websocket
```
Verify reception of `chat_message` and `data_updated` broadcast events.
