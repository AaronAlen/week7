# 🚀 StockPilot – Intelligent Autonomous Inventory Restock & Procurement System

> **Autonomous Inventory Management. Deterministic Supply Chain Logic. Semantic AI Intelligence. Human-in-the-Loop Control.**

StockPilot is an enterprise-grade Autonomous Inventory Management, Procurement, and Operations Intelligence platform built with **React 18**, **TypeScript**, **Redux Toolkit (Async Thunks)**, **Tailwind CSS**, **Recharts**, **Node.js**, **Express.js (42 REST Endpoints)**, **Sequelize ORM (ACID Transactions)**, **Socket.IO**, **Groq AI (LLaMA 3.3 / GPT-OSS)**, and **Brevo REST API**.

---

## 🌟 Key Features

- **📊 Animated Executive Analytics Dashboard**: Real-time KPI telemetry with animated number counters, interactive animated Stock Capacity vs Safety Threshold Bar Graphs, Asset Valuation Area Charts, and Inventory Health Donut Charts powered by Recharts.
- **⚡ Deterministic Restock Engine**: High-performance mathematical supply chain calculation engine computing dynamic sales velocity, days until stockout, and economic reorder quantities with zero LLM latency.
- **🛡️ Human-in-the-Loop (HITL) Guardrails**: Automated Purchase Order creation and dispatch for orders $\le \$1,000$. Workflow boundary enforcement for high-value orders ($> \$1,000$) pausing in `PENDING_APPROVAL` for Administrator review.
- **🧠 Operations Intelligence AI Copilot**: Natural language conversational assistant querying live database tables to provide instant insights on stockout risks, revenue trends, and supplier performance.
- **📄 Supplier & RFP Quotation Intelligence Agent**: Uploads and extracts text from supplier quotation PDFs using `pdf-parse` and evaluates competitive proposals across pricing, MOQs, warranty, defect SLAs, and ISO compliance via Groq LLM.
- **💰 Customer Service & Refund Agent**: Evaluates return requests against store policies, auto-approving low-risk claims ($\le \$150$) and generating personalized customer email drafts.
- **🔄 Centralized Redux Toolkit Architecture**: Fully modernized frontend state management using Redux Toolkit `createAsyncThunk` across 7 slices with real-time WebSocket state reconciliation.
- **📧 Zero-Timeout Universal Email Dispatcher**: Supports **Brevo HTTPS REST API (Port 443)** to completely eliminate cloud firewall SMTP port 587 timeouts on Render/AWS/DigitalOcean, with fallback to standard SMTP relay and Twilio SMS.
- **🔒 ACID Transactional Integrity**: Guarantees zero stock corruption across sales, adjustments, and deliveries via atomic database transactions (`BEGIN` $\to$ stock update $\to$ transaction log $\to$ `COMMIT`).
- **💬 Real-Time Staff Communication**: WebSockets chat stream powered by Socket.IO for warehouse staff coordination.
- **🔐 JWT Dual-Token RBAC Security**: Granular access control across `ADMIN`, `MANAGER`, and `STAFF` roles with auto-refreshing JWTs.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    REACT + VITE + TAILWIND FRONTEND                     │
│  • Redux Toolkit (createAsyncThunk)  • Operations AI Copilot            │
│  • Animated Recharts (Bar/Area/Pie)  • WebSockets Staff Communication   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST API (Axios) / WSS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS.JS BACKEND ENGINE                         │
│  ┌───────────────────────┬────────────────────────┬───────────────────┐ │
│  │ JWT & RBAC Middleware │ Input Validation (Zod) │ WebSockets Server │ │
│  ├───────────────────────┼────────────────────────┼───────────────────┤ │
│  │ 42 REST API Endpoints │ Multer & pdf-parse     │ Swagger UI Docs   │ │
│  └───────────────────────┴────────────────────────┴───────────────────┘ │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  DATABASE    │             │  AI AGENTS   │             │ NOTIFICATION │
│ PERSISTENCE  │             │  REASONING   │             │   GATEWAY    │
├──────────────┤             ├──────────────┤             ├──────────────┤
│ • MySQL /    │             │ • Groq LLMs  │             │ • Brevo REST │
│   SQLite     │             │ • Operations │             │   API (443)  │
│ • Sequelize  │             │   Copilot    │             │ • Brevo SMTP │
│ • ACID Atomic│             │ • Vendor PDF │             │ • Twilio SMS │
│   Inventory  │             │   Evaluator  │             │   Alerts     │
│ • Audit Logs │             │ • Refund AI  │             │              │
└──────────────┘             └──────────────┘             └──────────────┘
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Redux Toolkit 2.x, Recharts, Lucide React, Axios, Socket.IO Client.
- **Backend**: Node.js, Express.js (42 endpoints), Socket.IO, Multer, `pdf-parse`, Nodemailer, Brevo REST API, Twilio SDK, Zod, Bcrypt, JsonWebToken.
- **AI & Reasoning Engine**: Groq Cloud SDK (`llama-3.3-70b-versatile`, `qwen/qwen3.8-27b`).
- **Database Layer**: Sequelize ORM over MySQL or SQLite with full ACID transaction semantics.
- **Documentation**: Swagger OpenAPI 3.0 UI (`/api-docs`), Markdown specification guides.

---

## 🚀 Quick Start Guide

### 1. Installation
Install all root, backend, and frontend dependencies:
```bash
npm run install:all
```

### 2. Environment Setup
Create your `.env` file in the root and server directory:
```bash
cp .env.example .env
```

Key environment variables:
```bash
PORT=5000
DB_DIALECT=sqlite # or mysql
GROQ_API_KEY=gsk_...
BREVO_API_KEY=xkeysib-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

### 3. Database Initialization & Seed
```bash
npm run seed
```

### 4. Start Development Servers
Launch both Express backend (Port 5000) and Vite frontend (Port 5173):
```bash
npm run dev
```

---

## 📚 Detailed Documentation

- 📘 **[Complete Master Project Documentation (All-in-One)](docs/MASTER_PROJECT_DOCUMENTATION.md)**
- 📡 [REST API Documentation & Endpoints (All 42 Endpoints)](docs/API_DOCUMENTATION.md)
- 🏛️ [System Architecture & Subsystems](docs/ARCHITECTURE.md)
- 🛡️ [Role-Based Access Control (RBAC) Specification](docs/RBAC.md)
- 🤖 [Autonomous AI Agents Architecture Guide](docs/AI_AGENTS_ARCHITECTURE.md)
- 📬 [Postman API Collection Guide](docs/POSTMAN_GUIDE.md)
- 🛡️ [Human-in-the-Loop Workflow Specification](docs/HITL_WORKFLOW.md)
- 📦 [Inventory Transaction & ACID Semantics](docs/INVENTORY_WORKFLOW.md)
- 📘 [JavaScript vs TypeScript Redux Cheatsheet](client/src/javascript-reference/README-TS-VS-JS.md)
- 🚀 [Cloud Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
