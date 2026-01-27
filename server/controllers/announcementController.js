import Announcement from '../models/Announcement.js';
import User from '../models/User.js';

export const createAnnouncement = async (req, res) => {
  try {
    // only system owner, admin or assistant can create
    const allowed = String(req.user.universityId).trim() === '0000' || req.user.role === 'admin' || req.user.role === 'assistant';
    if (!allowed) return res.status(403).json({ message: 'غير مصرح لك بإنشاء إعلانات' });

    const { title, content, isActive } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'العنوان والمحتوى مطلوبان' });

    const a = await Announcement.create({ title, content, isActive: !!isActive, createdBy: req.user.id });

    // emit via socket to notify clients
    try {
      const io = req.app.get('io');
      if (io) io.emit('announcementsUpdated');
    } catch (e) { /* ignore */ }

    res.status(201).json({ announcement: a });
  } catch (err) {
    console.error('Create announcement error', err);
    res.status(500).json({ message: 'فشل إنشاء الإعلان' });
  }
};

export const listAnnouncements = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true' || req.query.active === undefined;
    const where = activeOnly ? { isActive: true } : {};
    const anns = await Announcement.findAll({ where, order: [['createdAt','DESC']] });
    res.json(anns);
  } catch (err) {
    console.error('List announcements error', err);
    res.status(500).json({ message: 'فشل جلب الإعلانات' });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    // only system owner, admin or assistant can update
    const allowed = String(req.user.universityId).trim() === '0000' || req.user.role === 'admin' || req.user.role === 'assistant';
    if (!allowed) return res.status(403).json({ message: 'غير مصرح لك بتعديل الإعلانات' });

    const { id } = req.params;
    const a = await Announcement.findByPk(id);
    if (!a) return res.status(404).json({ message: 'الإعلان غير موجود' });

    const { title, content, isActive } = req.body;
    if (typeof title !== 'undefined') a.title = title;
    if (typeof content !== 'undefined') a.content = content;
    if (typeof isActive !== 'undefined') a.isActive = !!isActive;
    await a.save();

    try { const io = req.app.get('io'); if (io) io.emit('announcementsUpdated'); } catch(e){}

    res.json({ announcement: a });
  } catch (err) {
    console.error('Update announcement error', err);
    res.status(500).json({ message: 'فشل تحديث الإعلان' });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    // only system owner, admin or assistant can delete
    const allowed = String(req.user.universityId).trim() === '0000' || req.user.role === 'admin' || req.user.role === 'assistant';
    if (!allowed) return res.status(403).json({ message: 'غير مصرح لك بحذف الإعلانات' });

    const { id } = req.params;
    const a = await Announcement.findByPk(id);
    if (!a) return res.status(404).json({ message: 'الإعلان غير موجود' });
    await a.destroy();
    try { const io = req.app.get('io'); if (io) io.emit('announcementsUpdated'); } catch(e){}
    res.json({ message: 'تم حذف الإعلان' });
  } catch (err) {
    console.error('Delete announcement error', err);
    res.status(500).json({ message: 'فشل حذف الإعلان' });
  }
};

// Bulk delete announcements by ids (body: { ids: [1,2,3] })
export const bulkDeleteAnnouncements = async (req, res) => {
  try {
    const allowed = String(req.user.universityId).trim() === '0000' || req.user.role === 'admin' || req.user.role === 'assistant';
    if (!allowed) return res.status(403).json({ message: 'غير مصرح لك بحذف الإعلانات' });

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'يرجى تزويد مصفوفة من المعرفات' });

    const deleted = await Announcement.destroy({ where: { id: ids } });

    try { const io = req.app.get('io'); if (io) io.emit('announcementsUpdated'); } catch(e){}

    res.json({ message: `تم حذف ${deleted} إعلاناً` });
  } catch (err) {
    console.error('Bulk delete announcements error', err);
    res.status(500).json({ message: 'فشل حذف الإعلانات' });
  }
};
