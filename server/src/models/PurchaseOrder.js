import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  restockRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  supplierName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  supplierEmail: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'RECEIVED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PENDING_APPROVAL'
  }
}, {
  tableName: 'PurchaseOrders',
  timestamps: true,
  indexes: [
    { fields: ['restockRequestId'] },
    { fields: ['productId'] },
    { fields: ['status'] }
  ]
});

export default PurchaseOrder;
