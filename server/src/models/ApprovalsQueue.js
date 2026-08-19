import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ApprovalsQueue = sequelize.define('ApprovalsQueue', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  restockRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  threadId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'ApprovalsQueue',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['threadId'] },
    { fields: ['restockRequestId'] },
    { fields: ['status'] }
  ]
});

export default ApprovalsQueue;
