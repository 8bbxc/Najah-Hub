import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';
import User from '../models/User.js';
import CommunityMessage from '../models/CommunityMessage.js';
import Setting from '../models/Setting.js';
import { Op } from 'sequelize';
import { cloudinary } from '../config/cloudinary.js';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// إنشاء مجتمع جديد
export const createCommunity = async (req, res) => {
    try {
        const { name, description, privacy, coverUrl } = req.body;
        const batch = req.body.batch !== undefined ? (req.body.batch ? parseInt(req.body.batch) : null) : null;
        if (!name) return res.status(400).json({ message: 'Name required' });

        const slugBase = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        let slug = slugBase;
        let i = 1;
        while (await Community.findOne({ where: { slug } })) {
            slug = `${slugBase}-${i++}`;
        }

        // Enforce that non-privileged users cannot create public communities
        const userRole = (req.user.role || '').toString().toLowerCase();
        const isOwner = String(req.user.universityId).trim() === '0000';
        const isPrivileged = isOwner || ['doctor','admin'].includes(userRole);
        const finalPrivacy = isPrivileged ? (privacy || 'public') : 'private';

        const community = await Community.create({ name, description, privacy: finalPrivacy, coverUrl: coverUrl || null, slug, creatorId: req.user.id, batch });

        // ضمّ المنشئ كعضو مدير مع صلاحيات افتراضية
        await CommunityMember.create({ userId: req.user.id, communityId: community.id, role: 'admin', permissions: { canWrite: true, canChat: true, canDeleteOwn: true, canCreateCommunity: false } });

        res.status(201).json(community);
    } catch (err) {
        console.error('Create community error', err);
        res.status(500).json({ message: 'Failed to create community' });
    }
};

// جلب قائمة المجتمعات (مبسطة)
export const listCommunities = async (req, res) => {
    try {
        if (!req.app.get('dbAvailable')) return res.status(503).json({ message: 'Service temporarily unavailable' });
        const communities = await Community.findAll({ order: [['createdAt','DESC']], limit: 100 });

        // Determine user privileges
        const userRole = req.user ? (req.user.role || '').toString().toLowerCase() : null;
        const isOwner = req.user && String(req.user.universityId).trim() === '0000';
        const isPrivileged = isOwner || ['doctor','admin'].includes(userRole);

        // عدّل الاستجابة لتضمين عدد الأعضاء وحالة العضوية بالنسبة للمستخدم الحالي
        const result = await Promise.all(communities.map(async (c) => {
            const membersCount = await CommunityMember.count({ where: { communityId: c.id } });
            let isMember = false;
            let memberRole = null;
            let membership = null;
            if (req.user) {
                membership = await CommunityMember.findOne({ where: { communityId: c.id, userId: req.user.id } });
                if (membership) {
                    isMember = true;
                    memberRole = membership.role;
                }
            }

            const visibleToUser = (() => {
                // privileged users see all
                if (isPrivileged) return true;
                // creator always sees their own created communities
                if (req.user && Number(c.creatorId) === Number(req.user.id)) return true;
                // members see their communities
                if (isMember) return true;
                // otherwise hidden from students
                return false;
            })();

            const isCommAdmin = membership && membership.role === 'admin';
            // whether current requester may delete this community
            const canDelete = (isOwner || isPrivileged || isCommAdmin || (req.user && Number(c.creatorId) === Number(req.user.id)));
            return { ...c.toJSON(), membersCount, isMember, memberRole, visibleToUser, canDelete };
        }));

        // Filter server-side for users who are not privileged
        const filtered = result.filter(r => (req.user ? (r.visibleToUser || isPrivileged) : r.privacy === 'public'));
        res.json(filtered);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch communities' });
    }
};

// جلب تفاصيل مجتمع واحد مع حالة العضوية
export const getCommunity = async (req, res) => {
    try {
        if (!req.app.get('dbAvailable')) return res.status(503).json({ message: 'Service temporarily unavailable' });
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

        // load community without relying on potentially-missing associations
        let community;
        try {
            community = await Community.findByPk(id);
        } catch (e) {
            console.error('[getCommunity] findByPk failed', e);
            return res.status(500).json({ message: 'Failed to fetch community' });
        }
        if (!community) return res.status(404).json({ message: 'Community not found' });

        const membersCount = await CommunityMember.count({ where: { communityId: community.id } });

        let isMember = false;
        let memberRole = null;
        if (req.user) {
            const membership = await CommunityMember.findOne({ where: { communityId: id, userId: req.user.id } });
            if (membership) {
                isMember = true;
                memberRole = membership.role;
            }
        }

        const userRole = req.user ? (req.user.role || '').toString().toLowerCase() : null;
        const isOwner = req.user && String(req.user.universityId).trim() === '0000';
        const isPrivileged = isOwner || ['doctor','admin'].includes(userRole);

        // visibility rules
        // ensure creatorId comparison is safe
        const creatorId = community.creatorId !== undefined && community.creatorId !== null ? Number(community.creatorId) : null;
        if (!isPrivileged && !isMember && !(req.user && creatorId !== null && creatorId === Number(req.user.id))) {
            return res.status(403).json({ message: 'غير مسموح بعرض هذا المجتمع' });
        }

        res.json({ community, membersCount, isMember, memberRole });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch community' });
    }
};

// الانضمام للمجتمع
export const joinCommunity = async (req, res) => {
    try {
        if (!req.app.get('dbAvailable')) return res.status(503).json({ message: 'Service temporarily unavailable' });
        const { id } = req.params;
        console.log('[joinCommunity] user:', { id: req.user?.id, universityId: req.user?.universityId, role: req.user?.role });
        const existing = await CommunityMember.findOne({ where: { communityId: id, userId: req.user.id } });
        if (existing) return res.status(400).json({ message: 'Already a member' });
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        // حالة: المجتمع مقيد بدفعة
        if (community.batch) {
            // السماح للمالك أو الأطباء أو المشرفين بالدخول لأي مجموعة
            console.log('[joinCommunity] community.batch:', community.batch, 'user.batch:', req.user.batch);

            const userRole = (req.user.role || '').toString().toLowerCase();
            const isOwner = req.user.universityId === '0000';
            const isPrivilegedRole = ['doctor', 'admin'].includes(userRole);
            const userBatchNum = req.user.batch !== undefined && req.user.batch !== null ? Number(req.user.batch) : null;
            const communityBatchNum = Number(community.batch);

            if (!(isOwner || isPrivilegedRole || (userBatchNum && userBatchNum === communityBatchNum))) {
                console.log('[joinCommunity] denied: insufficient permissions', { isOwner, userRole, userBatchNum, communityBatchNum });
                return res.status(403).json({ message: 'غير مسموح لك بالانضمام إلى هذه المجموعة — تحقق من صلاحياتك أو دفعتك' });
            }
        }
        console.log('[joinCommunity] creating membership record', { communityId: id, userId: req.user.id });
        const newMember = await CommunityMember.create({ communityId: id, userId: req.user.id });
        console.log('[joinCommunity] created member:', { id: newMember.id, communityId: newMember.communityId, userId: newMember.userId });
        res.json({ message: 'Joined', memberId: newMember.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to join' });
    }
};

// رفع غلاف المجتمع (للمالك/الدكتور/الأدمن)
export const uploadCommunityCover = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: 'No file' });

        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        // تحقق الصلاحية: المالك أو دور doctor/admin
        if (!(req.user.universityId === '0000' || req.user.role === 'doctor' || req.user.role === 'admin')) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        // ارفع إلى Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream({ folder: 'najah_hub_communities' }, (err, result) => {
            if (err) return res.status(500).json({ message: 'Upload failed' });
            community.coverUrl = result.secure_url;
            community.save();
            res.json({ coverUrl: result.secure_url });
        });
        uploadStream.end(req.file.buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to upload cover' });
    }
};

// تعيين رسالة مثبتة في المجتمع
export const setPinnedMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!(req.user.universityId === '0000' || req.user.role === 'doctor' || req.user.role === 'admin')) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        community.pinnedMessage = message || null;
        await community.save();
        res.json({ message: 'Pinned updated', pinnedMessage: community.pinnedMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to set pinned' });
    }
};

// جلب رسائل المجتمع (آخر 100 رسالة)
export const getCommunityMessages = async (req, res) => {
    try {
        if (!req.app.get('dbAvailable')) return res.status(503).json({ message: 'Service temporarily unavailable' });

        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

        const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
        const before = req.query.before; // ISO date string or timestamp

        const where = { communityId: id };
        if (before) {
            const date = new Date(before);
            if (!isNaN(date.getTime())) {
                where.createdAt = { [Op.lt]: date };
            }
        }
        // fetch newest first then reverse so client shows chronological
        const rows = await CommunityMessage.findAll({ where, order: [['createdAt','DESC']], limit, include: [{ model: User, attributes: ['id','name','avatar'] }] });
        const messages = rows.reverse().map(r => {
            const m = r.toJSON();
            return {
                id: m.id,
                communityId: m.communityId,
                userId: m.userId,
                text: m.text,
                attachments: m.attachments,
                createdAt: m.createdAt,
                name: r.User?.name || null,
                avatar: r.User?.avatar || null
            };
        });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

// حذف رسالة في المجتمع (دون السماح للطلاب بحذف الرسائل)
export const deleteCommunityMessage = async (req, res) => {
    try {
        const { id, messageId } = req.params; // id = community id
        console.log(`[deleteCommunityMessage] attempt by user ${req.user?.id} (universityId=${req.user?.universityId}, role=${req.user?.role}) for community ${id}, message ${messageId}`);
        const msg = await CommunityMessage.findByPk(messageId);
        if (!msg) return res.status(404).json({ message: 'الرسالة غير موجودة' });
        if (Number(msg.communityId) !== Number(id)) return res.status(400).json({ message: 'خطأ في تحديد المجتمع' });

        // منع الطلاب من الحذف، السماح للدكاترة/الأدمن/المالك
        const role = (req.user.role || '').toString().toLowerCase();
        const isOwner = String(req.user.universityId).trim() === '0000';
        const isPrivileged = (role === 'doctor' || role === 'admin');

        // Allow deletion if requester is owner, privileged role, or the original message author
        const isAuthor = Number(msg.userId) === Number(req.user.id);

        // If author, allow only within 15 minutes of creation. Admins/owner can always delete.
        if (isAuthor && !(isOwner || isPrivileged)) {
            const created = new Date(msg.createdAt).getTime();
            const now = Date.now();
            const allowedWindow = 15 * 60 * 1000; // 15 minutes
            if ((now - created) > allowedWindow) {
                return res.status(403).json({ message: 'انتهت مهلة حذف المؤلف (15 دقيقة). لا يمكنك حذف هذه الرسالة.' });
            }
        }

        if (!(isOwner || isPrivileged || isAuthor)) {
            return res.status(403).json({ message: 'غير مصرح لك بحذف الرسالة' });
        }

        // log audit
        try {
            const Audit = (await import('../models/Audit.js')).default;
            await Audit.create({ action: 'delete_message', actorId: req.user.id, actorUniversityId: req.user.universityId, targetType: 'communityMessage', targetId: String(messageId), meta: { communityId: id, authorId: msg.userId } });
        } catch (e) { console.error('Failed to write audit for deleteCommunityMessage', e); }

        await msg.destroy();
        console.log(`Message ${messageId} deleted by user ${req.user.id}`);
        try {
            const io = req.app.get('io');
            if (io) io.to(`community-${id}`).emit('messageDeleted', { id: messageId });
        } catch (e) { console.error('Failed to emit messageDeleted', e); }
        res.json({ message: 'تم حذف الرسالة', id: messageId });
    } catch (err) {
        console.error('Failed to delete message', err);
        res.status(500).json({ message: 'فشل حذف الرسالة' });
    }
};

// رفع ملف/ملفات كمرفقات لرسالة المجتمع وإنشاء رسالة جديدة تحتوي على عناوين الملفات
export const uploadMessageAttachments = async (req, res) => {
    try {
        const { id } = req.params; // community id
        if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        // ارفع كل ملف إلى Cloudinary
        const uploadPromises = req.files.map(f => new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({ folder: 'najah_hub_messages' }, (err, result) => {
                if (err) return reject(err);
                resolve(result.secure_url);
            });
            uploadStream.end(f.buffer);
        }));

        const urls = await Promise.all(uploadPromises);

        // Return uploaded URLs (client will emit socket to create the message)
        res.json({ attachments: urls });
    } catch (err) {
        console.error('Failed to upload message attachments', err);
        res.status(500).json({ message: 'Failed to upload attachments' });
    }
};

// الخروج من المجتمع
export const leaveCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });
        // owner cannot leave; must transfer ownership first
        if (community.creatorId === req.user.id) {
            return res.status(400).json({ message: 'المالك لا يستطيع مغادرة المجتمع. انقل الملكية أولاً أو احذف المجتمع.' });
        }
        await CommunityMember.destroy({ where: { communityId: id, userId: req.user.id } });
        res.json({ message: 'Left' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to leave' });
    }
};

// جلب أعضاء المجتمع
export const getCommunityMembers = async (req, res) => {
    try {
        if (!req.app.get('dbAvailable')) return res.status(503).json({ message: 'Service temporarily unavailable' });

        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        const members = await CommunityMember.findAll({ where: { communityId: community.id }, include: [{ model: User, attributes: ['id','name','universityId','avatar','role','batch'] }] });

        // Map to a safer shape so frontend doesn't crash if user fields are missing
        const out = members.map(m => ({
            id: m.id,
            userId: m.userId,
            role: m.role,
            permissions: m.permissions || {},
            user: m.User ? {
                id: m.User.id,
                name: m.User.name || null,
                avatar: m.User.avatar || null,
                universityId: m.User.universityId || null,
                role: m.User.role || null,
                batch: m.User.batch || null
            } : null
        }));

        res.json(out);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch members' });
    }
};

// إضافة عضو إلى المجتمع بواسطة universityId (يمكن للأدمن/المالك)
export const addMemberByUniversityId = async (req, res) => {
    try {
        const { id } = req.params; // community id
        const { universityId } = req.body;
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        // صلاحية: المالك أو دور doctor/admin أو مشرف المجتمع
        const userRole = (req.user.role || '').toString().toLowerCase();
        const isOwner = req.user.universityId === '0000';
        const isPrivilegedRole = ['doctor','admin'].includes(userRole);
        const membership = await CommunityMember.findOne({ where: { communityId: id, userId: req.user.id } });
        const isCommAdmin = membership && membership.role === 'admin';
        if (!(isOwner || isPrivilegedRole || isCommAdmin || req.user.id === community.creatorId)) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        const user = await User.findOne({ where: { universityId } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const [member, created] = await CommunityMember.findOrCreate({ where: { communityId: id, userId: user.id }, defaults: { role: 'member' } });
        if (!created) return res.status(400).json({ message: 'User already a member' });
        res.json({ message: 'User added', member });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to add member' });
    }
};

// إزالة عضو
export const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params; // id = community id
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        const userRole = (req.user.role || '').toString().toLowerCase();
        const isOwner = req.user.universityId === '0000';
        const isPrivilegedRole = ['doctor','admin'].includes(userRole);
        const membership = await CommunityMember.findOne({ where: { communityId: id, userId: req.user.id } });
        const isCommAdmin = membership && membership.role === 'admin';
        if (!(isOwner || isPrivilegedRole || isCommAdmin || req.user.id === community.creatorId)) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        // Prevent removing the owner
        if (Number(userId) === Number(community.creatorId)) {
            return res.status(400).json({ message: 'لا يمكن إزالة مالك المجتمع.' });
        }

        await CommunityMember.destroy({ where: { communityId: id, userId } });
        res.json({ message: 'Member removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to remove member' });
    }
};

// تحديث دور عضو
export const updateMemberRole = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { role, permissions } = req.body; // 'member' | 'moderator' | 'admin' | 'owner', permissions: JSON
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        const userRole = (req.user.role || '').toString().toLowerCase();
        const isOwner = req.user.universityId === '0000';
        const isPrivilegedRole = ['doctor','admin'].includes(userRole);
        const membership = await CommunityMember.findOne({ where: { communityId: id, userId: req.user.id } });
        const isCommAdmin = membership && membership.role === 'admin';
        if (!(isOwner || isPrivilegedRole || isCommAdmin || req.user.id === community.creatorId)) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        const member = await CommunityMember.findOne({ where: { communityId: id, userId } });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        if (role) member.role = role;
        if (permissions !== undefined) member.permissions = permissions;
        await member.save();
        res.json({ message: 'Role/permissions updated', member });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update role' });
    }
};

// تحديث إعدادات المجتمع (الاسم، الوصف، الخصوصية)
export const updateCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, privacy, batch } = req.body;
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        // السماح للمالك (universityId === '0000') أو دور doctor/admin أو منشئ المجتمع
        const isOwner = req.user && String(req.user.universityId).trim() === '0000';
        const isPrivileged = req.user && ['doctor','admin'].includes((req.user.role||'').toString().toLowerCase());
        if (!(isOwner || isPrivileged || req.user.id === community.creatorId)) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        if (name !== undefined) community.name = name;
        if (description !== undefined) community.description = description;
        if (privacy !== undefined) community.privacy = privacy;
        if (batch !== undefined) community.batch = batch === '' ? null : batch;

        await community.save();
        res.json({ message: 'Community updated', community });
    } catch (err) {
        console.error('Failed to update community', err);
        res.status(500).json({ message: 'Failed to update community' });
    }
};

// حذف المجتمع (مع أتباعه الأساسية)
export const deleteCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const community = await Community.findByPk(id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        const isOwner = req.user && String(req.user.universityId).trim() === '0000';
        const isPrivileged = req.user && ['doctor','admin'].includes((req.user.role||'').toString().toLowerCase());
        if (!(isOwner || isPrivileged || req.user.id === community.creatorId)) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        // حذف رسائل وأعضاء ثم المجتمع
        // If configured, try to remove media from Cloudinary referenced in messages
        try {
            const setting = await Setting.findOne({ where: { key: 'global' } });
            const cloudCleanup = setting?.value?.cloudinaryCleanup;
            if (cloudCleanup) {
                // collect attachments from messages
                const msgs = await CommunityMessage.findAll({ where: { communityId: id } });
                for (const m of msgs) {
                    const atts = Array.isArray(m.attachments) ? m.attachments : [];
                    for (const url of atts) {
                        try {
                            // attempt to extract public_id from Cloudinary URL
                            // e.g. https://res.cloudinary.com/<cloud>/image/upload/v12345/folder/name.jpg
                            const parts = url.split('/');
                            const uploadIdx = parts.findIndex(p => p === 'upload');
                            if (uploadIdx >= 0 && parts.length > uploadIdx + 1) {
                                // join remaining parts after 'upload', remove version (v1234) if present
                                let publicPath = parts.slice(uploadIdx + 1).join('/');
                                // remove version prefix like v123456789/
                                publicPath = publicPath.replace(/^v\d+\//, '');
                                // strip extension
                                publicPath = publicPath.replace(/\.[a-zA-Z0-9]+$/, '');
                                // attempt destroy
                                try { await cloudinary.uploader.destroy(publicPath); } catch (e) { /* ignore individual failures */ }
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        } catch (e) {
            console.error('Cloudinary cleanup failed', e);
        }

        await CommunityMessage.destroy({ where: { communityId: id } });
        await CommunityMember.destroy({ where: { communityId: id } });
        // audit delete community
        try {
            const Audit = (await import('../models/Audit.js')).default;
            await Audit.create({ action: 'delete_community', actorId: req.user.id, actorUniversityId: req.user.universityId, targetType: 'community', targetId: String(community.id), meta: { communityId: community.id, communityName: community.name } });
        } catch (e) { console.error('Failed to write audit for deleteCommunity', e); }

        await community.destroy();

        res.json({ message: 'Community deleted' });
    } catch (err) {
        console.error('Failed to delete community', err);
        res.status(500).json({ message: 'Failed to delete community' });
    }
};
