# StockPilot – Intelligent Inventory Restock Management System

> **Smart Inventory. Automated Restocking. Human Control.**

StockPilot is a full-stack inventory restock management system built with **React**, **Tailwind CSS**, **Node.js**, **Express.js**, **SQL database**, **Socket.IO**, **Nodemailer**, and **LangGraph.js** featuring **Human-in-the-Loop (HITL) approval workflows**.

---

## 🌟 Key Features

- **Product Catalog Management**: Manage products, stock levels, safety thresholds, target stocks, unit costs, and supplier contact details.
- **Product Image Upload**: Upload catalog product images using Multer (`POST /api/products/:id/image`).
- **Sales & Stock Transactions**: Record sales, adjust stock, and automatically calculate low-stock status (`NORMAL`, `LOW_STOCK`, `OUT_OF_STOCK`).
- **LangGraph Agent Workflow**: Stateful restock evaluation using LangGraph nodes, memory saver state checkpointers, and business logic calculations.
- **Human-in-the-Loop (HITL) Approval**: Automatic PO creation and email dispatch for orders $\le \$1000$. Workflow interruption (`interrupt()`) for high-value orders ($> \$1000$) requiring explicit admin approval.
- **Rejection Handling without Infinite Loops**: Rejections mark requests as `REJECTED` while leaving products in `LOW_STOCK` without entering endless approval loops.
- **Receive Stock Workflow**: Execute ACID SQL transactions (`BEGIN` $\to$ stock increase $\to$ inventory transaction $\to$ PO marked `RECEIVED` $\to$ `COMMIT`).
- **Real-Time Admin Chat**: Real-time staff/admin communications using Socket.IO, persisted in MySQL/SQLite.
- **JWT & Role-Based Access Control (RBAC)**: Dual-token authentication (Access + Refresh) protecting routes across `ADMIN`, `MANAGER`, and `STAFF` roles.
- **Swagger / OpenAPI Documentation**: Interactive API documentation at `/api-docs`.
- **Automated Verification Test Suite**: Automated test suite (`npm test`) validating all 8 core scenarios.

---

## 🏗️ High-Level Application Architecture

```text
React + Tailwind Frontend (Port 5173 / Vite)
          │
          │ REST API & WebSockets
          ↓
Express.js Backend (Port 5000)
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

---

## 🛠️ Technology Stack

- **Language**: JavaScript ES Modules (`.js`). No TypeScript.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, Socket.IO Client.
- **Backend**: Express.js (Node.js), Socket.IO, Multer, Nodemailer, Zod, Bcrypt, JsonWebToken.
- **Agent Workflow Engine**: `@langchain/langgraph` (v0.2+), `@langchain/core`.
- **Database Layer**: Sequelize ORM over MySQL/SQLite with ACID transaction semantics.
- **Documentation**: Swagger OpenAPI (`swagger-ui-express`, `swagger-jsdoc`), Postman Collection.

---

## 🚀 Quick Start Guide

### 1. Installation
Install all root, backend, and frontend dependencies:
```bash
npm run install:all
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Seed Sample Database
Initialize database tables and seed sample products and demo users:
```bash
npm run seed
```

### 4. Run Automated Test Suite
Verify all 8 core inventory, LangGraph agent, HITL approval, and transaction scenarios:
```bash
npm test
```

### 5. Start Development Application
Launch Express server and Vite frontend concurrently:
```bash
npm run dev
```

- **React Frontend**: `http://localhost:5173`
- **Express Backend API**: `http://localhost:5000`
- **Swagger API Docs**: `http://localhost:5000/api-docs`

---

## 🔑 Demo Account Credentials

Default accounts seeded by `npm run seed` (Password for all: `password123`):

- **Admin Account**: `admin@stockpilot.io` (Role: `ADMIN`)
- **Manager Account**: `manager@stockpilot.io` (Role: `MANAGER`)
- **Staff Account**: `staff@stockpilot.io` (Role: `STAFF`)

---

## 📚 Project Documentation Map

Detailed documentation files are available in the `docs/` directory:

- [`docs/IMPLEMENTATION_PLAN.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/IMPLEMENTATION_PLAN.md) — Technical Implementation Plan
- [`docs/ARCHITECTURE.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/ARCHITECTURE.md) — System Architecture Details
- [`docs/DATABASE_DESIGN.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/DATABASE_DESIGN.md) — Relational SQL Database Schema & ACID Design
- [`docs/API_DOCUMENTATION.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/API_DOCUMENTATION.md) — REST API Endpoints Reference
- [`docs/AUTHENTICATION.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/AUTHENTICATION.md) — JWT Access & Refresh Token Architecture
- [`docs/RBAC.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/RBAC.md) — Role-Based Access Control Permissions Matrix
- [`docs/LANGGRAPH_WORKFLOW.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/LANGGRAPH_WORKFLOW.md) — LangGraph State Graph & Nodes
- [`docs/HITL_WORKFLOW.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/HITL_WORKFLOW.md) — Human-in-the-Loop Interrupt & Approval Logic
- [`docs/INVENTORY_WORKFLOW.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/INVENTORY_WORKFLOW.md) — Stock Mutations & Receive Stock ACID Transactions
- [`docs/FILE_UPLOAD.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/FILE_UPLOAD.md) — Multer Product Image Upload Guide
- [`docs/WEBSOCKET_CHAT.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/WEBSOCKET_CHAT.md) — Socket.IO Real-Time Chat Engine
- [`docs/TESTING.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/TESTING.md) — Automated Test Suite Guide
- [`docs/SECURITY_AUDIT.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/SECURITY_AUDIT.md) — Security Audit Controls
- [`docs/POSTMAN_GUIDE.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/POSTMAN_GUIDE.md) — Postman API Collection Setup
- [`docs/DEPLOYMENT_GUIDE.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/DEPLOYMENT_GUIDE.md) — Production Deployment Steps
- [`docs/WEEKLY_CONCEPT_MAPPING.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/WEEKLY_CONCEPT_MAPPING.md) — Detailed Weeks 1–7 Concept Mapping
- [`docs/WALKTHROUGH.md`](file:///c:/Users/aaron/Desktop/gwc/week7/docs/WALKTHROUGH.md) — Final Walkthrough & Test Results Report
