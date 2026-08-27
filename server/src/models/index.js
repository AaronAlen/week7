import sequelize from '../config/database.js';
import User from './User.js';
import Product from './Product.js';
import InventoryTransaction from './InventoryTransaction.js';
import RestockRequest from './RestockRequest.js';
import PurchaseOrder from './PurchaseOrder.js';
import ApprovalsQueue from './ApprovalsQueue.js';
import AgentLog from './AgentLog.js';
import ChatMessage from './ChatMessage.js';
import RefundRequest from './RefundRequest.js';
import FraudAlert from './FraudAlert.js';
import VendorEvaluation from './VendorEvaluation.js';

// Product & Transactions
Product.hasMany(InventoryTransaction, { foreignKey: 'productId', as: 'transactions' });
InventoryTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Restock Requests
Product.hasMany(RestockRequest, { foreignKey: 'productId', as: 'restockRequests' });
RestockRequest.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(RestockRequest, { foreignKey: 'createdBy', as: 'restockRequests' });
RestockRequest.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

RestockRequest.hasOne(PurchaseOrder, { foreignKey: 'restockRequestId', as: 'purchaseOrder' });
PurchaseOrder.belongsTo(RestockRequest, { foreignKey: 'restockRequestId', as: 'restockRequest' });

Product.hasMany(PurchaseOrder, { foreignKey: 'productId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

RestockRequest.hasOne(ApprovalsQueue, { foreignKey: 'restockRequestId', as: 'approval' });
ApprovalsQueue.belongsTo(RestockRequest, { foreignKey: 'restockRequestId', as: 'restockRequest' });

User.hasMany(ApprovalsQueue, { foreignKey: 'approvedBy', as: 'approvals' });
ApprovalsQueue.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Agent Logs
Product.hasMany(AgentLog, { foreignKey: 'productId', as: 'agentLogs' });
AgentLog.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

RestockRequest.hasMany(AgentLog, { foreignKey: 'restockRequestId', as: 'agentLogs' });
AgentLog.belongsTo(RestockRequest, { foreignKey: 'restockRequestId', as: 'restockRequest' });

// Chat Messages
User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Refunds
Product.hasMany(RefundRequest, { foreignKey: 'productId', as: 'refundRequests' });
RefundRequest.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(RefundRequest, { foreignKey: 'reviewedBy', as: 'reviewedRefunds' });
RefundRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Fraud Alerts
Product.hasMany(FraudAlert, { foreignKey: 'productId', as: 'fraudAlerts' });
FraudAlert.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(FraudAlert, { foreignKey: 'reviewedBy', as: 'reviewedFraudAlerts' });
FraudAlert.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Vendor Evaluations
User.hasMany(VendorEvaluation, { foreignKey: 'evaluatedBy', as: 'vendorEvaluations' });
VendorEvaluation.belongsTo(User, { foreignKey: 'evaluatedBy', as: 'evaluator' });

export {
  sequelize,
  User,
  Product,
  InventoryTransaction,
  RestockRequest,
  PurchaseOrder,
  ApprovalsQueue,
  AgentLog,
  ChatMessage,
  RefundRequest,
  FraudAlert,
  VendorEvaluation
};
