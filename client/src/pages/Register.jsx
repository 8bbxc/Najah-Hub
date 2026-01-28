import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    universityId: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    gender: '',
    doctorKey: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else if (stored === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
    } catch (e) {}

    const onStorage = (ev) => {
      if (ev.key === 'theme') {
        const val = ev.newValue;
        if (val === 'dark') {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
        } else {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      try { window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode ? 'dark' : 'light' })); } catch (e) { window.dispatchEvent(new Event('themeChange')); }
    } catch (e) {}
  }; 

  const { name, universityId, password, confirmPassword, role, doctorKey } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.gender) return setError('الرجاء اختيار الجنس');
    if (!name || !universityId || !password || !confirmPassword) return setError('الرجاء تعبئة جميع الحقول المطلوبة');
    if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين');
    setLoading(true);

    try {
      const payload = { ...formData };
      delete payload.confirmPassword;
      const res = await axios.post(`${API}/api/auth/register`, payload);
      alert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ ما');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Floating CPU visuals
  const cpuControls = useAnimation();
  const coreControls = useAnimation();
  const cpuRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const maxTilt = 8;
  const bob = { y: [0, -10, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } };

  useEffect(() => {
    coreControls.start({ scale: [1, 1.12, 1], opacity: [1, 0.65, 1], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } });
  }, [coreControls]);

  useEffect(() => {
    cpuControls.start({ boxShadow: isDarkMode ? ['0 20px 40px rgba(6,182,212,0.06)', '0 30px 60px rgba(6,182,212,0.08)', '0 20px 40px rgba(6,182,212,0.06)'] : ['0 20px 40px rgba(59,130,246,0.06)', '0 30px 60px rgba(59,130,246,0.08)', '0 20px 40px rgba(59,130,246,0.06)'], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } });
  }, [cpuControls, isDarkMode]);

  const onCpuMouseMove = (e) => {
    if (!cpuRef.current) return;
    const rect = cpuRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const rx = Math.max(-maxTilt, Math.min(maxTilt, (-dy / rect.height) * maxTilt));
    const ry = Math.max(-maxTilt, Math.min(maxTilt, (dx / rect.width) * maxTilt));
    setTilt({ rx, ry });
  };

  const onCpuMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  // Input styles (strict dark-mode white text & gray placeholders)
  const inputBase = 'w-full pr-10 pl-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none';
  const inputLight = 'bg-white/70 text-slate-900 border-gray-200 focus:shadow-[0_0_10px_rgba(59,130,246,0.12)]';
  const inputDark = 'dark:bg-white/5 dark:text-white dark:border-white/10 focus:shadow-[0_0_14px_rgba(6,182,212,0.35)]';

  const submitStyle = 'w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_10px_30px_rgba(6,182,212,0.18)]';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl"
      style={{
        background: isDarkMode
          ? 'radial-gradient(1200px 500px at 50% 40%, #07122a 0%, #021026 40%, #01040a 100%)'
          : 'radial-gradient(1000px 400px at 50% 40%, #f8fafc 0%, #e6eef8 40%, #eef6ff 100%)'
      }} 
    >
      <div className="w-full max-w-3xl mx-auto relative flex flex-col items-center gap-6">

        {/* Theme toggle top-left */}
        <div className="absolute left-6 top-6">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'تبديل لوضع الضوء' : 'تبديل لوضع الداكن'}
            className="inline-flex items-center justify-center p-2 rounded-md bg-white/10 dark:bg-slate-800/60 text-slate-900 dark:text-white hover:shadow transition"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Heading */}
        <div className="text-center z-20">
          <h1 className="text-3xl bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-extrabold drop-shadow-sm">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">بوابة الهندسة المستقبلية — أنشئ حسابك وابدأ المغامرة</p>
        </div>

        {/* Floating CPU */}
        <motion.div
          ref={cpuRef}
          onMouseMove={onCpuMouseMove}
          onMouseLeave={onCpuMouseLeave}
          animate={{ y: bob.y }}
          transition={bob.transition}
          className="relative z-30 flex items-center justify-center"
          style={{ perspective: 1200 }}
        >
          <motion.div
            animate={{ rotateX: tilt.rx, rotateY: tilt.ry, translateZ: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 12 }}
            initial={{ rotateX: 0, rotateY: 0 }}
            className="rounded-2xl"
          >
            <motion.div
              animate={cpuControls}
              className={`relative flex items-center justify-center rounded-2xl w-64 h-44 ${isDarkMode ? 'bg-white/5 border border-white/8' : 'bg-white/40 border border-white/30'}`}
              style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', transformStyle: 'preserve-3d' }}
            >
              {/* Pins */}
              <div className="absolute inset-y-4 -left-6 flex flex-col gap-1 z-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={'l' + i} className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(180deg,#d4af37,#ffd87a)', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                ))}
              </div>

              <div className="absolute inset-y-4 -right-6 flex flex-col gap-1 z-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={'r' + i} className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(180deg,#d4af37,#ffd87a)', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                ))}
              </div>

              <div className="absolute w-52 h-32 rounded-xl border border-white/10" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }} />

              <motion.div animate={coreControls} className="relative z-10 w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: isDarkMode ? 'linear-gradient(180deg,#06b6d4,#0ea5e9)' : 'linear-gradient(180deg,#60a5fa,#06b6d4)', boxShadow: isDarkMode ? '0 8px 30px rgba(6,182,212,0.18)' : '0 8px 30px rgba(59,130,246,0.14)' }}>
                <div className="w-7 h-7 rounded-sm bg-white/30" />
              </motion.div>

              <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 200 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: isDarkMode ? 0.28 : 0.22 }}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0%" stopColor={isDarkMode ? '#06b6d4' : '#3b82f6'} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={isDarkMode ? '#34d399' : '#06b6d4'} stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path d="M20 110 L60 80 L90 95 L140 60" fill="none" stroke="url(#g1)" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M30 30 L80 50 L120 35 L170 60" fill="none" stroke="url(#g1)" strokeWidth="0.9" strokeLinecap="round" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Registration card */}
        <div className="w-full max-w-2xl mx-auto z-20 -mt-8">
          <div className={`relative p-8 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-white/4 border border-white/8' : 'bg-white/60 border border-white/30'}`} style={{ backdropFilter: 'blur(20px)' }}>

            <form onSubmit={onSubmit} className="space-y-4" aria-label="register-form">

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Row 1: Name (right) | University ID (left) */}
                <div className="col-span-1">
                  <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">الاسم الرباعي</label>
                  <input name="name" value={name} onChange={onChange} required placeholder="مثال: أحمد محمد علي" className={`${inputBase} ${inputLight} ${inputDark} text-right placeholder-gray-400 dark:placeholder-gray-400`} />
                </div>

                <div className="col-span-1">
                  <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">الرقم الجامعي</label>
                  <input name="universityId" value={universityId} onChange={onChange} required placeholder="مثال: 12345678" className={`${inputBase} ${inputLight} ${inputDark} text-right placeholder-gray-400 dark:placeholder-gray-400`} />
                </div>

                {/* Row 2: Password | Confirm Password */}
                <div className="col-span-1">
                  <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">كلمة المرور</label>
                  <div className="relative">
                    <input name="password" value={password} onChange={onChange} type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className={`${inputBase} ${inputLight} ${inputDark} text-right placeholder-gray-400 dark:placeholder-gray-400`} />
                    <button type="button" aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} onClick={() => setShowPassword(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">تأكيد كلمة المرور</label>
                  <input name="confirmPassword" value={confirmPassword} onChange={onChange} type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className={`${inputBase} ${inputLight} ${inputDark} text-right placeholder-gray-400 dark:placeholder-gray-400`} />
                </div>

                {/* Row 3: Role | Gender */}
                <div className="col-span-1">
                  <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">الصفة الأكاديمية</label>
                  <select name="role" value={role} onChange={onChange} className={`${inputBase} ${inputLight} ${inputDark} text-right`}>
                    <option value="student" className="text-slate-900 dark:text-white">طالب</option>
                    <option value="doctor" className="text-slate-900 dark:text-white">دكتور</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">الجنس</label>
                  <select name="gender" value={formData.gender} onChange={onChange} required className={`${inputBase} ${inputLight} ${inputDark} text-right`}>
                    <option value="" className="text-slate-900 dark:text-white">اختر الجنس</option>
                    <option value="male" className="text-slate-900 dark:text-white">ذكر</option>
                    <option value="female" className="text-slate-900 dark:text-white">أنثى</option>
                  </select>
                </div>

                {/* Doctor key - full width when visible */}
                {role === 'doctor' && (
                  <div className="col-span-2">
                    <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">مفتاح تسجيل الدكاترة</label>
                    <input name="doctorKey" value={doctorKey} onChange={onChange} placeholder="أدخل الكود السري الخاص بالدكاترة" className={`${inputBase} ${inputLight} ${inputDark} text-right placeholder-gray-400 dark:placeholder-gray-400`} />
                  </div>
                )}

              </div>

              <div className="mt-4">
                <button type="submit" disabled={loading} className={submitStyle}>
                  {loading ? 'جارٍ الإنشاء...' : 'إنشاء حساب جديد'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500 dark:text-gray-400">هل لديك حساب بالفعل؟ <Link to="/login" className="font-semibold text-blue-600 dark:text-white hover:underline">سجل دخولك هنا</Link></p>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;