import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';

// Middleware: ensure user is owner/system-owner/admin/doctor/community-admin/creator
export const communityManager = async (req, res, next) => {
  try {
    const { id } = req.params; // community id
    if (!req.user) return res.status(401).json({ message: 'غير مصرح' });

    const community = await Community.findByPk(id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const role = (req.user.role || '').toString().toLowerCase();
    const isOwnerSys = String(req.user.universityId).trim() === '0000';
    const isPrivileged = ['doctor','admin'].includes(role);

    const membership = await CommunityMember.findOne({ where: { communityId: id, userId: req.user.id } });
    const isCommAdmin = membership && membership.role === 'admin';

    if (isOwnerSys || isPrivileged || isCommAdmin || Number(community.creatorId) === Number(req.user.id)) {
      // attach for downstream use
      req.community = community;
      req.communityMember = membership;
      return next();
    }

    return res.status(403).json({ message: 'غير مصرح' });
  } catch (err) {
    console.error('communityManager error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default { communityManager };
