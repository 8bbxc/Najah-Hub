import { useState } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    universityId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { universityId, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ إرسال طلب الدخول للسيرفر
      const res = await axios.post(`${API}/api/auth/login`, formData);
      
      // ✅ تخزين التوكن
      localStorage.setItem('token', res.data.token);
      
      // ✅ السحر هنا: التأكد من تخزين بيانات المستخدم كاملة (بما فيها الصورة)
      // إذا كان السيرفر يرسل الصورة باسم avatar تأكد أنها موجودة في res.data.user
      const userData = {
        id: res.data.user.id,
        name: res.data.user.name,
        universityId: res.data.user.universityId,
        avatar: res.data.user.avatar || null, // لضمان عدم ضياع حقل الصورة
        role: res.data.user.role
      };

      localStorage.setItem('user', JSON.stringify(userData));

      // ✅ إرسال حدث للمتصفح بأن البيانات تغيرت لضمان تحديث النافبار فوراً
      window.dispatchEvent(new Event('storage'));

      // ✅ التوجيه للصفحة الرئيسية
      navigate('/home'); 
    } catch (err) {
      setError(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 font-sans">
      <div className="max-w-md w-full card-bg rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
           <div className="bg-najah-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg mx-auto mb-4">NH</div>
           <h2 className="text-3xl font-black text-gray-800">تسجيل الدخول 🔐</h2>
           <p className="text-gray-400 text-sm mt-2 font-medium italic">أهلاً بك مجدداً في Najah Hub</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-center text-sm font-bold animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5" dir="rtl">
          <div>
            <label className="block text-gray-700 mb-2 font-bold text-sm mr-1">الرقم الجامعي</label>
            <input
              type="text"
              name="universityId"
              value={universityId}
              onChange={onChange}
              required
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-najah-primary/20 focus:border-najah-primary transition-all text-sm"
              placeholder="مثال: 12111XXX"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-bold text-sm mr-1">كلمة المرور</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-najah-primary/20 focus:border-najah-primary transition-all text-sm"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-najah-primary text-white py-4 rounded-xl font-black hover:bg-green-700 transition duration-300 shadow-lg shadow-green-100 mt-2"
          >
            دخول للمنصة
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-50 pt-6">
          <p className="text-gray-500 text-sm font-medium">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-najah-primary font-black hover:underline">
              أنشئ حساباً جديداً
            </Link>
          </p>
            <p className="text-gray-400 text-sm mt-2">نسيت كلمة المرور؟ <Link to="/forgot" className="text-najah-primary font-bold">اضغط هنا</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;