import express from 'express';
import { getNotifications, markAsRead, deleteNotification, clearNotifications } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/mark-as-read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/', protect, clearNotifications);

export default router;