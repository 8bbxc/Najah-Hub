import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CommunityMember = sequelize.define('CommunityMember', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    communityId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.ENUM('member','moderator','admin','owner'), defaultValue: 'member' },
    permissions: {
        type: DataTypes.JSON,
        defaultValue: {
            canWrite: true,
            canChat: true,
            canDeleteOwnMessage: true,
        },
    },
});

export default CommunityMember;
