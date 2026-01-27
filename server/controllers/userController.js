import User from '../models/User.js';
import Follow from '../models/Follow.js';
import bcrypt from 'bcryptjs';
import Post from '../models/Post.js';
import Attachment from '../models/Attachment.js';
import Like from '../models/Like.js'; // ✅ أضفنا استيراد اللايكات
import UserLike from '../models/UserLike.js'; // likes on user profiles
import Comment from '../models/Comment.js'; // ✅ أضفنا استيراد التعليقات
import { cloudinary } from '../config/cloudinary.js';

// 1. جلب بيانات البروفايل (محدث لجلب الحقول الجديدة والمنشورات كاملة)
export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            // ✅ أضفنا bio و gender للمسترجع
            attributes: ['id', 'name', 'avatar', 'universityId', 'role', 'batch', 'bio', 'gender']
        });

        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        // ✅ جلب المنشورات مع التفاعلات لتبدو طبيعية تماماً
        const posts = await Post.findAll({
            where: { userId: id },
            include: [
                { model: Attachment }, 
                { model: User, attributes: ['name', 'avatar', 'universityId'] },
                { model: Like, attributes: ['userId'] }, // جلب اللايكات
                { 
                    model: Comment, 
                    include: [{ model: User, attributes: ['name', 'avatar'] }] // جلب التعليقات مع أصحابها
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Put profile-scoped pinned posts (and owner's global pins) at the top, ordered by pinnedAt desc
        const pinnedPosts = posts
            .filter(p => p.pinned && (p.pinScope === 'profile' || p.pinScope === 'global'))
            .sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt));
        const restPosts = posts.filter(p => !(p.pinned && (p.pinScope === 'profile' || p.pinScope === 'global')));
        const orderedPosts = [...pinnedPosts, ...restPosts];

        // determine if the requesting user follows this profile
        let isFollowing = false;
        try {
            if (req.user) {
                const existing = await Follow.findOne({ where: { followerId: req.user.id, followingId: id } });
                isFollowing = !!existing;
            }
        } catch (e) { /* ignore */ }

        // likes count & likedByMe
        const likesCount = await UserLike.count({ where: { likedUserId: id } });
        let likedByMe = false;
        if (req.user) {
            const exists = await UserLike.findOne({ where: { likedUserId: id, likerId: req.user.id } });
            likedByMe = !!exists;
        }
        res.json({ user, posts: orderedPosts, isFollowing, likesCount, likedByMe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "خطأ في جلب البيانات" });
    }
};

// follow a user
export const followUser = async (req, res) => {
    try {
        const { id } = req.params; // target to follow
        if (Number(id) === Number(req.user.id)) return res.status(400).json({ message: 'لا يمكنك متابعة نفسك' });
        const target = await User.findByPk(id);
        if (!target) return res.status(404).json({ message: 'المستخدم غير موجود' });

        const [f, created] = await Follow.findOrCreate({ where: { followerId: req.user.id, followingId: id } });
        if (!created) return res.json({ message: 'متابع سابقاً' });

        res.json({ message: 'تم المتابعة' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'فشل المتابعة' });
    }
};

// unfollow a user
export const unfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        await Follow.destroy({ where: { followerId: req.user.id, followingId: id } });
        res.json({ message: 'تم إلغاء المتابعة' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'فشل إلغاء المتابعة' });
    }
};

// 2. تحديث بيانات النص (الاسم، البايو، الجنس) ✅ دالة جديدة
export const updateProfile = async (req, res) => {
    try {
        const { name, bio, gender } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        // تحديث البيانات
        user.name = name || user.name;
        user.bio = bio !== undefined ? bio : user.bio;
        // اجعل الجنس قابلاً للتعديل لكن تحقق من القيم المسموحة
        if (gender !== undefined) {
            if (!['male','female'].includes(gender)) return res.status(400).json({ message: 'قيمة الجنس غير صالحة' });
            user.gender = gender;
        }
        // دعم الحقول الإضافية: email و whatsapp
        user.email = req.body.email !== undefined ? req.body.email : user.email;
        user.whatsapp = req.body.whatsapp !== undefined ? req.body.whatsapp : user.whatsapp;

        await user.save();

        res.json({ 
            message: "تم تحديث الملف الشخصي بنجاح",
            user: {
                name: user.name,
                bio: user.bio,
                gender: user.gender
            }
        });
    } catch (error) {
        res.status(500).json({ message: "فشل تحديث البيانات الأساسية" });
    }
};

// 3. تحديث الصورة الشخصية (تبقى كما هي مع تحسين بسيط)
export const updateAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "الرجاء ارفاق صورة" });

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "najah_hub_avatars" },
                (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(req.file.buffer);
        });

        const user = await User.findByPk(req.user.id);
        user.avatar = result.secure_url;
        await user.save();

        res.json({ avatar: user.avatar, message: "تم تحديث الصورة بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "فشل تحديث الصورة" });
    }
};

// تغيير كلمة المرور (للمستخدم نفسه)
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'كلمة المرور قصيرة' });

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) return res.status(401).json({ message: 'كلمة المرور القديمة غير صحيحة' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'فشل تغيير كلمة المرور' });
    }
};

// Toggle like on a user profile
export const toggleLikeUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (Number(id) === Number(req.user.id)) return res.status(400).json({ message: 'لا يمكنك الإعجاب بنفسك' });
        const target = await User.findByPk(id);
        if (!target) return res.status(404).json({ message: 'المستخدم غير موجود' });

        const existing = await UserLike.findOne({ where: { likerId: req.user.id, likedUserId: id } });
        if (existing) {
            await UserLike.destroy({ where: { id: existing.id } });
            const count = await UserLike.count({ where: { likedUserId: id } });
            return res.json({ status: 'removed', likesCount: count });
        }

        await UserLike.create({ likerId: req.user.id, likedUserId: id });
        const count = await UserLike.count({ where: { likedUserId: id } });
        return res.json({ status: 'added', likesCount: count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'فشل تحديث الإعجاب' });
    }
};