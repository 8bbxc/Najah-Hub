import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserLike = sequelize.define('UserLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, {
  timestamps: true
});

export default UserLike;
