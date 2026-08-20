import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  currentStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  safetyThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  targetStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  supplierName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  supplierEmail: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  supplierPhone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'Products',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['sku'] },
    { fields: ['currentStock'] }
  ]
});

export default Product;
