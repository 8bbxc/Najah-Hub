import { useState } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [universityId, setUniversityId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    // basic validation: whatsapp should start with + and digits, email should look like an email
    if (!whatsapp || !/^\+?[0-9]{6,15}$/.test(whatsapp.replace(/\s+/g, ''))) {
      return alert('يرجى إدخال رقم واتساب صحيح متضمنًا المقدمة (مثال: +9705xxxxxxx)');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return alert('يرجى إدخال بريدك الجامعي الصحيح');
    }

    try {
      await axios.post(`${API}/api/auth/forgot-password`, { universityId, whatsapp, email });
      alert('تم إرسال الطلب إلى المالك. سيتواصل معك.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إرسال الطلب');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="max-w-md w-full card-bg rounded-2xl shadow p-8 border border-gray-100">
        <h2 className="text-2xl font-extrabold mb-4">نسيت كلمة المرور</h2>
        <p className="text-sm text-gray-500 mb-4">ادخل رقمك الجامعي، رقم واتساب مع المقدمة، وبريدك الجامعي ليتواصل معك المالك.</p>
        <form onSubmit={submit} className="space-y-4">
          <input value={universityId} onChange={e=>setUniversityId(e.target.value)} placeholder="الرقم الجامعي" className="w-full p-3 border rounded-lg" />
          <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="واتساب (مع المقدمة) مثل +9705...." className="w-full p-3 border rounded-lg" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الجامعي" className="w-full p-3 border rounded-lg" />
          <button className="w-full bg-najah-primary text-white p-3 rounded-lg font-bold">إرسال الطلب</button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
