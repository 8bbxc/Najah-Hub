import express from 'express';
import { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, bulkDeleteAnnouncements } from '../controllers/announcementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// public listing endpoint (shows active announcements by default)
router.get('/', listAnnouncements);

// admin operations
router.post('/', protect, createAnnouncement);
router.put('/:id', protect, updateAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);
// bulk delete
router.post('/bulk-delete', protect, bulkDeleteAnnouncements);

export default router;
