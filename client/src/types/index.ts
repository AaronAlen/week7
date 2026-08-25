export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  safetyThreshold: number;
  targetStock: number;
  unitCost: number | string;
  supplierName: string;
  supplierEmail: string;
  supplierPhone?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes?: string;
  product?: Product;
  createdAt: string;
}

export interface RestockRequest {
  id: number;
  productId: number;
  quantity: number;
  totalCost: number | string;
  status: 'PENDING' | 'AWAITING_APPROVAL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PO_GENERATED' | 'COMPLETED' | 'CANCELLED';
  threadId?: string;
  reason?: string;
  product?: Product;
  purchaseOrder?: PurchaseOrder;
  approval?: ApprovalItem;
  creator?: User;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber?: string;
  restockRequestId?: number;
  productId: number;
  supplierName: string;
  supplierEmail: string;
  supplierPhone?: string;
  quantity: number;
  unitCost: number | string;
  totalCost: number | string;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  product?: Product;
  restockRequest?: RestockRequest;
  createdAt: string;
}

export interface ApprovalItem {
  id: number;
  restockRequestId: number;
  threadId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
  restockRequest?: RestockRequest;
  approver?: User;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentLog {
  id: number;
  productId?: number;
  restockRequestId?: number;
  action: string;
  status: string;
  message: string;
  metadata?: any;
  product?: Product;
  restockRequest?: RestockRequest;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  message: string;
  sender?: User;
  createdAt: string;
}

export interface AIAnalyticsResponse {
  success: boolean;
  answer: string;
  metrics: {
    totalProducts: number;
    lowStockCount: number;
    fastestMoving: string;
    valuation: string;
    pendingApprovals: number;
  };
}
