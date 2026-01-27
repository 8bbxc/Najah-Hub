import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PrivateMessage = sequelize.define('PrivateMessage', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  chatId: { type: DataTypes.BIGINT, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: true },
  attachments: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'private_messages',
  timestamps: true
});

export default PrivateMessage;
