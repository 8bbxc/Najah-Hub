import express from 'express';
import { getDashboardStats, getAllUsers, deleteUser, bulkDeleteUsers, bulkDeleteCommunities, updateUserRole, updateUserPermissions, adminChangeUserPassword, assignUserAdminToAllCommunities, getSettings, updateSettings, updateUserStatus, setUserFeatured, getAudits } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ميدل وير خاص للتأكد أن المستخدم يمتلك صلاحيات الأدمن
// الآن يقبل مالك النظام (universityId === '0000') أو أي مستخدم برتبة 'doctor' أو 'admin'
const adminOnly = (req, res, next) => {
    // allow system owner, doctors, admins, and assistant admins to access admin routes
    if (req.user && (String(req.user.universityId).trim() === '0000' || req.user.role === 'doctor' || req.user.role === 'admin' || req.user.role === 'assistant')) {
        next();
    } else {
        res.status(403).json({ message: "غير مصرح لك بدخول لوحة التحكم" });
    }
};

router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/users', protect, adminOnly, getAllUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
// bulk delete users
router.post('/users/bulk-delete', protect, adminOnly, bulkDeleteUsers);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
// bulk delete communities (admin-only route)
router.post('/communities/bulk-delete', protect, adminOnly, bulkDeleteCommunities);
router.put('/users/:id/permissions', protect, adminOnly, updateUserPermissions);
router.put('/users/:id/status', protect, adminOnly, updateUserStatus);
router.put('/users/:id/password', protect, adminOnly, adminChangeUserPassword);
router.post('/users/:id/assign-all', protect, adminOnly, assignUserAdminToAllCommunities);
router.get('/settings', protect, adminOnly, getSettings);
router.put('/settings', protect, adminOnly, updateSettings);
router.put('/users/:id/feature', protect, adminOnly, setUserFeatured);
router.get('/audits', protect, adminOnly, getAudits);

export default router;