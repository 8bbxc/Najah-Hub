import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { listPlans, createPlan, purchasePlan, getMySubscription } from '../controllers/subscriptionController.js';
import { communityManager } from '../middleware/permissionMiddleware.js';

const router = express.Router();

// public list
router.get('/plans', protect, listPlans);
// admin create
router.post('/plans', protect, communityManager, createPlan);
// purchase (simulated)
router.post('/purchase', protect, purchasePlan);

// get current user's subscription
router.get('/me', protect, getMySubscription);

export default router;
