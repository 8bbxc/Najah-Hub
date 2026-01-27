import { useState } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';

const OwnerLogin = () => {
  const [formData, setFormData] = useState({
    universityId: '0000', 
    password: '' // 🟢 تركناه فارغاً لتكتب الباسورد الجديد بنفسك
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/api/auth/login`, formData);
      
      if (res.data.user.universityId !== '0000') {
          setError("عذراً، هذه البوابة للمالك Eng. Yazan فقط!");
          return;
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/home'); 
    } catch (err) {
      setError('كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-mono">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="bg-najah-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,100,0.3)]">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-400 tracking-wider">SYSTEM CONTROL</h2>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded mb-6 text-center text-sm">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 mb-2 text-xs uppercase tracking-widest">Access Key</label>
            <div className="relative">
                <Lock className="absolute right-3 top-3 text-gray-500" size={18} />
                <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})} // 🟢 الآن يمكنك الكتابة
                placeholder="Enter your new password..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 text-left dir-ltr text-white"
                />
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-bold hover:from-green-500 hover:to-teal-500 transition duration-300 shadow-lg">
            ACCESS DASHBOARD
          </button>
        </form>
      </div>
    </div>
  );
};

export default OwnerLogin;