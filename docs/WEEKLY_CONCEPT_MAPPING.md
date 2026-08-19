# Weekly Concept Mapping (Weeks 1 – 7)

This document maps all core curriculum concepts from Weeks 1 through 6 to their concrete implementations in StockPilot, demonstrating how Week 7 builds upon the complete full-stack foundation.

---

## Week 1: HTML5, CSS3 & Responsive Web Design

| Concept | Implementation Location | File Reference | Demonstration / Functionality |
| :--- | :--- | :--- | :--- |
| **Semantic HTML5** | Navigation & Page Structure | [`Navbar.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/components/Navbar.jsx), [`Sidebar.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/components/Sidebar.jsx), [`DashboardLayout.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/layouts/DashboardLayout.jsx) | Uses `<header>`, `<aside>`, `<main>`, `<nav>`, `<form>`, `<table>` tags for clean accessible structure. |
| **CSS3 & Tailwind Utility Styling** | Global Styles & Typography | [`index.css`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/index.css), [`tailwind.config.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/tailwind.config.js) | Dark mode aesthetic, custom scrollbars, cohesive color tokens (`slate-900`, `blue-600`, `emerald-500`). |
| **Flexbox & Grid Layouts** | Dashboard Metrics & Product Catalog | [`Dashboard.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/Dashboard.jsx), [`Products.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/Products.jsx) | Responsive multi-column stat card grids and product card matrices (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). |
| **Responsive Media Queries** | Mobile Sidebar & Responsive Layouts | [`Sidebar.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/components/Sidebar.jsx), [`Navbar.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/components/Navbar.jsx) | Seamless scaling across mobile, tablet, and desktop viewports. |
| **HTML Forms & Validation** | Authentication & Product Management | [`Login.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/Login.jsx), [`AddProduct.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/AddProduct.jsx) | Input types (`email`, `number`, `file`), required fields, step increments. |

---

## Week 2: Modern React Fundamentals

| Concept | Implementation Location | File Reference | Demonstration / Functionality |
| :--- | :--- | :--- | :--- |
| **React Components** | Reusable UI Elements | [`StatusBadge.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/components/StatusBadge.jsx) | Standardized badge component rendering status indicators for stock, restocks, and purchase orders. |
| **Props & Component Composition** | Layout Wrappers & Badges | [`DashboardLayout.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/layouts/DashboardLayout.jsx) | Passes children, user context, and action handlers between layout components. |
| **useState Hook** | Form State & Modal Visibility | [`Products.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/Products.jsx), [`Inventory.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/Inventory.jsx) | Manages sale quantities, input values, upload progress, loading states, and error alerts. |
| **useEffect Hook** | Data Fetching & Subscriptions | [`Dashboard.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/Dashboard.jsx), [`Chat.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/Chat.jsx) | Executes REST API data loading on component mount and subscribes to Socket.IO events. |
| **useContext Hook** | Global App State Management | [`AuthContext.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/context/AuthContext.jsx), [`SocketContext.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/context/SocketContext.jsx) | Shares user auth token state and active WebSocket connection across all component trees. |
| **Controlled Forms** | Product & Inventory Forms | [`AddProduct.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/AddProduct.jsx) | Binds form input state directly to React component state with instant change handlers. |
| **Conditional Rendering** | HITL Approval Banner & Roles | [`PendingApprovals.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/PendingApprovals.jsx) | Dynamically renders warning alerts and action buttons based on status and user roles. |

---

## Week 3: Frontend Tooling & API Interaction

| Concept | Implementation Location | File Reference | Demonstration / Functionality |
| :--- | :--- | :--- | :--- |
| **Vite Dev Server & Proxy** | Development Build System | [`vite.config.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/vite.config.js) | Configures HMR and proxies `/api` calls to Express server on port 5000. |
| **Axios HTTP Client** | API Request Abstraction | [`api.js`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/services/api.js) | Centralized Axios instance with base URL, token authorization headers, and auto-refresh interceptors. |
| **Postman API Testing** | REST Collection Specs | [`stockpilot.postman_collection.json`](file:///c:/Users/aaron/Desktop/gwc/week7/postman/stockpilot.postman_collection.json) | Complete Postman collection covering auth, products, sales, restocks, HITL approvals, and logs. |

---

## Week 4: Express REST APIs & WebSockets

| Concept | Implementation Location | File Reference | Demonstration / Functionality |
| :--- | :--- | :--- | :--- |
| **RESTful API Design** | Express Endpoints | [`productRoutes.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/routes/productRoutes.js), [`inventoryRoutes.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/routes/inventoryRoutes.js) | standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) with JSON payload responses. |
| **WebSocket Real-Time Chat** | Socket.IO Server & Client | [`server.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/server.js), [`Chat.jsx`](file:///c:/Users/aaron/Desktop/gwc/week7/client/src/pages/Chat.jsx) | Enables instant multi-user messaging between staff and admins with automatic DB persistence. |
| **Environment Variables** | Configuration Validation | [`env.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/config/env.js) | Uses Zod to parse and validate `.env` configuration keys at server startup. |

---

## Week 5: Node.js, Middleware & File Uploads

| Concept | Implementation Location | File Reference | Demonstration / Functionality |
| :--- | :--- | :--- | :--- |
| **Express Middleware** | Custom & Global Handlers | [`auth.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/middleware/auth.js), [`errorHandler.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/middleware/errorHandler.js) | Handles JWT authentication, request validation, static file serving, and global error catching. |
| **File Upload System** | Product Catalog Images | [`upload.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/middleware/upload.js), [`productController.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/controllers/productController.js) | Multer middleware validating image mime-types and 5MB size limits, serving files statically from `/uploads`. |
| **Zod Schema Validation** | Request Body Sanitization | [`validate.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/middleware/validate.js), [`authController.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/controllers/authController.js) | Validates API request bodies against strict Zod type constraints before processing logic. |

---

## Week 6: Databases, SQL Transactions, JWT & RBAC

| Concept | Implementation Location | File Reference | Demonstration / Functionality |
| :--- | :--- | :--- | :--- |
| **Relational SQL Database** | Sequelize Models & Schema | [`models/index.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/models/index.js), [`database.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/config/database.js) | Relational schema with foreign keys, indexes, and dual dialect support (MySQL & SQLite). |
| **ACID Database Transactions** | Stock Sales & Receiving | [`inventoryService.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/services/inventoryService.js) | Uses `sequelize.transaction()` (`BEGIN`, `COMMIT`, `ROLLBACK`) to guarantee stock consistency. |
| **JWT & Refresh Tokens** | Authentication Utilities | [`jwt.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/utils/jwt.js), [`authController.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/controllers/authController.js) | Dual-token authentication with short-lived access tokens and 7-day refresh tokens. |
| **Bcrypt Password Hashing** | Password Security | [`authController.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/controllers/authController.js), [`seed.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/db/seed.js) | Hashes passwords with salt factor 10 before saving to database. |
| **Role-Based Access Control** | Authorization Scoping | [`rbac.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/middleware/rbac.js) | Restricts sensitive routes based on user role (`ADMIN`, `MANAGER`, `STAFF`). |

---

## Week 7: LangGraph Agent & Human-in-the-Loop Orchestration

| Concept | Implementation Location | File Reference | Demonstration / Functionality |
| :--- | :--- | :--- | :--- |
| **LangGraph State Graph** | Workflow Definition | [`agentGraph.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/agent/agentGraph.js), [`state.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/agent/state.js) | StateGraph with memory checkpointer orchestrating multi-node restock evaluation. |
| **Stateful Nodes** | Reorder & Cost Evaluator | [`evaluateStockNode.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/agent/nodes/evaluateStockNode.js), [`executeRestockNode.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/agent/nodes/executeRestockNode.js) | Calculates reorder quantities, order costs, and executes PO creation & email dispatch. |
| **Human-in-the-Loop Interrupt** | Approval Pause & Resume | [`humanApprovalNode.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/agent/nodes/humanApprovalNode.js), [`agentService.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/services/agentService.js) | Uses `interrupt()` to pause orders > $1000 and `Command({ resume })` to resume workflow on admin approval. |
| **Nodemailer PO Email Tool** | Supplier Communication | [`emailService.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/services/emailService.js) | Automatically formats and dispatches purchase order emails to suppliers. |
| **OpenAPI / Swagger Specs** | API Documentation | [`swagger.js`](file:///c:/Users/aaron/Desktop/gwc/week7/server/src/config/swagger.js) | Generates interactive API documentation accessible at `/api-docs`. |
