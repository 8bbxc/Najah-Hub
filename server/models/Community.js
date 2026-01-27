import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Community = sequelize.define('Community', {
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    coverUrl: { type: DataTypes.STRING, allowNull: true },
    privacy: { type: DataTypes.ENUM('public','private'), defaultValue: 'public' },
    // إذا تم ضبط هذا الحقل، يصبح المجتمع خاص بدفعة معينة
    batch: { type: DataTypes.INTEGER, allowNull: true },
    pinnedMessage: { type: DataTypes.TEXT, allowNull: true },
    creatorId: { type: DataTypes.INTEGER, allowNull: false }
});

export default Community;
