import Post from '../models/Post.js';
import User from '../models/User.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Attachment from '../models/Attachment.js';
import Notification from '../models/Notification.js'; // ✅ استيراد مودل الإشعارات
import { cloudinary } from '../config/cloudinary.js';
import { Op } from 'sequelize';

// دالة مساعدة لرفع الملف إلى Cloudinary باستخدام Stream
const uploadFile = (buffer, mimetype) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: "najah_hub_files",
                resource_type: "auto" 
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// 1. إنشاء منشور
export const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        
        const newPost = await Post.create({
            content,
            userId: req.user.id,
            batch: req.user.batch || 0
        });

        // حالة: تم إرسال ملفات مباشرة مع الطلب (الطريقة القديمة)
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadFile(file.buffer, file.mimetype));
            const uploadResults = await Promise.all(uploadPromises);

            const attachmentsData = uploadResults.map((result, index) => ({
                url: result.secure_url,
                publicId: result.public_id,
                fileType: req.files[index].mimetype,
                postId: newPost.id
            }));

            await Attachment.bulkCreate(attachmentsData);
        }

        // حالة: تم رفع الملفات مسبقاً من قبل العميل وأرسلنا الروابط في حقل attachments
        if (req.body.attachments) {
            try {
                const attachments = typeof req.body.attachments === 'string' ? JSON.parse(req.body.attachments) : req.body.attachments;
                if (Array.isArray(attachments) && attachments.length > 0) {
                    const attachmentsData = attachments.map(att => ({
                        url: att.url || att.secure_url || att.secureUrl,
                        publicId: att.publicId || att.public_id || att.public_id,
                        fileType: att.fileType || att.fileType,
                        postId: newPost.id
                    }));
                    await Attachment.bulkCreate(attachmentsData);
                }
            } catch (err) {
                console.error('Failed parsing attachments payload', err);
            }
        }

        const fullPost = await Post.findOne({
            where: { id: newPost.id },
            include: [
                { model: User, attributes: ['name', 'avatar', 'batch', 'universityId'] },
                { model: Like },
                { model: Comment },
                { model: Attachment } 
            ]
        });

        res.status(201).json(fullPost);

    } catch (error) {
        console.error("❌ خطأ في النشر:", error);
        res.status(500).json({ message: 'فشل عملية النشر' });
    }
};

// 2. جلب كافة المنشورات
export const getPosts = async (req, res) => {
    try {
        const { search, type, sortBy, userName } = req.query; 
        let whereCondition = {};
        let attachmentWhere = {};
        let userWhere = {};

        if (search) {
            whereCondition.content = { [Op.like]: `%${search}%` };
        }

        if (userName) {
            userWhere.name = { [Op.like]: `%${userName}%` };
        }

        if (type === 'images') {
            attachmentWhere.fileType = { [Op.like]: 'image/%' };
        } else if (type === 'files') {
            attachmentWhere.fileType = { [Op.notLike]: 'image/%' };
        }

        const orderDirection = sortBy === 'oldest' ? 'ASC' : 'DESC';

        const posts = await Post.findAll({
            where: whereCondition,
            include: [
                { 
                    model: User, 
                    where: Object.keys(userWhere).length > 0 ? userWhere : null,
                    attributes: ['name', 'universityId', 'avatar', 'batch', 'role'] 
                },
                { model: Like, attributes: ['userId'] },
                { 
                    model: Comment,
                    include: [{ model: User, attributes: ['name', 'avatar', 'universityId'] }] 
                },
                { 
                    model: Attachment,
                    where: Object.keys(attachmentWhere).length > 0 ? attachmentWhere : null,
                    required: type ? true : false 
                }
            ],
            order: [['createdAt', orderDirection]]
        });
        
        // Ensure global pinned posts appear first on the home feed, ordered by pinnedAt desc
        const globalPins = posts
          .filter(p => p.pinned && p.pinScope === 'global')
          .sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt));
        const rest = posts.filter(p => !(p.pinned && p.pinScope === 'global'));
        const ordered = [...globalPins, ...rest];

        res.status(200).json(ordered);
    } catch (error) {
        console.error("❌ خطأ جلب المنشورات:", error);
        res.status(500).json({ message: 'فشل جلب المنشورات' });
    }
};

// 3. تعديل نص المنشور

// Toggle pin on a post
export const togglePinPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByPk(id);
        if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

        const isOwnerSys = String(req.user.universityId).trim() === '0000';
        if (isOwnerSys) {
            // system owner can pin/unpin globally
            if (post.pinned && post.pinScope === 'global') {
                post.pinned = false; post.pinScope = null; post.pinnedBy = null; post.pinnedAt = null;
            } else {
                post.pinned = true; post.pinScope = 'global'; post.pinnedBy = req.user.id; post.pinnedAt = new Date();
            }
            await post.save();
            return res.json({ status: post.pinned ? 'pinned' : 'unpinned', post });
        }

        // profile owner can pin/unpin posts on their profile only (must be their post)
        if (post.userId === req.user.id) {
            if (post.pinned && post.pinScope === 'profile') {
                post.pinned = false; post.pinScope = null; post.pinnedBy = null; post.pinnedAt = null;
            } else {
                post.pinned = true; post.pinScope = 'profile'; post.pinnedBy = req.user.id; post.pinnedAt = new Date();
            }
            await post.save();
            return res.json({ status: post.pinned ? 'pinned' : 'unpinned', post });
        }

        return res.status(403).json({ message: 'غير مصرح لتثبيت هذا المنشور' });
    } catch (err) {
        console.error('Toggle pin error', err);
        res.status(500).json({ message: 'خطأ في تبديل حالة التثبيت' });
    }
};

// 3. تعديل نص المنشور
export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
  
        const post = await Post.findByPk(id);
        if (!post) return res.status(404).json({ message: "المنشور غير موجود" });
  
        // allow editing by post owner, system owner, or privileged roles (doctor/admin)
        const role = (req.user.role || '').toString().toLowerCase();
        const isOwnerSys = String(req.user.universityId).trim() === '0000';
        const isPrivileged = ['doctor','admin'].includes(role);
        if (post.userId !== userId && !isOwnerSys && !isPrivileged) {
            return res.status(403).json({ message: "غير مصرح لك بالتعديل" });
        }
  
        post.content = content;
        await post.save();
  
        const updatedPostFull = await Post.findOne({
            where: { id: post.id },
            include: [
                { model: User, attributes: ['name', 'avatar', 'batch', 'universityId'] },
                { model: Like },
                { model: Comment },
                { model: Attachment }
            ]
        });
  
        res.status(200).json(updatedPostFull);
    } catch (error) {
        res.status(500).json({ message: "فشل تعديل المنشور" });
    }
};

// 4. حذف المنشور
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

        // allow deletion by post owner, system owner, or privileged roles (doctor/admin)
        const role = (req.user.role || '').toString().toLowerCase();
        const isOwnerSys = String(req.user.universityId).trim() === '0000';
        const isPrivileged = ['doctor','admin'].includes(role);
        if (req.user.id === post.userId || isOwnerSys || isPrivileged) {
            // optional Cloudinary cleanup if global setting enabled
            try {
                const Setting = (await import('../models/Setting.js')).default;
                const setting = await Setting.findOne({ where: { key: 'global' } });
                const cloudCleanup = setting?.value?.cloudinaryCleanup;
                if (cloudCleanup) {
                    const attachments = await Attachment.findAll({ where: { postId: post.id } });
                    for (const a of attachments) {
                        try {
                            if (a.publicId) await cloudinary.uploader.destroy(a.publicId);
                        } catch (e) { /* ignore */ }
                    }
                }
            } catch (e) { /* ignore cleanup failures */ }

            // audit
            try {
                const Audit = (await import('../models/Audit.js')).default;
                await Audit.create({ action: 'delete_post', actorId: req.user.id, actorUniversityId: req.user.universityId, targetType: 'post', targetId: String(post.id), meta: { postId: post.id, postOwnerId: post.userId } });
            } catch (e) { console.error('Failed to write audit for deletePost', e); }

            await post.destroy();
            return res.status(200).json({ message: 'تم الحذف بنجاح' });
        } else {
            return res.status(403).json({ message: 'غير مصرح لك' });
        }
    } catch (error) {
        res.status(500).json({ message: 'فشل الحذف' });
    }
};

// 5. التفاعل باللايك (محدث لإضافة إشعار ✅)
export const toggleLike = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const existingLike = await Like.findOne({ where: { postId, userId } });

        if (existingLike) {
            await existingLike.destroy();
            res.json({ message: 'Unliked', status: 'removed' });
        } else {
            await Like.create({ postId, userId });
            
            // ✅ إضافة إشعار لصاحب المنشور
            const post = await Post.findByPk(postId);
            if (post && post.userId !== userId) {
                await Notification.create({
                    type: 'like',
                    senderId: userId,
                    receiverId: post.userId,
                    postId: postId
                });
            }
            
            res.json({ message: 'Liked', status: 'added' });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطأ في التفاعل' });
    }
};

// 6. إضافة تعليق (محدث لإضافة إشعار ✅)
export const addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;

        if (!content) return res.status(400).json({ message: 'التعليق فارغ' });

        const comment = await Comment.create({
            content,
            postId,
            userId: req.user.id
        });

        // ✅ إضافة إشعار لصاحب المنشور
        const post = await Post.findByPk(postId);
        if (post && post.userId !== req.user.id) {
            await Notification.create({
                type: 'comment',
                senderId: req.user.id,
                receiverId: post.userId,
                postId: postId
            });
        }

        const fullComment = await Comment.findByPk(comment.id, {
            include: [{ model: User, attributes: ['name', 'avatar', 'universityId'] }]
        });

        res.json(fullComment);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة التعليق' });
    }
};

// راوت رفع ملفات منفصل (يُستخدم عند اختيار الملفات لعرض معاينة ثابتة)
export const uploadTempFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

        const uploadPromises = req.files.map(file => uploadFile(file.buffer, file.mimetype));
        const uploadResults = await Promise.all(uploadPromises);

        const response = uploadResults.map((result, index) => ({
            url: result.secure_url,
            publicId: result.public_id,
            fileType: req.files[index].mimetype,
            originalName: req.files[index].originalname
        }));

        res.status(200).json(response);
    } catch (error) {
        console.error('Upload temp files error', error);
        res.status(500).json({ message: 'فشل رفع الملفات' });
    }
};