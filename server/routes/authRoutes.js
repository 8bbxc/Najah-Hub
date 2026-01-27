import express from 'express';
// ✅ تصحيح الاستيراد: استخدام loginUser و registerUser بدلاً من login و register
import { registerUser, loginUser, forgotPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

export default router;