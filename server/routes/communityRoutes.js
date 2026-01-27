import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { communityManager } from '../middleware/permissionMiddleware.js';
import { createCommunity, listCommunities, getCommunity, joinCommunity, leaveCommunity, uploadCommunityCover, setPinnedMessage, getCommunityMessages, getCommunityMembers, addMemberByUniversityId, removeMember, updateMemberRole, uploadMessageAttachments, updateCommunity, deleteCommunity, deleteCommunityMessage } from '../controllers/communityController.js';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get('/', protect, listCommunities);
router.post('/', protect, createCommunity);
router.get('/:id', protect, getCommunity);
router.put('/:id', protect, communityManager, updateCommunity);
router.delete('/:id', protect, communityManager, deleteCommunity);
router.post('/:id/join', protect, joinCommunity);
router.get('/:id/messages', protect, getCommunityMessages);
router.delete('/:id/messages/:messageId', protect, deleteCommunityMessage);
router.post('/:id/messages/upload', protect, upload.array('files'), uploadMessageAttachments);
router.get('/:id/members', protect, getCommunityMembers);
router.post('/:id/members', protect, communityManager, addMemberByUniversityId);
router.delete('/:id/members/:userId', protect, communityManager, removeMember);
router.put('/:id/members/:userId', protect, communityManager, updateMemberRole);
router.post('/:id/leave', protect, leaveCommunity);
router.put('/:id/cover', protect, upload.single('cover'), communityManager, uploadCommunityCover);
router.put('/:id/pinned', protect, communityManager, setPinnedMessage);

export default router;
