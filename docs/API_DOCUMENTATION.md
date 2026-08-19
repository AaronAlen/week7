# API Documentation

The StockPilot Express server exposes clean RESTful endpoints secured by JWT tokens and RBAC middleware. Interactive Swagger specs are available at `/api-docs`.

## Endpoint Summary

### Authentication Routes
- `POST /api/auth/register`: Register user (`ADMIN`, `MANAGER`, `STAFF`).
- `POST /api/auth/login`: Authenticate email & password, returns `accessToken` and `refreshToken`.
- `POST /api/auth/refresh`: Exchange refresh token for new access token.
- `POST /api/auth/logout`: Invalidate session on client.

### Product Routes
- `GET /api/products`: List all catalog products with calculated stock status.
- `GET /api/products/:id`: Get product details, history, and restock logs.
- `POST /api/products`: Create product (Requires `ADMIN` or `MANAGER`).
- `PUT /api/products/:id`: Update product parameters (Requires `ADMIN` or `MANAGER`).
- `DELETE /api/products/:id`: Delete product (Requires `ADMIN`).
- `POST /api/products/:id/image`: Upload product image (Multer multipart form).

### Inventory Routes
- `POST /api/inventory/sell`: Record sale and reduce stock.
- `POST /api/inventory/adjust`: Manual stock adjustment.
- `GET /api/inventory/transactions`: Query transaction history.

### Restock & LangGraph Agent Routes
- `GET /api/restocks`: List restock requests.
- `POST /api/restocks/trigger`: Trigger LangGraph workflow for a low-stock product.
- `POST /api/approve-restock`: Resume interrupted HITL workflow (`{ threadId, approved }`).
- `POST /api/restocks/:id/retry`: Manually retry a rejected restock workflow.
- `POST /api/restocks/:id/receive`: Receive delivered stock via ACID transaction.

### Agent Logs & Purchase Orders
- `GET /api/agent-logs`: Fetch audit stream of agent workflow steps.
- `GET /api/purchase-orders`: Fetch purchase order records.

### Chat Routes
- `GET /api/chat/messages`: Fetch real-time chat history.
- `POST /api/chat/messages`: Send chat message.
