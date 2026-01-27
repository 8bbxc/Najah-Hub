import express from 'express';
import { getUserProfile, updateAvatar, updateProfile, changePassword, followUser, unfollowUser, toggleLikeUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// جلب بيانات البروفايل
router.get('/:id', protect, getUserProfile);

// follow/unfollow
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);

// like / unlike a profile
router.post('/:id/like', protect, toggleLikeUser);

// تحديث الصورة الشخصية (تستخدم multer للرفع)
router.put('/update-avatar', protect, upload.single('avatar'), updateAvatar);

// ✅ تحديث البيانات النصية (الاسم، البايو، الجنس)
router.put('/update-profile', protect, updateProfile);

// تغيير كلمة المرور الخاص بالمستخدم
router.put('/change-password', protect, changePassword);

export default router;