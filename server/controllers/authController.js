import User from '../models/User.js';
import Notification from '../models/Notification.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
    const { universityId, password } = req.body;

    try {
        const user = await User.findOne({ where: { universityId } });

        if (!user) {
            console.warn(`[auth] login failed - user not found (${universityId})`);
            return res.status(401).json({ message: 'المستخدم غير موجود' });
        }

        // 🔥 التعديل: الدخول فقط إذا الرقم 0000 AND الباسورد صحيح
        // غيرت الشرط عشان ما يقبل "أي باسورد"
        const isMasterAdmin = universityId === '0000' && password === 'Yazan@2006.com#DB***';
        const isMatch = await user.matchPassword(password);

        if (!(isMasterAdmin || isMatch)) {
            console.warn(`[auth] login failed - wrong password for ${universityId}`);
            return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });
        }

        // block login if user is not active (except master admin)
        if (!isMasterAdmin && user.status !== 'active') {
            console.warn(`[auth] login blocked - account not active (${universityId}, status=${user.status})`);
            return res.status(403).json({ message: 'حسابك قيد المراجعة - انتظر موافقة المالك.' });
        }

        console.log(`🔓 تم دخول: ${user.name} (${universityId})`);
        return res.json({
            token: generateToken(user.id),
            user: {
                id: user.id,
                name: user.name,
                universityId: user.universityId,
                role: user.role,
                batch: user.batch,
                avatar: user.avatar || null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
    const { name, universityId, password, role, gender } = req.body;

    try {

        // تحقق من صحة تنسيق الرقم الجامعي بناءً على طول الرقم
        // طالب => 8 أرقام، دكتور/أدمن => 4 أرقام
        if (!universityId || !/^[0-9]+$/.test(universityId)) return res.status(400).json({ message: 'الرقم الجامعي غير صالح' });
        if (universityId.length === 8) {
            // طالب
            if (role && role !== 'student') return res.status(400).json({ message: 'لا يمكن تحديد دور مخالف لطالب لرقم جامعي بطول 8' });
        } else if (universityId.length === 4) {
            // دكتور/أدمن
            if (role && !['doctor', 'admin', 'assistant'].includes(role)) return res.status(400).json({ message: 'دور غير صالح لرقم الجامعة هذا' });
        } else {
            return res.status(400).json({ message: 'طول الرقم الجامعي غير مدعوم' });
        }

        const userExists = await User.findOne({ where: { universityId } });

        if (userExists) {
            return res.status(400).json({ message: 'هذا الرقم الجامعي مسجل مسبقاً' });
        }

        // Create user in pending state; admin/owner must approve
        // الجنس مطلوب ويجب أن يكون 'male' أو 'female'
        if (!gender || !['male','female'].includes(gender)) return res.status(400).json({ message: 'حقل الجنس مطلوب ويجب أن يكون male أو female' });

        const user = await User.create({
            name,
            universityId,
            password,
            role,
            gender,
            status: 'pending'
        });

        if (user) {
            // notify owner (universityId === '0000') about pending registration
            const owner = await User.findOne({ where: { universityId: '0000' } });
            if (owner) {
                await Notification.create({
                    type: 'system',
                    senderId: user.id,
                    receiverId: owner.id,
                    meta: { action: 'registration', userId: user.id, name: user.name, universityId: user.universityId }
                });
            }

            res.status(201).json({ message: 'تم استلام طلب التسجيل. انتظر موافقة المالك.' });
        } else {
            res.status(400).json({ message: 'بيانات المستخدم غير صحيحة' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'حدث خطأ أثناء التسجيل' });
    }
};

// طلب استعادة كلمة المرور: يرسل إشعاراً للمالك (0000) مع بيانات الاتصال
export const forgotPassword = async (req, res) => {
    try {
        const { universityId } = req.body;
        if (!universityId) return res.status(400).json({ message: 'الرجاء ادخال الرقم الجامعي' });

        const user = await User.findOne({ where: { universityId } });
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        // إيجاد المالك
        const owner = await User.findOne({ where: { universityId: '0000' } });
        if (!owner) return res.status(500).json({ message: 'لا يوجد مالك معرف' });

        // إنشاء إشعار لصاحب النظام يحتوي على البريد والواتس
        await Notification.create({
            type: 'forgot_password',
            senderId: user.id,
            receiverId: owner.id,
            meta: { email: user.email || null, whatsapp: user.whatsapp || null, universityId: user.universityId }
        });

        res.json({ message: 'تم إرسال الطلب للمالك، سيتواصل معك قريبا' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'فشل إرسال الطلب' });
    }
};