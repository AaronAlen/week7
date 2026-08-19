import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AgentLog = sequelize.define('AgentLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  restockRequestId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'AgentLogs',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['productId'] },
    { fields: ['restockRequestId'] },
    { fields: ['createdAt'] }
  ]
});

export default AgentLog;
