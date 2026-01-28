import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

export default function ForgotPassword() {
  const [universityId, setUniversityId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (stored === null && prefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
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
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        if (next) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
        try { window.dispatchEvent(new CustomEvent('themeChange', { detail: next ? 'dark' : 'light' })); } catch (e) { window.dispatchEvent(new Event('themeChange')); }
      } catch (e) {}
      return next;
    });
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

  // Input styles
  const inputBase = 'w-full pr-4 pl-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none';
  const inputLight = 'bg-white/70 text-slate-900 border-gray-200 focus:shadow-[0_0_10px_rgba(59,130,246,0.12)]';
  const inputDark = 'dark:bg-white/5 dark:text-white dark:border-white/10 focus:shadow-[0_0_14px_rgba(6,182,212,0.35)]';

  const submitStyle = 'w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_10px_30px_rgba(6,182,212,0.18)]';

  const onSubmit = async (e) => {
    e.preventDefault();
    // basic validation: whatsapp should start with + and digits, email should look like an email
    if (!whatsapp || !/^\+?[0-9]{6,15}$/.test(whatsapp.replace(/\s+/g, ''))) {
      return setError('يرجى إدخال رقم واتساب صحيح متضمنًا المقدمة (مثال: +9705xxxxxxx)');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError('يرجى إدخال بريدك الجامعي الصحيح');
    }

    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { universityId, whatsapp, email });
      alert('تم إرسال الطلب إلى المالك. سيتواصل معك.');
      // preserve original behavior: navigate to login after success
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إرسال الطلب');
    } finally {
      setLoading(false);
    }
  }; 

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl" style={{ background: isDarkMode ? 'radial-gradient(1200px 500px at 50% 40%, #07122a 0%, #021026 40%, #01040a 100%)' : 'radial-gradient(1000px 400px at 50% 40%, #fafafa 0%, #f1f5f9 40%, #eef6ff 100%)' }}>
      <div className="w-full max-w-3xl mx-auto relative flex flex-col items-center gap-6">

        <div className="absolute left-6 top-6">
          <button type="button" onClick={toggleTheme} aria-label={isDarkMode ? 'تبديل لوضع الضوء' : 'تبديل لوضع الداكن'} className="inline-flex items-center justify-center p-2 rounded-md bg-white/10 dark:bg-slate-800/60 text-slate-900 dark:text-white hover:shadow transition" style={{ backdropFilter: 'blur(6px)' }}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="text-center z-20">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">استعادة كلمة المرور</h1>
          <p className="mt-1 text-sm text-slate-900 dark:text-white">أدخل بريدك الإلكتروني أو الرقم الجامعي لاستلام رابط التعيين.</p>
        </div>

        <motion.div ref={cpuRef} onMouseMove={onCpuMouseMove} onMouseLeave={onCpuMouseLeave} animate={{ y: bob.y }} transition={bob.transition} className="relative z-30 flex items-center justify-center" style={{ perspective: 1200 }}>
          <motion.div animate={{ rotateX: tilt.rx, rotateY: tilt.ry, translateZ: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 12 }} initial={{ rotateX: 0, rotateY: 0 }} className="rounded-2xl">
            <motion.div animate={cpuControls} className={`relative flex items-center justify-center rounded-2xl w-64 h-44 ${isDarkMode ? 'bg-white/5 border border-white/8' : 'bg-white/40 border border-white/30'}`} style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', transformStyle: 'preserve-3d' }}>
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

        <div className="w-full max-w-md mx-auto z-20 -mt-8">
          <div className={`relative p-8 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-white/8 border border-white/10' : 'bg-white/90 border border-white/30'}`} style={{ backdropFilter: 'blur(20px)' }}>

            <form onSubmit={onSubmit} className="space-y-4" aria-label="forgot-form">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">الرقم الجامعي</label>
                <input name="universityId" value={universityId} onChange={(e) => setUniversityId(e.target.value)} placeholder="الرقم الجامعي" className={`${inputBase} ${inputLight} ${inputDark} text-right placeholder-gray-400 dark:placeholder-gray-400`} />
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">واتساب (مع المقدمة)</label>
                <input name="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="مثال: +9705xxxxxxx" className={`${inputBase} ${inputLight} ${inputDark} text-right placeholder-gray-400 dark:placeholder-gray-400`} />
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-700 dark:text-gray-200">البريد الجامعي</label>
                <input name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الجامعي" className={`${inputBase} ${inputLight} ${inputDark} text-right placeholder-gray-400 dark:placeholder-gray-400`} />
              </div> 

              <div className="mt-4">
                <button type="submit" disabled={loading} className={submitStyle}>
                  {loading ? 'جارٍ الإرسال...' : 'إرسال رابط التحقق'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-blue-600 dark:text-white hover:underline">العودة لتسجيل الدخول</Link>
              </div>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
