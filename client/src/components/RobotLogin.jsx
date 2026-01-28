import React, { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API } from '../utils/api';
import { Link } from 'react-router-dom';

export default function RobotLogin({ onSuccess }) {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!universityId || !password) return alert('Please enter university ID and password');
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
        if (onSuccess) onSuccess();
      } else {
        alert(res.data?.message || 'Login succeeded but no token returned');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="rtl">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          <img src="/najah-hub-icon.png" alt="Najah Hub" className="w-16 h-16" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>

        <div className="bg-white border rounded-2xl p-8 shadow-md border-gray-200">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Login</h1>
            <p className="mt-1 text-sm text-slate-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">University ID</label>
              <input
                ref={emailRef}
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                type="text"
                name="universityId"
                placeholder="12345678"
                className="w-full mt-2 px-4 py-3 rounded-lg border bg-white text-slate-900 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-2 relative">
                <input
                  ref={passwordRef}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border bg-white text-slate-900 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm">
                  {showPassword ? <EyeOff size={16} className="text-blue-400" /> : <Eye size={16} className="text-blue-400" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600">Don't have an account? <Link to="/register" className="font-semibold text-blue-600">Sign Up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
