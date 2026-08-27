import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RefundRequest = sequelize.define('RefundRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  daysSincePurchase: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reason: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  customerMessage: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('APPROVED', 'PENDING_APPROVAL', 'REJECTED'),
    defaultValue: 'PENDING_APPROVAL'
  },
  isAutoApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requiresHumanReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiReasoning: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customerEmailDraft: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  restockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'refund_requests'
});

export default RefundRequest;
