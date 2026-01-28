import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function ProLogin({ onSuccess }) {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState(null);
  const applyTheme = (t) => {
    if (typeof document === 'undefined') return;
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      applyTheme(initial);
    }
  }, []);
  useEffect(() => {
    if (!theme) return;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }, [theme]);
  // theme toggle kept for future use

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!universityId || !password) return alert('أدخل الرقم الجامعي وكلمة المرور');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { universityId, password });
      const data = res.data;
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        const userData = {
          id: data.user?.id,
          name: data.user?.name,
          universityId: data.user?.universityId,
          avatar: data.user?.avatar || null,
          role: data.user?.role
        };
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new Event('storage'));
        alert('تم تسجيل الدخول بنجاح');
        if (onSuccess) onSuccess();
      } else {
        alert(res.data?.message || 'تم تسجيل الدخول لكن لم يصلك توكن');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'فشل تسجيل الدخول');
    } finally { setLoading(false); }
  };

  const inputBase = 'w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2';
  const inputLight = 'bg-white text-slate-900 border-gray-200 focus:ring-blue-500/20';
  const inputDark = 'dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:focus:ring-blue-500/20';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-6">

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 opacity-70"></div>
        <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(2,6,23,0.06)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          <img src="/najah-hub-icon.png" alt="Najah Hub" className="w-16 h-16 drop-shadow-lg" />
        </div>

        <div className="relative bg-white dark:bg-slate-900 border rounded-2xl p-8 shadow-2xl dark:border-slate-800 border-gray-200">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">مرحباً بعودتك</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-200">سجّل دخولك إلى منصة النجاح</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200">الرقم الجامعي</label>
              <div className="mt-2 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  ref={emailRef}
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  type="text"
                  name="universityId"
                  placeholder="مثال: 12345678"
                  className={`${inputBase} pl-10 ${inputLight} ${inputDark} focus:ring-blue-500/20`} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200">كلمة المرور</label>
              <div className="mt-2 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  ref={passwordRef}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`${inputBase} pl-10 pr-12 ${inputLight} ${inputDark} focus:ring-blue-500/20`} />

                <button
                  type="button"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">
                  {showPassword ? <EyeOff size={18} className="text-blue-400" /> : <Eye size={18} className="text-blue-400" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 dark:text-gray-200"><input type="checkbox" className="form-checkbox" /> تذكرني</label>
              <Link to="/forgot" className="text-sm text-blue-600 hover:underline">نسيت كلمة المرور؟</Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
                {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-gray-200">لا تملك حسابًا؟ <Link to="/register" className="font-semibold text-blue-600 hover:underline">سجّل الآن</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
