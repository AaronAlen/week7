# 🏛️ StockPilot System Architecture & Infrastructure

StockPilot is an Autonomous Enterprise Inventory Management, Procurement & Operations Intelligence Platform. It couples deterministic mathematical supply chain calculation with semantic Groq LLM intelligence, Human-in-the-Loop (HITL) executive boundaries, and centralized Redux Toolkit state synchronization.

---

## 1. High-Level Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    REACT 18 + VITE + TAILWIND FRONTEND                  │
│  • Redux Toolkit 2.x (createAsyncThunk)  • Live Database Telemetry      │
│  • Animated Recharts (Bar / Area / Pie)  • Operations AI Copilot        │
│  • WebSocket Client (Socket.IO)          • Theme & Responsive Glassmorphism│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST API (Axios Interceptors) / WSS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS.JS BACKEND ENGINE                         │
│  ┌───────────────────────┬────────────────────────┬───────────────────┐ │
│  │ Dual-Token JWT & RBAC │ Zod Input Validation   │ WebSockets Server │ │
│  ├───────────────────────┼────────────────────────┼───────────────────┤ │
│  │ 11 Modular REST Suites│ Multer & pdf-parse     │ Swagger UI Docs   │ │
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
│ • Full Audit │             │ • Refund &   │             │              │
│   Ledger     │             │   Claims AI  │             │              │
└──────────────┘             └──────────────┘             └──────────────┘
```

---

## 2. Core Architectural Subsystems

### 1. Presentation & State Management Layer (Client)
* **Framework**: React 18 with Vite, TypeScript, and Tailwind CSS.
* **Redux Toolkit 2.x Architecture**:
  * Centralized state store managing 7 distinct slices (`auth`, `products`, `inventory`, `restocks`, `approvals`, `chat`, `theme`).
  * Asynchronous API dispatches managed via `createAsyncThunk` with structured `pending`, `fulfilled`, and `rejected` lifecycles.
  * Strongly-typed custom hooks (`useAppDispatch` and `useAppSelector`) guaranteeing type safety and IDE autocomplete.
* **Reactive Real-time Synchronization**:
  * Socket.IO client listening to global `data_updated` signals emitted by the backend.
  * Seamlessly refetches Redux store slices without full-page reloads when inventory shifts or orders change state.

### 2. Deterministic Mathematical Restock Engine
* **Zero-Latency Compute**: Calculates dynamic sales velocity, burn rate, days until stockout, and economic reorder quantities using pure arithmetic (no LLM latency or non-determinism).
* **HITL Financial Boundary**:
  * Automatically creates and dispatches purchase orders when total cost $\le \$1,000$.
  * Pauses orders $> \$1,000$ in `PENDING_APPROVAL` with executive email alerts, requiring human manager sign-off.

### 3. Semantic AI Agents (Groq LLM Reasoning)
* **Operations Analytics Copilot (`/api/chat/query`)**: Translates natural language inquiries into real-time database queries, rendering structured markdown summaries, tables, and KPI callouts via the custom `<FormattedAiResponse />` client engine.
* **Vendor Quotation RFP Agent (`/api/vendor-evaluations/evaluate`)**: Uses `pdf-parse` to extract unstructured vendor quote texts and prompts Groq LLMs to analyze multi-quote tradeoffs across unit pricing, MOQs, delivery windows, warranty, and defect SLAs.
* **Refund Claims Agent (`/api/refunds/process`)**: Evaluates return claims against return policy windows and product conditions, auto-approving low-risk claims ($\le \$150$) and drafting empathetic customer emails.

### 4. ACID Transactional Integrity & Database Layer
* Powered by Sequelize ORM over MySQL (production) or SQLite (development).
* Every inventory sale (`POST /api/inventory/sell`), manual count adjustment (`POST /api/inventory/adjust`), and restock receipt (`POST /api/restocks/:id/receive`) runs inside atomic transactions (`transaction.commit()` / `transaction.rollback()`), guaranteeing that stock counts and audit logs never desynchronize.

### 5. Multi-Channel Notification Layer
* **Brevo HTTPS REST API (Port 443)**: Native HTTP API client bypassing cloud host firewall blocks on outbound SMTP ports (587/465).
* **Nodemailer SMTP Fallback**: Standard SMTP transport fallback for local or containerized mail servers.
* **Twilio SMS Gateway**: Dispatches urgent procurement notifications and supplier alerts directly to mobile devices.
