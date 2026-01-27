import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Follow = sequelize.define('Follow', {
  followerId: { type: DataTypes.INTEGER, allowNull: false },
  followingId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  timestamps: true
});

export default Follow;
