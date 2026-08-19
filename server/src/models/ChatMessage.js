import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'ChatMessages',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['senderId'] },
    { fields: ['createdAt'] }
  ]
});

export default ChatMessage;
