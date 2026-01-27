import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // الحصول على التوكين من الهيدر
      token = req.headers.authorization.split(' ')[1];

      // فك تشفير التوكين
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'najah_hub_secret_key_123');

      // جلب بيانات المستخدم ووضعها في الريكويست
      req.user = await User.findByPk(decoded.id);

      if (!req.user) {
          return res.status(401).json({ message: 'المستخدم غير موجود' });
      }

        // Block users who haven't been activated or have been disabled
        if (req.user.status && req.user.status !== 'active') {
          return res.status(403).json({ message: 'حسابك غير مفعل أو معطل' });
        }

      next(); // كمل الطريق للكونترولر
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'توكين غير صالح' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'غير مصرح، لا يوجد توكين' });
  }
};

export { protect };