import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { upload as uploadMiddleware } from '../config/cloudinary.js';
import { getChatsForUser, getMessagesForChat, createOrGetChat, uploadPrivateAttachments } from '../controllers/privateChatController.js';

const router = express.Router();

router.get('/', protect, getChatsForUser);
router.get('/:chatId/messages', protect, getMessagesForChat);
router.post('/', protect, createOrGetChat);
router.post('/:chatId/upload', protect, uploadMiddleware.array('files', 6), uploadPrivateAttachments);

export default router;
