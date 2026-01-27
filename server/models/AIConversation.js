import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const AIConversation = sequelize.define('AIConversation', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: true },
  meta: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'ai_conversations',
  timestamps: true
});

export default AIConversation;
