import Notification from '../models/Notification.js';
import User from '../models/User.js';

// 1. جلب إشعارات المستخدم الحالي
export const getNotifications = async (req, res) => {
    try {
        const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
        const offset = parseInt(req.query.offset || '0', 10);
        const notifications = await Notification.findAll({
            where: { receiverId: req.user.id },
            include: [
                { 
                    model: User, 
                    as: 'Sender', 
                    attributes: ['name', 'avatar'] 
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب الإشعارات" });
    }
};

// 2. تحديد الإشعارات كمقروءة
export const markAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { receiverId: req.user.id, isRead: false } }
        );
        res.json({ message: "تم تحديث الحالة" });
    } catch (error) {
        res.status(500).json({ message: "خطأ في تحديث الإشعارات" });
    }
};

// حذف إشعار واحد
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const n = await Notification.findByPk(id);
        if (!n) return res.status(404).json({ message: 'الإشعار غير موجود' });
        if (n.receiverId !== req.user.id) return res.status(403).json({ message: 'غير مصرح' });
        await n.destroy();
        res.json({ message: 'تم حذف الإشعار' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ بحذف الإشعار' });
    }
};

// مسح كل الإشعارات للمستخدم الحالي
export const clearNotifications = async (req, res) => {
    try {
        await Notification.destroy({ where: { receiverId: req.user.id } });
        res.json({ message: 'تم مسح الإشعارات' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ بمسح الإشعارات' });
    }
};