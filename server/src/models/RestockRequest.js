import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RestockRequest = sequelize.define('RestockRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  requiresHumanReview: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'RestockRequests',
  timestamps: true,
  indexes: [
    { fields: ['productId'] },
    { fields: ['status'] }
  ]
});

export default RestockRequest;
