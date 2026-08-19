import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('SALE', 'RESTOCK', 'ADJUSTMENT'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  previousStock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  newStock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  referenceId: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'InventoryTransactions',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['productId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] }
  ]
});

export default InventoryTransaction;
