import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// 1. إعداد الاتصال بـ Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. إعداد التخزين في الذاكرة (Memory Storage)
// هذا الخيار ضروري جداً لأننا نستخدم upload_stream في الكنترولر
const storage = multer.memoryStorage();

// 3. أداة الرفع (Multer Middleware)
export const upload = multer({ 
    storage, 
    // قمنا بإلغاء الفلتر للسماح بجميع أنواع الملفات (PDF, الصور, إلخ)
    limits: { 
        fileSize: 10 * 1024 * 1024 // الحد الأقصى 10 ميجا بايت للملف الواحد
    } 
});

// تصدير الكلاوديناري لاستخدامه في الكنترولر
export { cloudinary };