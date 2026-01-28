import { useState } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    universityId: '',
    password: '',
    role: 'student',
    gender: '',
    doctorKey: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { name, universityId, password, role, doctorKey } = formData;

  // include gender in destructuring for ease
  const gender = formData.gender;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gender) {
      setError('الرجاء اختيار الجنس');
      return;
    }
    try {
      // إرسال البيانات للسيرفر
      await axios.post(`${API}/api/auth/register`, formData);
      alert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
      navigate('/login'); // توجيه المستخدم لصفحة الدخول بعد النجاح
    } catch (err) {
      // عرض رسالة الخطأ القادمة من السيرفر
      setError(err.response?.data?.message || 'حدث خطأ ما');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-najah-primary dark:text-white mb-6">
          إنشاء حساب جديد 🎓
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

          <form onSubmit={onSubmit} className="space-y-4">
          {/* الاسم */}
          <div>
            <label className="block text-gray-700 mb-2">الاسم الرباعي</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-najah-primary"
              placeholder="مثال: أحمد محمد علي"
            />
          </div>

          {/* الرقم الجامعي */}
          <div>
            <label className="block text-gray-700 mb-2">الرقم الجامعي</label>
            <input
              type="text"
              name="universityId"
              value={universityId}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-najah-primary"
              placeholder="مثال: 12345678"
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-najah-primary"
              placeholder="********"
            />
          </div>

          {/* الدور (طالب أو دكتور) */}
          <div>
            <label className="block text-gray-700 mb-2">الصفة الأكاديمية</label>
            <select
              name="role"
              value={role}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-najah-primary bg-gray-50"
            >
              <option value="student">طالب</option>
              <option value="doctor">دكتور</option>
            </select>
          </div>

            {/* Gender (required) */}
            <div>
              <label className="block text-gray-700 mb-2">الجنس</label>
              <select
                name="gender"
                value={gender}
                onChange={onChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-najah-primary bg-gray-50"
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

          {/* حقل خاص بالدكاترة فقط */}
          {role === 'doctor' && (
            <div>
              <label className="block text-gray-700 mb-2">مفتاح تسجيل الدكاترة</label>
              <input
                type="password"
                name="doctorKey"
                value={doctorKey}
                onChange={onChange}
                className="w-full px-4 py-2 border border-najah-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-najah-accent"
                placeholder="أدخل الكود السري الخاص بالدكاترة"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-najah-primary text-white py-3 rounded-lg font-bold hover:bg-najah-secondary transition duration-300"
          >
            تسجيل حساب
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-najah-primary font-bold hover:underline">
              سجل دخولك هنا
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;