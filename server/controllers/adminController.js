import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import Post from '../models/Post.js';
import Attachment from '../models/Attachment.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';
import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';
import CommunityMessage from '../models/CommunityMessage.js';
import PrivateMessage from '../models/PrivateMessage.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';

// 1. جلب الإحصائيات العامة (الكود الخاص بك)
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalPosts = await Post.count();
        const totalFiles = await Attachment.count();

        const batchStats = await User.findAll({
            attributes: ['batch', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['batch'],
            where: { role: 'student' }
        });

        res.json({
            stats: { totalUsers, totalPosts, totalFiles },
            batchStats
        });
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب إحصائيات الأدمن" });
    }
};

// 2. جلب جميع المستخدمين لإدارتهم في الجدول
export const getAllUsers = async (req, res) => {
    try {
        const usersRaw = await User.findAll({
            attributes: ['id', 'name', 'universityId', 'role', 'batch', 'avatar', 'createdAt', 'status'],
            order: [['createdAt', 'DESC']]
        });
        // compute canDelete per user based on current admin's privileges
        const isOwnerSys = String(req.user?.universityId).trim() === '0000';
        const role = (req.user?.role || '').toString().toLowerCase();
        const isPrivileged = ['doctor', 'admin'].includes(role);
        const users = usersRaw.map(u => {
            const j = u.toJSON();
            // cannot delete yourself; only owner/sys or doctor/admin can delete users
            j.canDelete = (Number(j.id) !== Number(req.user?.id)) && (isOwnerSys || isPrivileged);
            return j;
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب قائمة المستخدمين" });
    }
};

// 3. حذف مستخدم نهائياً
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // منع الأدمن من حذف نفسه بالخطأ
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: "لا يمكنك حذف حسابك الخاص من هنا" });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        // audit
        try {
            const Audit = (await import('../models/Audit.js')).default;
            await Audit.create({ action: 'delete_user', actorId: req.user.id, actorUniversityId: req.user.universityId, targetType: 'user', targetId: String(user.id), meta: { userId: user.id, userUniversityId: user.universityId } });
        } catch (e) { console.error('Failed to write audit for deleteUser', e); }

        await user.destroy();
        res.json({ message: "تم حذف المستخدم وكل بياناته بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "فشل في عملية الحذف" });
    }
};

// Bulk delete users
export const bulkDeleteUsers = async (req, res) => {
    try {
        const ids = Array.isArray(req.body.ids) ? req.body.ids.map(i => Number(i)) : [];
        if (!ids.length) return res.status(400).json({ message: 'No ids provided' });
        // Prevent self deletion
        if (ids.includes(req.user.id)) return res.status(400).json({ message: 'لا يمكنك حذف حسابك الخاص' });

        const users = await User.findAll({ where: { id: ids } });
        if (!users || users.length === 0) return res.status(404).json({ message: 'No users found for given ids' });

        const results = { deleted: [], failed: [] };
        const foundIds = users.map(u => Number(u.id));
        const missing = ids.filter(i => !foundIds.includes(Number(i)));
        for (const m of missing) results.failed.push({ id: m, reason: 'not_found' });

        for (const u of users) {
            // per-user transaction so a single failure doesn't abort whole batch
            const t = await sequelize.transaction();
            try {
                // remove dependent records that may have FK constraints
                await Notification.destroy({ where: { [Op.or]: [{ receiverId: u.id }, { senderId: u.id }] }, transaction: t });
                await PrivateMessage.destroy({ where: { [Op.or]: [{ receiverId: u.id }, { senderId: u.id }] }, transaction: t });
                await CommunityMessage.destroy({ where: { userId: u.id }, transaction: t });
                await CommunityMember.destroy({ where: { userId: u.id }, transaction: t });
                await Like.destroy({ where: { userId: u.id }, transaction: t });
                await Comment.destroy({ where: { userId: u.id }, transaction: t });

                // delete communities owned by this user to avoid FK constraint on Communities.creatorId
                const ownedCommunities = await Community.findAll({ where: { creatorId: u.id }, transaction: t });
                for (const comm of ownedCommunities) {
                    await CommunityMessage.destroy({ where: { communityId: comm.id }, transaction: t });
                    await CommunityMember.destroy({ where: { communityId: comm.id }, transaction: t });
                    try {
                        const Audit = (await import('../models/Audit.js')).default;
                        await Audit.create({ action: 'delete_community_on_owner_delete', actorId: req.user.id, actorUniversityId: req.user.universityId, targetType: 'community', targetId: String(comm.id), meta: { communityId: comm.id, communityName: comm.name, ownerDeletedUserId: u.id } }, { transaction: t });
                    } catch (e) { console.error('Failed to write audit for community deletion during user bulk delete', e); }
                    await comm.destroy({ transaction: t });
                }

                const Audit = (await import('../models/Audit.js')).default;
                await Audit.create({ action: 'bulk_delete_user', actorId: req.user.id, actorUniversityId: req.user.universityId, targetType: 'user', targetId: String(u.id), meta: { userId: u.id, userUniversityId: u.universityId } }, { transaction: t });

                await u.destroy({ transaction: t });
                await t.commit();
                results.deleted.push(u.id);
            } catch (e) {
                await t.rollback();
                console.error('Failed to delete user in bulk', u.id, e);
                results.failed.push({ id: u.id, reason: e.message || 'error' });
            }
        }

        res.json({ message: `Processed bulk delete`, results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to process bulk delete request' });
    }
};

// Bulk delete communities
export const bulkDeleteCommunities = async (req, res) => {
    try {
        const ids = Array.isArray(req.body.ids) ? req.body.ids.map(i => Number(i)) : [];
        if (!ids.length) return res.status(400).json({ message: 'No ids provided' });
        const results = { deleted: [], failed: [] };
        for (const id of ids) {
            try {
                const community = await Community.findByPk(id);
                if (!community) {
                    results.failed.push({ id, reason: 'not_found' });
                    continue;
                }
                const isOwner = req.user && String(req.user.universityId).trim() === '0000';
                const isPrivileged = req.user && ['doctor','admin'].includes((req.user.role||'').toString().toLowerCase());
                if (!(isOwner || isPrivileged || req.user.id === community.creatorId)) {
                    results.failed.push({ id, reason: 'forbidden' });
                    continue;
                }

                // delete messages and members
                await CommunityMessage.destroy({ where: { communityId: id } });
                await CommunityMember.destroy({ where: { communityId: id } });

                try {
                    const Audit = (await import('../models/Audit.js')).default;
                    await Audit.create({ action: 'bulk_delete_community', actorId: req.user.id, actorUniversityId: req.user.universityId, targetType: 'community', targetId: String(community.id), meta: { communityId: community.id, communityName: community.name } });
                } catch (e) { console.error('Failed to write audit for bulk delete community', e); }

                await community.destroy();
                results.deleted.push(id);
            } catch (e) {
                console.error('Failed to delete community', id, e);
                results.failed.push({ id, reason: 'error' });
            }
        }
        res.json({ message: 'Bulk delete processed', results });
    } catch (err) {
        console.error('bulkDeleteCommunities error', err);
        res.status(500).json({ message: 'Failed to bulk delete communities' });
    }
};

// 4. تغيير رتبة المستخدم (طالب <-> دكتور)
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        user.role = role;
        await user.save();

        res.json({ message: `تم تغيير الرتبة إلى ${role} بنجاح` });
    } catch (error) {
        res.status(500).json({ message: "فشل تحديث الرتبة" });
    }
};

// تحديث صلاحيات المستخدم (permissions JSON)
export const updateUserPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body; // expect object

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        user.permissions = permissions || null;
        await user.save();

        res.json({ message: 'تم تحديث الصلاحيات', permissions: user.permissions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'فشل تحديث الصلاحيات' });
    }
};

// تغيير كلمة مرور مستخدم من قبل الأدمن
export const adminChangeUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'كلمة المرور قصيرة جداً' });

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'فشل تغيير كلمة المرور' });
    }
};
// حذف أي منشور من قبل الأدمن
export const adminDeletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByPk(id);
        
        if (!post) return res.status(404).json({ message: "المنشور غير موجود" });

        // حذف الملفات المرتبطة بالمنشور أولاً (اختياري حسب هيكلة الداتابيس عندك)
        await Attachment.destroy({ where: { postId: id } });
        try {
            const Audit = (await import('../models/Audit.js')).default;
            await Audit.create({ action: 'admin_delete_post', actorId: req.user.id, actorUniversityId: req.user.universityId, targetType: 'post', targetId: String(post.id), meta: { postId: post.id, postOwnerId: post.userId } });
        } catch (e) { console.error('Failed to write audit for adminDeletePost', e); }
        
        await post.destroy();
        res.json({ message: "تم حذف المنشور المخالف بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "خطأ في حذف المنشور" });
    }
};

// تعيين مستخدم كـ admin في كل المجتمعات (يستخدم من قبل الأدمن)
export const assignUserAdminToAllCommunities = async (req, res) => {
    try {
        const { id } = req.params; // user id to assign
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        const communities = await Community.findAll();
        for (const comm of communities) {
            const [member, created] = await CommunityMember.findOrCreate({ where: { communityId: comm.id, userId: user.id }, defaults: { role: 'admin' } });
            if (!created && member.role !== 'admin') {
                member.role = 'admin';
                await member.save();
            }
        }

        res.json({ message: `تم تعيين المستخدم ${user.id} كأدمن في جميع المجتمعات` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'فشل بتعيين الأدمن' });
    }
};

// جلب إعدادات النظام العامة (مخزنة كمفتاح 'global')
export const getSettings = async (req, res) => {
    try {
        const s = await Setting.findOne({ where: { key: 'global' } });
        res.json({ settings: s ? s.value : null });
    } catch (err) {
        console.error('Failed to get settings', err);
        res.status(500).json({ message: 'Failed to get settings' });
    }
};

// تحديث الإعدادات (PUT)
export const updateSettings = async (req, res) => {
    try {
        const payload = req.body || {};
        const [s, created] = await Setting.findOrCreate({ where: { key: 'global' }, defaults: { value: payload } });
        if (!created) {
            s.value = payload;
            await s.save();
        }
        // broadcast to connected clients so UI updates immediately
        try {
            const io = req.app.get('io');
            if (io) io.emit('settingsUpdated', s.value);
        } catch (e) {
            console.error('Failed to emit settingsUpdated', e);
        }

        res.json({ message: 'Settings saved', settings: s.value });
    } catch (err) {
        console.error('Failed to update settings', err);
        res.status(500).json({ message: 'Failed to update settings' });
    }
};

// تحديث حالة المستخدم (approve/reject)
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' | 'disabled' | 'pending'
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        user.status = status;
        await user.save();

        // notify target user about approval/rejection
        const admin = req.user;
        await Notification.create({
            type: 'system',
            senderId: admin.id,
            receiverId: user.id,
            meta: { action: status === 'active' ? 'approved' : 'rejected' }
        });

        res.json({ message: 'تم تحديث الحالة', user: { id: user.id, status: user.status } });
    } catch (err) {
        console.error('Failed to update user status', err);
        res.status(500).json({ message: 'فشل تحديث حالة المستخدم' });
    }
};

// Feature or premium a user
export const setUserFeatured = async (req, res) => {
    try {
        console.log('setUserFeatured called by', req.user?.id, 'params:', req.params, 'body:', req.body);
        const { id } = req.params;
        const { featured, premium, premiumDays } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (typeof featured !== 'undefined') user.isFeatured = !!featured;
        if (typeof premium !== 'undefined') user.isPremium = !!premium;
        if (premiumDays) {
            const now = new Date();
            const expires = new Date(now.getTime() + (Number(premiumDays) * 24 * 60 * 60 * 1000));
            user.premiumExpiresAt = expires;
            user.isPremium = true;
        }
        await user.save();
        res.json({ message: 'Updated user premium/featured', user: { id: user.id, isFeatured: user.isFeatured, isPremium: user.isPremium, premiumExpiresAt: user.premiumExpiresAt } });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to update user feature' }); }
};

// Dev helper: issue owner token for local development only
// Get audit logs (paginated)
export const getAudits = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const audits = await (await import('../models/Audit.js')).default.findAll({ order: [['createdAt','DESC']], limit, offset });
        res.json({ audits, page, limit });
    } catch (err) {
        console.error('Failed to fetch audits', err);
        res.status(500).json({ message: 'Failed to fetch audits' });
    }
};