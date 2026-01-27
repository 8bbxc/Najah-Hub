import SubscriptionPlan from '../models/SubscriptionPlan.js';
import UserSubscription from '../models/UserSubscription.js';
import User from '../models/User.js';

export const listPlans = async (req, res) => {
  try {
    if (!req.app.get('dbAvailable')) return res.status(503).json({ message: 'Service temporarily unavailable' });
    const plans = await SubscriptionPlan.findAll({ order: [['priceCents','ASC']] });
    res.json(plans);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to fetch plans' }); }
};

export const createPlan = async (req, res) => {
  try {
    if (!req.app.get('dbAvailable')) return res.status(503).json({ message: 'Service temporarily unavailable' });
    const { name, slug, priceCents, interval, features } = req.body;
    const plan = await SubscriptionPlan.create({ name, slug, priceCents, interval, features });
    res.status(201).json(plan);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to create plan' }); }
};

// Simulated purchase (no real payment integration)
export const purchasePlan = async (req, res) => {
  try {
    if (!req.app.get('dbAvailable')) return res.status(503).json({ message: 'Service temporarily unavailable' });
    const { planId } = req.body;
    const user = req.user;
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const now = new Date();
    let expires = new Date(now);
    if (plan.interval === 'month') expires.setMonth(expires.getMonth() + 1);
    else if (plan.interval === '3months') expires.setMonth(expires.getMonth() + 3);
    else if (plan.interval === 'year') expires.setFullYear(expires.getFullYear() + 1);

    const sub = await UserSubscription.create({ userId: user.id, planId: plan.id, startedAt: now, expiresAt: expires, active: true });

    // update user premium flags
    user.isPremium = true;
    user.premiumExpiresAt = expires;
    await user.save();

    res.json({ message: 'Purchase simulated', subscription: sub });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to purchase' }); }
};

export const getMySubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const sub = await UserSubscription.findOne({ where: { userId: user.id }, include: [{ model: SubscriptionPlan, as: 'Plan' }] });
    if (!sub) return res.status(404).json({ message: 'No subscription' });
    res.json({ id: sub.id, planId: sub.planId, planName: sub.Plan?.name || null, startedAt: sub.startedAt, expiresAt: sub.expiresAt, active: sub.active });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to fetch subscription' }); }
};

export default { listPlans, createPlan, purchasePlan, getMySubscription };
