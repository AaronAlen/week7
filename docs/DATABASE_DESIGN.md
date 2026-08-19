# Database Design & Schema

## Overview

StockPilot relies on a relational SQL database schema managed via Sequelize. The system enforces foreign key integrity, indexes on frequently queried fields (e.g. `sku`, `email`, `productId`), and ACID transactions for stock consistency.

## Table Schemas

### 1. Users
- `id`: INTEGER PRIMARY KEY AUTO_INCREMENT
- `name`: VARCHAR(100) NOT NULL
- `email`: VARCHAR(150) UNIQUE NOT NULL
- `password`: VARCHAR(255) NOT NULL (Bcrypt hash)
- `role`: ENUM('ADMIN', 'MANAGER', 'STAFF') NOT NULL
- `createdAt`, `updatedAt`: DATETIME

### 2. Products
- `id`: INTEGER PRIMARY KEY AUTO_INCREMENT
- `name`: VARCHAR(150) NOT NULL
- `description`: TEXT
- `sku`: VARCHAR(50) UNIQUE NOT NULL
- `currentStock`: INTEGER NOT NULL DEFAULT 0
- `safetyThreshold`: INTEGER NOT NULL DEFAULT 10
- `targetStock`: INTEGER NOT NULL DEFAULT 50
- `unitCost`: DECIMAL(10,2) NOT NULL DEFAULT 0.00
- `supplierName`: VARCHAR(100) NOT NULL
- `supplierEmail`: VARCHAR(150) NOT NULL
- `image`: VARCHAR(255)
- `createdAt`, `updatedAt`: DATETIME

### 3. InventoryTransactions
- `id`: INTEGER PRIMARY KEY AUTO_INCREMENT
- `productId`: INTEGER NOT NULL (FK -> Products.id)
- `type`: ENUM('SALE', 'RESTOCK', 'ADJUSTMENT') NOT NULL
- `quantity`: INTEGER NOT NULL
- `previousStock`: INTEGER NOT NULL
- `newStock`: INTEGER NOT NULL
- `referenceId`: VARCHAR(100)
- `createdAt`: DATETIME

### 4. RestockRequests
- `id`: INTEGER PRIMARY KEY AUTO_INCREMENT
- `productId`: INTEGER NOT NULL (FK -> Products.id)
- `quantity`: INTEGER NOT NULL
- `totalCost`: DECIMAL(10,2) NOT NULL
- `status`: ENUM('PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')
- `requiresHumanReview`: BOOLEAN NOT NULL DEFAULT FALSE
- `createdBy`: INTEGER (FK -> Users.id)
- `createdAt`, `updatedAt`: DATETIME

### 5. PurchaseOrders
- `id`: INTEGER PRIMARY KEY AUTO_INCREMENT
- `restockRequestId`: INTEGER NOT NULL (FK -> RestockRequests.id)
- `productId`: INTEGER NOT NULL (FK -> Products.id)
- `quantity`: INTEGER NOT NULL
- `unitCost`: DECIMAL(10,2) NOT NULL
- `totalCost`: DECIMAL(10,2) NOT NULL
- `supplierName`: VARCHAR(100) NOT NULL
- `supplierEmail`: VARCHAR(150) NOT NULL
- `status`: ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'RECEIVED', 'CANCELLED')
- `createdAt`, `updatedAt`: DATETIME

### 6. ApprovalsQueue
- `id`: INTEGER PRIMARY KEY AUTO_INCREMENT
- `restockRequestId`: INTEGER NOT NULL (FK -> RestockRequests.id)
- `threadId`: VARCHAR(255) UNIQUE NOT NULL
- `status`: ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING'
- `approvedBy`: INTEGER (FK -> Users.id)
- `createdAt`, `updatedAt`: DATETIME

### 7. AgentLogs
- `id`: INTEGER PRIMARY KEY AUTO_INCREMENT
- `productId`: INTEGER (FK -> Products.id)
- `restockRequestId`: INTEGER (FK -> RestockRequests.id)
- `action`: VARCHAR(100) NOT NULL
- `status`: VARCHAR(50) NOT NULL
- `message`: TEXT NOT NULL
- `metadata`: JSON
- `createdAt`: DATETIME

### 8. ChatMessages
- `id`: INTEGER PRIMARY KEY AUTO_INCREMENT
- `senderId`: INTEGER NOT NULL (FK -> Users.id)
- `message`: TEXT NOT NULL
- `createdAt`: DATETIME
