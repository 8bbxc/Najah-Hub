import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    // استخدام مفتاح سري احتياطي في حال لم يوجد في ملف البيئة
    const secret = process.env.JWT_SECRET || 'najah_hub_secret_key_123';
    
    return jwt.sign({ id }, secret, {
        expiresIn: '30d',
    });
};

export default generateToken;