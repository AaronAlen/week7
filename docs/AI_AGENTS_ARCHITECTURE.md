# 🤖 StockPilot Autonomous AI Agents: Architecture & Operations Guide

> **Core Philosophy**: Replacing rigid, fragile `if/else` programmatic scripts with context-aware, reasoning digital employees operating under strict **Human-in-the-Loop (HITL)** guardrails.

---

## 📑 Table of Contents
1. [Why AI Agents Instead of Traditional Programmatic Code?](#1-why-ai-agents-instead-of-traditional-programmatic-code)
2. [The 3 Autonomous Back-Office Jobs Replaced](#2-the-3-autonomous-back-office-jobs-replaced)
3. [The 4-Stage Autonomous Decision Lifecycle](#3-the-4-stage-autonomous-decision-lifecycle)
4. [Agent Deep-Dives](#4-agent-deep-dives)
   - [Agent 1: Customer Support & Refund Processing Agent](#agent-1-customer-support--refund-processing-agent)
   - [Agent 2: Operations & Fraud Prevention Risk Agent](#agent-2-operations--fraud-prevention-risk-agent)
   - [Agent 3: Autonomous Restock Procurement Agent](#agent-3-autonomous-restock-procurement-agent)
   - [Agent 4: Natural Language Inventory & SQL Analytics Agent](#agent-4-natural-language-inventory--sql-analytics-agent)
5. [Human-in-the-Loop (HITL) Safety Guardrails & Thresholds](#5-human-in-the-loop-hitl-safety-guardrails--thresholds)
6. [Essential Technical Keywords & Glossary](#6-essential-technical-keywords--glossary)
7. [Database Models & API Route Specifications](#7-database-models--api-route-specifications)

---

## 1. Why AI Agents Instead of Traditional Programmatic Code?

### 🧩 The Fragility of Programmatic Code (`if/else`)
In traditional software engineering, business logic is hardcoded as deterministic conditional blocks:
```js
// ❌ Fragile Programmatic Approach
if (refundAmount <= 150 && daysSincePurchase <= 30) {
  approveRefund();
} else {
  denyOrEscalate();
}
```
**Why this fails in the real world:**
* **Cannot parse human emotion or nuance**: A customer saying *"The box looked like it was run over by a truck and arrived completely crushed on day 31"* gets rejected by rigid rules because `31 > 30`, destroying customer trust.
* **Combinatorial Explosion**: Real-world fraud involves 10+ interacting signals (velocity, stock drainage, geo-mismatch, account age). Writing programmatic permutations creates unmaintainable spaghetti code.
* **Zero Natural Language Output**: Code can calculate numbers, but cannot generate polite, brand-aligned, personalized emails or executive memos explaining *why* a decision was made.

### 🧠 The Power of AI Autonomous Agents
AI Agents utilize Large Language Models (LLMs) like **Groq LLaMA 3.3 70B** as a reasoning engine:
* **Semantic Comprehension**: Extracts structured intent from unstructured emails, reviews, or chat messages.
* **Holistic Multi-Factor Judgment**: Evaluates compounded risk factors simultaneously rather than sequentially.
* **Edge-Case Generalization**: Resolves unprecedented scenarios using general store policies rather than crashing.
* **Transparent Explainability**: Outputs structured audit reasoning for every action taken.

| Dimension | Programmatic Code (`if/else`) | Autonomous AI Agent (StockPilot) |
| :--- | :--- | :--- |
| **Input Flexibility** | Structured numbers & exact flags only | Free-form human text, unstructured metadata |
| **Edge-Case Handling** | Fails or requires manual code deployment | Generalizes contextually within policy guardrails |
| **Risk Assessment** | Single-variable hard limits | Compound probability scoring (0.00 – 1.00) |
| **Communication** | Static templates (`"Order #123 updated"`) | Dynamic, empathetic, context-rich prose |
| **Auditability** | Silent execution | Structured policy explanation & audit trail |

---

## 2. The 3 Autonomous Back-Office Jobs Replaced

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STOCKPILOT AI DIGITAL WORKFORCE                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ CUSTOMER SUPPORT │       │   FRAUD & RISK   │       │   SUPPLY CHAIN   │
│   (Tier 1 & 2)   │       │     ANALYST      │       │   COORDINATOR    │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ • Refund claims  │       │ • Burst orders   │       │ • Stock velocity │
│ • Damaged items  │       │ • Geo-mismatches │       │ • Reorder math   │
│ • Returns email  │       │ • Order freezing │       │ • Vendor POs     │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

1. **Customer Support Reps (Tier 1 & 2)**: Replaced by the Refund Agent. Evaluates claims, verifies return windows, auto-refunds eligible low-value items, and drafts human-quality replies in 3 seconds.
2. **Operations & Fraud Analysts**: Replaced by the Fraud Agent. Evaluates order metadata for inventory-draining bursts, cross-border card mismatches, and abnormal order volumes.
3. **Inventory & Purchasing Coordinators**: Replaced by the Restock Procurement Agent. Continuously monitors safety thresholds, calculates burn rates, drafts formal Purchase Orders, and dispatches supplier emails/SMS.

---

## 3. The 4-Stage Autonomous Decision Lifecycle

Every incoming event is processed through a strict 4-stage pipeline:

```
[ Incoming Webhook / Event / Order / Customer Request ]
                         │
                         ▼
             1. ROUTE (Semantic Intent)
           Extracts intent & parses entities
                         │
                         ▼
             2. REASON (Contextual Analysis)
      Fetches live DB records & policy parameters
                         │
                         ▼
             3. VERIFY (Safety Guardrails)
   Checks financial limits, risk scores, & thresholds
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 4a. AUTO-EXECUTE                  4b. PAUSE & ESCALATE
  (Safe / Below Threshold)         (High-Risk / Above Limit)
  • Issue refund / PO             • Freeze transaction
  • Update inventory DB           • Push alert to Dashboard
  • Send customer/vendor email    • Await 1-click Human Decision
```

---

## 4. Agent Deep-Dives

### Agent 1: Customer Support & Refund Processing Agent
* **Role**: Resolves customer return, damage, and refund requests autonomously.
* **4-Step Execution**:
  1. **ROUTE**: Classifies incoming inquiry into `REFUND_REQUEST`, `DAMAGE_CLAIM`, `EXCHANGE_REQUEST`, or `GENERAL_INQUIRY`.
  2. **REASON**: Evaluates item condition, days elapsed since purchase, and customer message context.
  3. **VERIFY**: Applies the **$150 Safety Threshold** and **30-Day Window**.
  4. **ACTION**:
     * *Auto-Approved* ($\le \$150$ and valid): Automatically updates inventory (if restockable), sets refund status to `APPROVED`, records audit log, and drafts customer confirmation email.
     * *Manager Escalation* ($> \$150$ or exception): Queues item in Human-in-the-Loop Command Center with policy memo.

---

### Agent 2: Operations & Fraud Prevention Risk Agent
* **Role**: Protects inventory and revenue against malicious purchases, account takeovers, and inventory-draining scalpers.
* **4-Step Execution**:
  1. **ROUTE**: Ingests order volume, total value, shipping address, billing country, and item velocity.
  2. **REASON**: Groq LLaMA 3.3 models composite risk indicators.
  3. **VERIFY**: Generates a **Compound Risk Score (0.00 – 1.00)**.
  4. **ACTION**:
     * *Score < 0.70 (Low/Medium Risk)*: Auto-approves order (`CLEARED_RELEASED`) for immediate warehouse fulfillment.
     * *Score $\ge 0.70$ (High Risk)*: **Freezes** the transaction (`PENDING_REVIEW`, `isFrozen: true`), flags compounding risk factors, and pushes an urgent notification to the admin dashboard.

---

### Agent 3: Autonomous Restock Procurement Agent
* **Role**: Eliminates stockouts and prevents overstocking by forecasting demand.
* **4-Step Execution**:
  1. **ROUTE**: Detects when product stock drops below `safetyThreshold`.
  2. **REASON**: Computes daily burn rate from sales history, calculates optimal reorder quantity to reach `targetStock`.
  3. **VERIFY**: Enforces the **$1,000 Purchase Order Threshold**.
  4. **ACTION**:
     * *Cost $\le \$1,000$*: Auto-creates Purchase Order, emails supplier via Nodemailer/SendGrid, sends SMS confirmation, and creates restock record.
     * *Cost $> \$1,000$*: Pauses in `ApprovalsQueue` (`AWAITING_APPROVAL`) and generates an executive risk memo for manager 1-click authorization.

---

### Agent 4: Natural Language Inventory & SQL Analytics Agent
* **Role**: Executive copilot embedded in Dashboard and Chat.
* **Execution**: Reads real-time SQL tables (`Product`, `InventoryTransaction`, `ApprovalsQueue`, `RefundRequest`, `FraudAlert`) and answers complex analytical queries (e.g. *"What are our fastest moving products?"*, *"What is our total capital exposure?"*).

---

### Agent 5: Autonomous Vendor Selection & Supplier Intelligence Agent
* **Role**: Evaluates competing supplier proposals, warranty terms, material grades, defect rates, and unit pricing by uploading raw RFP quote documents.
* **4-Step Execution**:
  1. **ROUTE**: Ingests multiple vendor proposals along with uploaded quote PDFs, specification sheets, and warranty contracts.
  2. **REASON**: Performs Multi-Criteria Decision Analysis (MCDA) across Price Competitiveness, Quality & Compliance, Warranty Coverage, and Lead Time Speed.
  3. **VERIFY**: Normalizes scoring (0-100) based on the user's strategic priority focus (`Balanced`, `Lowest Cost`, `Longest Warranty`, `Highest Quality`, `Fastest Delivery`).
  4. **ACTION**:
     * Highlights the **#1 Recommended Winner Supplier** with composite scoring.
     * Computes full estimated total contract values across target volume.
     * Identifies hidden risk clauses, SLA constraints, and defect penalties.
     * Generates an actionable **AI Counter-Offer Negotiation Strategy**.
     * Drafts a formal, ready-to-send business acceptance/negotiation letter.

---

## 5. Human-in-the-Loop (HITL) Safety Guardrails & Thresholds

| Domain | Autonomous Limit (Auto-Execute) | Human Gate (Pause & Escalate) | Manager Action |
| :--- | :--- | :--- | :--- |
| **Restock Procurement** | Total Cost $\le \$1,000.00$ | Total Cost $> \$1,000.00$ | 1-Click **Authorize & Dispatch PO** or **Reject** |
| **Customer Refunds** | Claim $\le \$150.00$ within 30 days | Claim $> \$150.00$ or policy exception | 1-Click **Approve & Issue Refund** or **Decline** |
| **Fraud Prevention** | Risk Score $< 0.70$ (Auto-Clear) | Risk Score $\ge 0.70$ (Auto-Freeze) | 1-Click **Verify & Release** or **Block Order** |
| **Supplier Intelligence** | Multi-Factor Composite Scoring | Strategic Contract Sign-off | 1-Click **Copy Email / Issue Counter-Offer** |
| **Fraud Prevention** | Risk Score $< 0.70$ | Risk Score $\ge 0.70$ | 1-Click **Verify & Release** or **Block & Cancel** |

---

## 6. Essential Technical Keywords & Glossary

* **Semantic Intent Classification**: Utilizing LLM embeddings and prompt taxonomy to identify the underlying user goal from unstructured text.
* **Multi-Factor Contextual Reasoning**: Analyzing interdependent data points simultaneously rather than running isolated binary checks.
* **Human-in-the-Loop (HITL)**: An architectural design pattern where high-stakes operations require explicit human authorization while routine low-stakes tasks execute autonomously.
* **Autonomous Execution vs Gated Escalation**: The bifurcated branching logic where decisions below calibrated risk thresholds self-execute, and those above pause for review.
* **Dynamic Policy Adaptation**: The ability of an agent to apply general policy guidelines to novel, unpredicted edge cases without code modifications.
* **Compound Risk Scoring**: Synthesizing multiple disparate risk indicators into a normalized floating-point score ($0.00 - 1.00$).
* **Decision Traceability & Audit Logging**: Persisting detailed reasoning steps alongside every automated database write for compliance and governance.

---

## 7. Database Models & API Route Specifications

### Core Models
* `Product`: Catalog items, safety thresholds, target stock levels, unit costs, supplier metadata.
* `RestockRequest` & `PurchaseOrder`: Autonomous and human-approved supply chain orders.
* `ApprovalsQueue`: Threaded approval records for human review.
* `RefundRequest`: Customer claims, return reasoning, AI policy memos, and email drafts.
* `FraudAlert`: Risk scores, compounding risk factors, frozen status, and review decisions.
* `AgentLog`: Immutable audit trail of every autonomous agent action and evaluation.

### API Endpoints
* `POST /api/refunds/process` — Trigger Customer Support AI Refund Agent.
* `GET /api/refunds` — Retrieve refund requests (filtered by status).
* `POST /api/refunds/:id/decide` — Human-in-the-loop refund decision (`APPROVE` | `REJECT`).
* `POST /api/fraud/analyze` — Trigger Operations Fraud Prevention Agent.
* `GET /api/fraud` — Retrieve fraud alerts (filtered by status).
* `POST /api/fraud/:id/decide` — Human-in-the-loop fraud decision (`RELEASE` | `CANCEL`).
* `POST /api/restocks/trigger` — Trigger Autonomous Procurement Agent.
* `POST /api/chat/query` — Natural Language SQL Database Analytics Agent.
