import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserSubscription = sequelize.define('UserSubscription', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  planId: { type: DataTypes.BIGINT, allowNull: false },
  startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'user_subscriptions', timestamps: true });

export default UserSubscription;
