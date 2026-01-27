import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PrivateChat = sequelize.define('PrivateChat', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userA: { type: DataTypes.INTEGER, allowNull: false },
  userB: { type: DataTypes.INTEGER, allowNull: false },
  meta: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'private_chats',
  timestamps: true
});

export default PrivateChat;
