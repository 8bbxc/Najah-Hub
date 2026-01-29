import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, Sun, Moon } from 'lucide-react';

export default function AIChatNavbar({ user }) {
  const [dark, setDark] = useState(() => !!document.documentElement.classList.contains('dark'));
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  };

  const displayName = user?.name || 'Najah AI';
  const avatar = user?.avatar || null;
  const initials = (user?.name || 'AH').split(' ').map(p=>p[0]).slice(0,2).join('');

  return (
    <header className="fixed inset-x-4 top-6 z-50 rounded-lg px-6 py-3 backdrop-blur-md border border-transparent dark:border-white/6 bg-slate-900/40 dark:bg-slate-900/50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center gap-6 justify-between" dir="rtl">

        {/* Right: Links */}
        <nav className="flex items-center gap-5">
          <Link to="/home" className="text-sm text-slate-300 hover:text-white transition">الصفحة الرئيسية</Link>
          <Link to="/communities" className="text-sm text-slate-300 hover:text-white transition">المجتمع</Link>
          <Link to="/resources" className="text-sm text-slate-300 hover:text-white transition">الموارد</Link>
        </nav>

        {/* Center / Profile Block (now dynamic) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-1">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-black font-bold overflow-hidden">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-sm">{initials}</span>}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white">{displayName}</div>
              <div className="text-xs text-slate-300">AI Assistant...</div>
            </div>
          </div>
        </div>

        {/* Left: Actions */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm ai-gradient-btn shadow-md">اشترك</button>

          <div className="flex items-center gap-2 bg-slate-800/40 px-2 py-1 rounded-md">
            <button className="p-1 rounded text-slate-200 hover:text-white"><User size={18} /></button>
            <button className="p-1 rounded text-slate-200 hover:text-white relative">
              <Bell size={18} />
              <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">3</span>
            </button>
            <button onClick={toggleTheme} className="p-1 rounded text-slate-200 hover:text-white">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
