# Implementation Plan: StockPilot Inventory Restock System

StockPilot is a full-stack inventory restock management system built with React, Tailwind CSS, Express.js, SQL database, Socket.IO, Nodemailer, and **LangGraph.js** featuring Human-in-the-Loop (HITL) approval workflows.

## System Objectives

- Automate low-stock product detection and reorder calculations using business logic rules.
- Orchestrate stateful restock workflows using LangGraph.js nodes and memory checkpointers.
- Enforce strict Human-in-The-Loop approval interrupts for high-value orders (> $1000).
- Maintain ACID relational database transactions when recording sales and receiving delivered stock.
- Provide real-time communication between administrators and staff using WebSockets (Socket.IO).
- Enable secure file uploads for product catalog images using Multer.

## Tech Stack & Language Standards

- **Language**: Standard JavaScript ES Modules (`.js`). No TypeScript.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons, Axios, Socket.IO Client.
- **Backend**: Express.js (Node.js), Socket.IO, Multer, Nodemailer, Zod, Bcrypt, JsonWebToken.
- **Workflow Engine**: `@langchain/langgraph` (v0.2+) with `MemorySaver` and `interrupt()`.
- **Database**: Relational SQL models with foreign keys, indexes, and full ACID database transactions (`BEGIN`, `COMMIT`, `ROLLBACK`). Configured for MySQL with SQLite fallback for seamless execution.
