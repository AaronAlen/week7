# Postman Collection Guide

## Import & Usage

1. Open Postman.
2. Click **Import** and select `postman/stockpilot.postman_collection.json`.
3. Set environment variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `accessToken`: (populated after Login request)
   - `refreshToken`: (populated after Login request)
   - `threadId`: (populated when triggering HITL restock request)

## Request Folders

- **Authentication**: Register Admin, Login, Refresh Token.
- **Products**: Get Catalog, Create Product, Upload Image.
- **Inventory & Sales**: Record Sale, Query Transactions.
- **Restock & LangGraph Agent**: Trigger Restock Agent, Approve Restock (Resume HITL), Receive Stock.
- **Agent Audit Logs**: Get Agent Logs.
