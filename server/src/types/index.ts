export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductAttributes {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  safetyThreshold: number;
  targetStock: number;
  unitCost: number;
  supplierName: string;
  supplierEmail: string;
  supplierPhone?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryTransactionAttributes {
  id?: number;
  productId: number;
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes?: string;
  performedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestockRequestAttributes {
  id?: number;
  productId: number;
  quantity: number;
  totalCost: number;
  status: 'PENDING' | 'AWAITING_APPROVAL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PO_GENERATED' | 'COMPLETED' | 'CANCELLED';
  threadId?: string;
  reason?: string;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseOrderAttributes {
  id?: number;
  poNumber?: string;
  restockRequestId?: number;
  productId: number;
  supplierName: string;
  supplierEmail: string;
  supplierPhone?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  sentAt?: Date;
  expectedDeliveryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApprovalsQueueAttributes {
  id?: number;
  restockRequestId: number;
  threadId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AgentLogAttributes {
  id?: number;
  productId?: number;
  restockRequestId?: number;
  action: string;
  status: string;
  message: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessageAttributes {
  id?: number;
  senderId: number;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GroqRestockDecision {
  recommendedQuantity: number;
  totalCost: number;
  burnRatePerDay: number;
  daysUntilStockout: number;
  urgency: 'CRITICAL' | 'MODERATE' | 'LOW';
  financialRiskAssessment: string;
  executiveSummary: string;
  requiresHumanApproval: boolean;
}
