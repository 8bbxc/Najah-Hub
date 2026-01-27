import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CommunityMessage = sequelize.define('CommunityMessage', {
  communityId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  attachments: { type: DataTypes.JSON, allowNull: true }
}, {
  timestamps: true
});

export default CommunityMessage;
