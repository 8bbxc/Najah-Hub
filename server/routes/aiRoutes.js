import express from 'express';
import { getAIResponse, chatWithAttachments, listConversations, getConversationMessages, deleteConversation } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// text-only ask
router.post('/ask', protect, getAIResponse);

// chat with optional image files (field name: files)
router.post('/chat', protect, upload.array('files', 6), chatWithAttachments);

// conversation archive
router.get('/conversations', protect, listConversations);
router.get('/conversations/:id', protect, getConversationMessages);
router.delete('/conversations/:id', protect, deleteConversation);

export default router;