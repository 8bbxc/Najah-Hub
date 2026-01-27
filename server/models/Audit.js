import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Audit = sequelize.define('Audit', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  action: { type: DataTypes.STRING, allowNull: false },
  actorId: { type: DataTypes.INTEGER, allowNull: true },
  actorUniversityId: { type: DataTypes.STRING, allowNull: true },
  targetType: { type: DataTypes.STRING, allowNull: true },
  targetId: { type: DataTypes.STRING, allowNull: true },
  meta: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'audits',
  timestamps: true
});

export default Audit;
