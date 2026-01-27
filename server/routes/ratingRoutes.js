import express from 'express';
import { listRatings, getMyRating, getSummary, createRating, updateRating, deleteRating } from '../controllers/ratingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', listRatings);
router.get('/summary', getSummary);
router.get('/me', protect, getMyRating);
router.post('/', protect, createRating);
router.put('/:id', protect, updateRating);
router.delete('/:id', protect, deleteRating);

export default router;