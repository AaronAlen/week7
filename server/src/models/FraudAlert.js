import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FraudAlert = sequelize.define('FraudAlert', {
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
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  riskScore: {
    type: DataTypes.DECIMAL(4, 2), // 0.00 to 1.00
    allowNull: false,
    defaultValue: 0.00
  },
  riskLevel: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    defaultValue: 'LOW'
  },
  riskFactors: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  aiExplanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING_REVIEW', 'CLEARED_RELEASED', 'BLOCKED_CANCELLED'),
    defaultValue: 'PENDING_REVIEW'
  },
  isFrozen: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'fraud_alerts'
});

export default FraudAlert;
