import Rating from '../models/Rating.js';
import User from '../models/User.js';
import { sequelize } from '../config/database.js';

// list public ratings with user info
export const listRatings = async (req, res) => {
    try {
        const ratings = await Rating.findAll({ order: [['createdAt', 'DESC']], include: [{ model: User, attributes: ['id', 'name', 'avatar', 'universityId'] }] });
        res.json(ratings.map(r => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, user: r.User ? { id: r.User.id, name: r.User.name, avatar: r.User.avatar, universityId: r.User.universityId } : null })));
    } catch (err) { console.error('listRatings', err); res.status(500).json({ message: 'Failed to list ratings' }); }
};

export const getMyRating = async (req, res) => {
    try {
        const r = await Rating.findOne({ where: { userId: req.user.id } });
        if (!r) return res.status(404).json({ message: 'no_rating' });
        res.json(r);
    } catch (err) { console.error('getMyRating', err); res.status(500).json({ message: 'Failed to fetch your rating' }); }
};

export const getSummary = async (req, res) => {
    try {
        const rows = await sequelize.query(`SELECT rating, COUNT(*) as count FROM "Ratings" GROUP BY rating ORDER BY rating DESC;`);
        const counts = rows[0].reduce((acc, cur) => ({ ...acc, [cur.rating]: Number(cur.count) }), {});
        const total = Object.values(counts).reduce((s, v) => s + v, 0) || 0;
        const avgRow = await sequelize.query(`SELECT AVG(rating) as avg FROM "Ratings";`);
        const avg = avgRow[0] && avgRow[0][0] ? Number(parseFloat(avgRow[0][0].avg).toFixed(2)) : 0;
        res.json({ counts, total, avg });
    } catch (err) { console.error('getSummary', err); res.status(500).json({ message: 'Failed to fetch ratings summary' }); }
};

export const createRating = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'invalid_rating' });
        // one rating per user
        const existing = await Rating.findOne({ where: { userId: req.user.id } });
        if (existing) return res.status(400).json({ message: 'already_rated' });

        const r = await Rating.create({ userId: req.user.id, rating: Number(rating), comment: comment || null });
        res.json({ message: 'rating_created', rating: r });
    } catch (err) { console.error('createRating', err); res.status(500).json({ message: 'Failed to create rating' }); }
};

export const updateRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const r = await Rating.findByPk(id);
        if (!r) return res.status(404).json({ message: 'not_found' });
        const isOwner = String(req.user?.universityId).trim() === '0000';
        if (r.userId !== req.user.id && !isOwner) return res.status(403).json({ message: 'forbidden' });

        if (rating) {
            if (rating < 1 || rating > 5) return res.status(400).json({ message: 'invalid_rating' });
            r.rating = Number(rating);
        }
        if (typeof comment !== 'undefined') r.comment = comment;
        await r.save();
        res.json({ message: 'rating_updated', rating: r });
    } catch (err) { console.error('updateRating', err); res.status(500).json({ message: 'Failed to update rating' }); }
};

export const deleteRating = async (req, res) => {
    try {
        const { id } = req.params;
        const r = await Rating.findByPk(id);
        if (!r) return res.status(404).json({ message: 'not_found' });
        const isOwner = String(req.user?.universityId).trim() === '0000';
        if (r.userId !== req.user.id && !isOwner) return res.status(403).json({ message: 'forbidden' });

        await r.destroy();
        res.json({ message: 'deleted' });
    } catch (err) { console.error('deleteRating', err); res.status(500).json({ message: 'Failed to delete rating' }); }
};
