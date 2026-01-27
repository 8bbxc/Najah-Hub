import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Post = sequelize.define('Post', {
    content: {
        type: DataTypes.TEXT, // نص طويل
        allowNull: false
    },
    image: {
        type: DataTypes.STRING, // رابط الصورة
        allowNull: true
    },
    // سنخزن رقم الدفعة هنا أيضاً لتسهيل الفلترة لاحقاً
    batch: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // pin support
    pinned: { type: DataTypes.BOOLEAN, defaultValue: false },
    pinScope: { type: DataTypes.ENUM('global','profile'), allowNull: true },
    pinnedBy: { type: DataTypes.INTEGER, allowNull: true },
    pinnedAt: { type: DataTypes.DATE, allowNull: true }
}, {
    timestamps: true 
});

export default Post;