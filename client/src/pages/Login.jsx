import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, User, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Theme: explicit persistent state and initialization per spec
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!universityId || !password) return alert('الرجاء إدخال الرقم الجامعي وكلمة المرور');
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
          role: data.user?.role,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new Event('storage'));
        // Do not force theme on login; respect current user preference (switch is persisted globally)
        // (no-op)
        alert('تم تسجيل الدخول بنجاح');
        navigate('/home');
      } else {
        alert(res.data?.message || 'تم تسجيل الدخول لكن لم يتم استلام التوكن');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Visual helpers & state for "Floating Glass Processor"
  // ----------------------------
  const cpuControls = useAnimation();
  const coreControls = useAnimation();
  const cpuRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const maxTilt = 8; // degrees
  const bob = { y: [0, -10, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } };

  // pulse core continuously
  useEffect(() => {
    coreControls.start({
      scale: [1, 1.12, 1],
      opacity: [1, 0.6, 1],
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [coreControls]);

  // subtle glow animation for cpu base
  useEffect(() => {
    cpuControls.start({
      boxShadow: isDarkMode
        ? ['0 20px 40px rgba(34,211,238,0.06)', '0 30px 60px rgba(34,211,238,0.08)', '0 20px 40px rgba(34,211,238,0.06)']
        : ['0 20px 40px rgba(59,130,246,0.06)', '0 30px 60px rgba(59,130,246,0.08)', '0 20px 40px rgba(59,130,246,0.06)'],
      transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
    });
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

  // Inputs style helpers
  const inputBase = 'w-full pr-10 pl-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2';
  const inputLight = 'bg-white/70 text-slate-900 border-gray-200 focus:ring-blue-500/30 backdrop-blur-sm';
  const inputDark = 'dark:bg-slate-900/50 dark:text-white dark:border-slate-700 dark:focus:ring-blue-500/30 backdrop-blur-sm';

  // Button styles
  const powerBtnStyle = isDarkMode
    ? 'bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_10px_30px_rgba(34,211,238,0.12)]'
    : 'bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_10px_30px_rgba(59,130,246,0.12)]';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl"
      style={{
        background: isDarkMode
          ? 'radial-gradient(1200px 500px at 50% 40%, #07122a 0%, #020617 40%, #01040a 100%)'
          : 'radial-gradient(1000px 400px at 50% 40%, #f8fafc 0%, #e6eef8 40%, #eef6ff 100%)'
      }} 
    >
      <div className="w-full max-w-3xl mx-auto relative flex flex-col items-center gap-6">

        {/* Theme toggle top-left (kept in same place/logic) */}
        <div className="absolute left-6 top-6">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'تبديل لوضع الضوء' : 'تبديل لوضع الداكن'}
            className="inline-flex items-center justify-center p-2 rounded-md bg-white/20 dark:bg-slate-800/60 text-slate-900 dark:text-white hover:shadow transition"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Heading */}
        <div className="text-center z-20">
          <h1 className="text-3xl bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-extrabold drop-shadow-sm">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">منصة النجاح — ادخل بياناتك لتشغيل الحساب</p>
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
            animate={{
              rotateX: tilt.rx,
              rotateY: tilt.ry,
              translateZ: 0
            }}
            transition={{ type: 'spring', stiffness: 80, damping: 12 }}
            initial={{ rotateX: 0, rotateY: 0 }}
            className="rounded-2xl"
          >
            <motion.div
              animate={cpuControls}
              className={`relative flex items-center justify-center rounded-2xl w-64 h-44 ${isDarkMode ? 'bg-white/6 border border-white/10' : 'bg-white/40 border border-white/20'}`}
              style={{
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* CPU pins - left */}
              <div className="absolute inset-y-4 -left-6 flex flex-col gap-1 z-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={'l'+i} className="w-3 h-2 rounded-sm" style={{
                    background: 'linear-gradient(180deg,#d4af37,#ffd87a)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
                  }} />
                ))}
              </div>

              {/* CPU pins - right */}
              <div className="absolute inset-y-4 -right-6 flex flex-col gap-1 z-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={'r'+i} className="w-3 h-2 rounded-sm" style={{
                    background: 'linear-gradient(180deg,#d4af37,#ffd87a)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
                  }} />
                ))}
              </div>

              {/* Inner metallic frame */}
              <div className="absolute w-52 h-32 rounded-xl border border-white/10" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }} />

              {/* Glowing core */}
              <motion.div
                animate={coreControls}
                className="relative z-10 w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  background: isDarkMode ? 'linear-gradient(180deg,#06b6d4,#0ea5e9)' : 'linear-gradient(180deg,#60a5fa,#06b6d4)',
                  boxShadow: isDarkMode ? '0 8px 30px rgba(6,182,212,0.18)' : '0 8px 30px rgba(59,130,246,0.14)'
                }}
              >
                <div className="w-6 h-6 rounded-sm bg-white/30" />
              </motion.div>

              {/* Subtle micro-traces */}
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

        {/* Login card overlapping slightly */}
        <div className="w-full max-w-md mx-auto z-20 -mt-10">
          <div className={`relative p-8 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-white/4 border border-white/8' : 'bg-white/60 border border-white/30'}`} style={{ backdropFilter: 'blur(12px)' }}>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="login-form">

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-200">الرقم الجامعي</label>
                <div className="mt-2 relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 dark:text-white">
                    <User size={18} />
                  </span>
                  <input
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    type="text"
                    name="universityId"
                    placeholder="مثال: 12345678"
                    className={`${inputBase} ${inputLight} ${inputDark} pr-10 text-right placeholder-gray-400 dark:placeholder-gray-400`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-200">كلمة المرور</label>
                <div className="mt-2 relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 dark:text-white">
                    <Lock size={18} />
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    className={`${inputBase} ${inputLight} ${inputDark} pr-10 text-right placeholder-gray-400 dark:placeholder-gray-400`}
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800 dark:text-white"
                  >
                    {showPassword ? <EyeOff size={18} className="text-blue-500" /> : <Eye size={18} className="text-blue-500" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-700 dark:text-gray-200"><input type="checkbox" className="form-checkbox" /> تذكرني</label>
                <Link to="/forgot" className="text-sm text-blue-600 dark:text-white hover:underline">نسيت كلمة المرور؟</Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold ${powerBtnStyle} transition`}
                >
                  {loading ? 'جارٍ التشغيل...' : 'تشغيل'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500 dark:text-gray-400">ليس لديك حساب؟ <Link to="/register" className="font-semibold text-blue-600 dark:text-white hover:underline">إنشاء حساب جديد</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}