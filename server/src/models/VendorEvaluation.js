import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const VendorEvaluation = sequelize.define('VendorEvaluation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  productCategory: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  targetQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  priorityFocus: {
    type: DataTypes.ENUM('BALANCED', 'LOWEST_PRICE', 'HIGHEST_QUALITY', 'LONGEST_WARRANTY', 'FASTEST_LEAD_TIME'),
    defaultValue: 'BALANCED'
  },
  vendorProposals: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  bestVendorName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  overallRecommendationScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  scoringMatrix: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  executiveSummary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keyTradeoffs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  negotiationStrategy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emailDraft: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  uploadedFiles: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  evaluatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'vendor_evaluations'
});

export default VendorEvaluation;
