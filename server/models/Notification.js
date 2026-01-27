import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('like', 'comment', 'system', 'forgot_password'),
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // سنخزن هنا الـ ID الخاص بالمنشور الذي حدث عليه التفاعل لسهولة التوجيه
    postId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // المستخدم الذي قام بالفعل (مثلاً الذي عمل لايك)
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // المستخدم الذي سيستلم الإشعار (صاحب المنشور)
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
    ,
    // أي بيانات إضافية متعلقة بالإشعار
    meta: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: true
});

export default Notification;