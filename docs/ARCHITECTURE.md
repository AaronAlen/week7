# Application Architecture

## High-Level Diagram

```text
React + Tailwind Frontend
          │
          │ REST API & WebSockets
          ↓
Express.js Backend (Node.js)
          │
 ┌────────┼─────────────┬────────────────┐
 ↓        ↓             ↓                ↓
Auth   Inventory     Restock         Socket.IO
 │        │             │                │
 ↓        ↓             ↓                ↓
JWT    MySQL/SQLite  LangGraph       Real-Time
RBAC   Transactions  Workflow         Chat
          │             │
          │      ┌──────┴──────┐
          │      ↓             ↓
          │   Auto PO      HITL Approval
          │   (≤$1000)       (>$1000)
          │      ↓             ↓
          │      └──────┬──────┘
          │             ↓
          │        Supplier Email (Nodemailer)
          │
          ├── File Upload (Multer)
          ├── Agent Activity Logs
          └── Swagger API Specs (/api-docs)
```

## Architectural Layers

1. **Presentation Layer (Client)**: Built with React, Vite, and Tailwind CSS. State is managed via Context API (`AuthContext`, `SocketContext`).
2. **REST API & Controller Layer (Server)**: Built with Express.js. Implements authentication middlewares (`authenticateToken`), authorization (`authorizeRoles`), input validation (`zod`), and file uploads (`multer`).
3. **Workflow Orchestration Engine**: Built with LangGraph.js (`@langchain/langgraph`). Manages state graph execution, conditional routing, and `interrupt()` pauses for HITL approval.
4. **Database & Persistence Layer**: ORM abstraction using Sequelize over MySQL/SQLite. Guarantees ACID transaction semantics (`BEGIN`, `COMMIT`, `ROLLBACK`) for stock mutations.
