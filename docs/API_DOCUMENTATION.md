# 📡 StockPilot Comprehensive REST API & WebSocket Documentation

The StockPilot server exposes **42 RESTful endpoints** and **real-time WebSocket event channels**, secured by JWT Dual-Token Authentication and granular Role-Based Access Control (RBAC).

---

## 📑 Table of Contents
1. [Authentication & Session (`/api/auth`)](#1-authentication--session-apiauth)
2. [Product Catalog & Stock Thresholds (`/api/products`)](#2-product-catalog--stock-thresholds-apiproducts)
3. [Inventory Movements & ACID Audit (`/api/inventory`)](#3-inventory-movements--acid-audit-apiinventory)
4. [Restock Replenishment Engine (`/api/restocks`)](#4-restock-replenishment-engine-apirestocks)
5. [Executive Approvals Queue (`/api/approvals`)](#5-executive-approvals-queue-apiapprovals)
6. [Purchase Orders (`/api/purchase-orders`)](#6-purchase-orders-apipurchase-orders)
7. [System & Agent Audit Logs (`/api/agent-logs`)](#7-system--agent-audit-logs-apiagent-logs)
8. [Operations Chat & Analytics Copilot (`/api/chat`)](#8-operations-chat--analytics-copilot-apichat)
9. [User Management & RBAC (`/api/users`)](#9-user-management--rbac-apiusers)
10. [Customer Service & Refund AI Agent (`/api/refunds`)](#10-customer-service--refund-ai-agent-apirefunds)
11. [Vendor RFP & PDF Intelligence (`/api/vendor-evaluations`)](#11-vendor-rfp--pdf-intelligence-apivendor-evaluations)
12. [Real-Time WebSocket Events (Socket.IO)](#12-real-time-websocket-events-socketio)

---

## 🔐 1. Authentication & Session (`/api/auth`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; returns JWT access token & sets HttpOnly refresh cookie |
| `POST` | `/api/auth/refresh` | Public | Exchanges HttpOnly refresh cookie for a new 15-minute access token |
| `POST` | `/api/auth/logout` | Authenticated | Clears refresh cookies and invalidates user session |

#### `POST /api/auth/login`
* **Request Body:**
  ```json
  {
    "email": "admin@stockpilot.io",
    "password": "password123"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "Sarah Connor",
      "email": "admin@stockpilot.io",
      "role": "ADMIN"
    }
  }
  ```
* **Cookie:** `refreshToken` (HttpOnly, Secure, SameSite=Lax, 7-day expiry).

---

## 📦 2. Product Catalog & Stock Thresholds (`/api/products`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | All Users | List all products with calculated stock health status |
| `GET` | `/api/products/:id` | All Users | Retrieve single product details & historical transactions |
| `POST` | `/api/products` | `ADMIN`, `MANAGER` | Create new catalog item |
| `PUT` | `/api/products/:id` | `ADMIN`, `MANAGER` | Update pricing, safety threshold, and target capacity |
| `DELETE` | `/api/products/:id` | `ADMIN` | Permanently delete product from catalog |
| `POST` | `/api/products/:id/image` | `ADMIN`, `MANAGER` | Upload product photo (Multer / Cloudinary) |

#### `POST /api/products`
* **Request Body:**
  ```json
  {
    "name": "Ergonomic Mechanical Keyboard",
    "sku": "KB-ERG-201",
    "description": "Tactile silent switches with dual Bluetooth connectivity.",
    "currentStock": 14,
    "safetyThreshold": 15,
    "targetStock": 60,
    "unitCost": 68.50,
    "supplierName": "KeyTech Logistics",
    "supplierEmail": "orders@keytech.com",
    "supplierPhone": "+1 (555) 019-2834"
  }
  ```

---

## 🔄 3. Inventory Movements & ACID Audit (`/api/inventory`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/inventory/sell` | All Users | Record point-of-sale customer purchase, decrement stock atomically |
| `POST` | `/api/inventory/adjust` | `ADMIN`, `MANAGER` | Manual stock count adjustments (write-offs, recount corrections) |
| `GET` | `/api/inventory/transactions` | All Users | Query historical audit trail of all warehouse movements |

#### `POST /api/inventory/sell`
* **Request Body:**
  ```json
  {
    "productId": 2,
    "quantity": 3,
    "referenceId": "POS-ORDER-4912"
  }
  ```

---

## 🤖 4. Restock Replenishment Engine (`/api/restocks`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/restocks` | All Users | List all autonomous restock requests and approval states |
| `GET` | `/api/restocks/:id` | All Users | Get single restock request with linked purchase order |
| `POST` | `/api/restocks/trigger` | `ADMIN`, `MANAGER` | Manually invoke replenishment engine for a specific product ID |
| `POST` | `/api/restocks/:id/retry` | `ADMIN`, `MANAGER` | Re-trigger replenishment analysis on an escalated/rejected order |
| `POST` | `/api/restocks/:id/receive` | `ADMIN`, `MANAGER` | Receive delivered stock into warehouse via atomic transaction |

#### Deterministic Supply Chain Logic:
* **Trigger condition**: `currentStock <= safetyThreshold`.
* **Reorder Quantity**: `targetStock - currentStock`.
* **Human-in-the-Loop Threshold**: If `reorderQuantity * unitCost > $1,000`, order pauses in `PENDING` for human authorization. Otherwise, auto-approved.

---

## ⚖️ 5. Executive Approvals Queue (`/api/approvals`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/approvals` | `ADMIN`, `MANAGER` | Query pending restock orders exceeding financial safety thresholds |
| `POST` | `/api/approvals/approve` | `ADMIN`, `MANAGER` | Authorize or reject pending restock request and dispatch PO |
| `POST` | `/api/approve-restock` | `ADMIN`, `MANAGER` | Canonical alias route for approval decision |
| `DELETE` | `/api/approvals/:id` | `ADMIN`, `MANAGER` | Cancel approval item and dismiss workflow |

#### `POST /api/approvals/approve`
* **Request Body:**
  ```json
  {
    "threadId": "restock-prod-2-1787550000000",
    "approved": true
  }
  ```

---

## 📄 6. Purchase Orders (`/api/purchase-orders`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/purchase-orders` | All Users | List all formal supplier purchase orders generated by the system |
| `GET` | `/api/purchase-orders/:id` | All Users | Retrieve single purchase order record with line items |

---

## 📜 7. System & Agent Audit Logs (`/api/agent-logs`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/agent-logs` | All Users | Query real-time autonomous agent decision logs and traces (`?limit=50`) |

---

## 💬 8. Operations Chat & Analytics Copilot (`/api/chat`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/messages` | All Users | Retrieve communication stream history (`?limit=100`) |
| `POST` | `/api/chat/messages` | All Users | Send staff message; server saves to DB and broadcasts via WebSocket |
| `POST` | `/api/chat/query` | All Users | Send natural language prompt to the Groq Inventory Analytics Agent |

#### `POST /api/chat/query`
* **Request Body:**
  ```json
  {
    "query": "Which products are currently below safety threshold and need urgent reorders?"
  }
  ```
* **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "answer": "### Critical Stockout Risks\n| Product | Current Stock | Safety Threshold |\n|---|---|---|\n| Ultra-Wide 4K Monitor | 2 | 5 |",
    "metrics": {
      "totalProducts": 18,
      "lowStockCount": 3,
      "valuation": 84250.00
    }
  }
  ```

---

## 👥 9. User Management & RBAC (`/api/users`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | All Users | Get current authenticated user's profile and assigned role |
| `GET` | `/api/users` | `ADMIN`, `MANAGER` | List all staff, manager, and administrator accounts |
| `POST` | `/api/users` | `ADMIN`, `MANAGER` | Create new staff or manager account with role assignment |

---

## 💰 10. Customer Service & Refund AI Agent (`/api/refunds`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/refunds/process` | All Users | Run Groq AI reasoning agent on a customer refund request |
| `GET` | `/api/refunds` | All Users | List all customer refund claims and evaluation status |
| `POST` | `/api/refunds/:id/decide` | `ADMIN`, `MANAGER` | Submit human override/decision on escalated refund claims |
| `POST` | `/api/refunds/:id/send-email` | `ADMIN`, `MANAGER` | Dispatch customer notification email for a specific claim |
| `POST` | `/api/refunds/send-email` | `ADMIN`, `MANAGER` | Direct email dispatch route with custom customer body |

#### Autonomous Refund Guardrails:
* Low-risk claims (`<= $150`, within return window, unopened condition) are **auto-approved**.
* High-risk or policy-exceeding claims are paused in `PENDING_APPROVAL` with an AI-generated explanation and email draft ready for manager review.

---

## 📑 11. Vendor RFP & PDF Intelligence (`/api/vendor-evaluations`)

### Endpoints Matrix
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vendor-evaluations/samples` | All Users | List pre-generated test sample vendor quotation PDFs |
| `POST` | `/api/vendor-evaluations/evaluate` | All Users | Upload up to 20 quote files (PDF/TXT/CSV); runs text extraction and LLM comparison |
| `POST` | `/api/vendor-evaluations/send-email` | All Users | Send official award email to chosen supplier via Brevo/Nodemailer |
| `POST` | `/api/vendor-evaluations/send-sms` | All Users | Send SMS notification to winning vendor via Twilio |
| `GET` | `/api/vendor-evaluations` | All Users | List all historical multi-vendor RFP evaluations |
| `GET` | `/api/vendor-evaluations/:id` | All Users | Retrieve full evaluation matrix, scoring, and recommendation report |
| `DELETE` | `/api/vendor-evaluations/:id` | `ADMIN`, `MANAGER` | Remove historical evaluation record from archive |

---

## ⚡ 12. Real-Time WebSocket Events (Socket.IO)

The backend runs Socket.IO concurrently on the primary HTTP port (`http://localhost:5000` / `ws://localhost:5000`).

### Inbound Events (Client $\to$ Server)
* `send_message`: Dispatches new message payload `{ senderId: number, message: string }`.

### Outbound Events (Server $\to$ Client)
* `chat_message`: Emitted to all active clients when a staff or system message is saved.
* `data_updated`: Emitted whenever inventory changes, stock is received, or a restock request is created. Triggers instant Redux async thunk refetch in the frontend without full-page reloads.
* `vendor:evaluated`: Emitted when an asynchronous multi-document vendor quotation analysis finishes.

---

## 📖 Interactive Swagger OpenAPI Explorer
Interactive documentation with live "Try it out" test runners is accessible at:
```
http://localhost:5000/api-docs
```
