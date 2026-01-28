import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API } from '../utils/api';

export default function RobotLogin({ onSuccess }) {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const leftPupilRef = useRef(null);
  const rightPupilRef = useRef(null);
  const leftHandRef = useRef(null);
  const rightHandRef = useRef(null);

  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPwdFocus, setIsPwdFocus] = useState(false);
  const [loading, setLoading] = useState(false);

  // update pupils based on caret (index / approx max characters)
  const updateEyes = () => {
    const el = emailRef.current;
    if (!el) return;
    try {
      const maxChars = 28; // approximate visible characters
      const caret = el.selectionEnd || el.value.length || 0;
      const ratio = Math.min(1, Math.max(0, caret / maxChars));
      // map ratio (0..1) to transform range (-8 .. +8)
      const x = (ratio - 0.5) * 16;
      const y = Math.min(2, Math.max(-2, (Math.sin(ratio * Math.PI * 2) * 2)) );
      if (leftPupilRef.current) leftPupilRef.current.style.transform = `translate(${x}px, ${y}px)`;
      if (rightPupilRef.current) rightPupilRef.current.style.transform = `translate(${x}px, ${y}px)`;
    } catch (e) { console.error('updateEyes error', e); }
  };

  useEffect(() => {
    // initial eye position
    updateEyes();
    const el = emailRef.current;
    if (!el) return;
    const handler = () => updateEyes();
    el.addEventListener('input', handler);
    el.addEventListener('click', handler);
    el.addEventListener('keyup', handler);
    return () => {
      el.removeEventListener('input', handler);
      el.removeEventListener('click', handler);
      el.removeEventListener('keyup', handler);
    };
  }, []);

  useEffect(() => {
    // hands animation when focus on password or showPassword toggled
    if (leftHandRef.current && rightHandRef.current) {
      if (isPwdFocus && !showPassword) {
        // cover eyes
        leftHandRef.current.style.transform = 'translate(24px,-36px) rotate(-30deg)';
        rightHandRef.current.style.transform = 'translate(-24px,-36px) rotate(30deg)';
      } else if (showPassword) {
        // peek
        leftHandRef.current.style.transform = 'translate(18px,-12px) rotate(-15deg)';
        rightHandRef.current.style.transform = 'translate(-18px,-12px) rotate(15deg)';
      } else {
        // hands down
        leftHandRef.current.style.transform = 'translate(8px,8px) rotate(0deg)';
        rightHandRef.current.style.transform = 'translate(-8px,8px) rotate(0deg)';
      }
    }
  }, [isPwdFocus, showPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!universityId || !password) return alert('أدخل الرقم الجامعي وكلمة المرور');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { universityId, password });
      const data = res.data;
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        // ensure user fields are present and consistent with existing login behaviour
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Robot SVG */}
        <div className="flex items-center justify-center">
          <div className="w-72 h-72 flex items-center justify-center">
            <svg viewBox="0 0 220 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Head */}
              <rect x="30" y="44" width="160" height="120" rx="18" fill="url(#gradHead)" stroke="#0f172a" strokeOpacity="0.06" />

              <defs>
                <linearGradient id="gradHead" x1="0" x2="1">
                  <stop offset="0%" stopColor="#E6EAF3" />
                  <stop offset="100%" stopColor="#DDE6F8" />
                </linearGradient>
                <linearGradient id="gradEye" x1="0" x2="1">
                  <stop offset="0%" stopColor="#b794f4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Neck / base */}
              <rect x="80" y="164" width="60" height="20" rx="6" fill="#cbd5e1" opacity="0.9" />

              {/* Eyes group */}
              <g transform="translate(0,0)">
                {/* Left eye socket */}
                <g transform="translate(64,94)">
                  <ellipse cx="0" cy="0" rx="22" ry="18" fill="#fff" />
                  <circle cx="0" cy="0" r="8" fill="url(#gradEye)" />
                  <circle ref={leftPupilRef} cx="0" cy="0" r="4" fill="#030712" className="robot-pupil" />
                </g>

                {/* Right eye socket */}
                <g transform="translate(156,94)">
                  <ellipse cx="0" cy="0" rx="22" ry="18" fill="#fff" />
                  <circle cx="0" cy="0" r="8" fill="url(#gradEye)" />
                  <circle ref={rightPupilRef} cx="0" cy="0" r="4" fill="#030712" className="robot-pupil" />
                </g>
              </g>

              {/* Mouth */}
              <rect x="90" y="128" width="40" height="8" rx="4" fill="#94a3b8" />

              {/* Hands (left/right) */}
              <g>
                <rect ref={leftHandRef} x="40" y="118" width="36" height="14" rx="6" fill="#cbd5e1" className="robot-hand" />
                <rect ref={rightHandRef} x="144" y="118" width="36" height="14" rx="6" fill="#cbd5e1" className="robot-hand" />
              </g>

              {/* Antenna */}
              <g>
                <rect x="106" y="30" width="8" height="20" rx="3" fill="#cbd5e1" />
                <circle cx="110" cy="24" r="6" fill="#06b6d4" />
              </g>

            </svg>
          </div>
        </div>

        {/* Login form */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">تسجيل الدخول بالروبوت</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">ادخل بريدك وكلمة المرور لبدء استخدام مساعد الذكاء الاصطناعي.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الرقم الجامعي</label>
              <input
                ref={emailRef}
                value={universityId}
                onChange={e=>{ setUniversityId(e.target.value); setTimeout(updateEyes, 0); }}
                onSelect={updateEyes}
                onKeyUp={updateEyes}
                type="text"
                name="universityId"
                placeholder="مثال: 12345678"
                className="mt-2 w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور</label>
              <div className="mt-2 relative">
                <input
                  ref={passwordRef}
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  onFocus={()=>setIsPwdFocus(true)}
                  onBlur={()=>setIsPwdFocus(false)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300">
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" className="form-checkbox" /> تذكرني</label>
              <a href="#" className="text-sm text-najah-primary hover:underline">نسيت كلمة المرور؟</a>
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:brightness-105 transition">{loading ? 'جاري...' : 'تسجيل الدخول'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
