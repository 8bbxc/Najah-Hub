import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const AIMessage = sequelize.define('AIMessage', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  conversationId: { type: DataTypes.BIGINT, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: false }, // 'user' or 'assistant'
  text: { type: DataTypes.TEXT, allowNull: true },
  attachments: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'ai_messages',
  timestamps: true
});

export default AIMessage;
