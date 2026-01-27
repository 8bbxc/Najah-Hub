import express from 'express';
import { 
    createPost, 
    getPosts, 
    deletePost, 
    toggleLike, 
    addComment,
    updatePost // ✅ 1. أضفنا دالة التعديل هنا
    , uploadTempFiles
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js'; 
import { upload } from '../config/cloudinary.js'; // تأكد أن هذا المسار صحيح لإعدادات الرفع عندك

const router = express.Router();

// رفع ملفات مؤقتة لمعاينة سريعة قبل النشر
router.post('/upload', protect, upload.array('files', 10), uploadTempFiles);

router.route('/')
    .get(protect, getPosts)
    .post(protect, upload.array('files', 10), createPost); 

// ✅ 2. دمجنا الحذف والتعديل تحت نفس المسار (/:id)
router.route('/:id')
    .delete(protect, deletePost) // للحذف
    .put(protect, updatePost);   // للتعديل (هذا اللي كان ناقص عشان يروح الإيرور)

// راوتس التفاعل
router.put('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);
// pin/unpin
import { togglePinPost } from '../controllers/postController.js';
router.post('/:id/pin', protect, togglePinPost);

export default router;