import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  priceCents: { type: DataTypes.INTEGER, allowNull: false },
  interval: { type: DataTypes.STRING, allowNull: false }, // 'month' | '3months' | 'year'
  features: { type: DataTypes.JSON, allowNull: true }
}, { tableName: 'subscription_plans', timestamps: true });

export default SubscriptionPlan;
