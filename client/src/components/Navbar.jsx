import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Home, Menu, UserCircle, Bell, X, Moon, Sun, Settings as SettingsIcon, Cpu } from 'lucide-react';
import AthkarBar from './AthkarBar';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, SOCKET } from '../utils/api';

const Navbar = ({ user: userProp }) => {
  const navigate = useNavigate();
  
  // ✅ الحالة الأساسية للمستخدم (تبحث في الـ Props أولاً ثم التخزين المحلي)
  const [userData, setUserData] = useState(userProp || JSON.parse(localStorage.getItem('user')));
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
    } catch (e) { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [navLoading, setNavLoading] = useState(false);
  const [loadingPath, setLoadingPath] = useState(null);

  useEffect(() => {
    // clear loading indicator after route change (keeps bar visible briefly for smoothness)
    if (navLoading) {
      const t = setTimeout(() => { setNavLoading(false); setLoadingPath(null); }, 320);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  // ✅ مزامنة البيانات عند حدوث أي تغيير في الـ localStorage (مثل تغيير الصورة)
  useEffect(() => {
    const syncUserData = () => {
      const currentStoredUser = JSON.parse(localStorage.getItem('user'));
      setUserData(currentStoredUser);
    };

    window.addEventListener('storage', syncUserData);
    // تحديث الحالة إذا تغير الـ Prop القادم من الأب
    if (userProp) setUserData(userProp);

    return () => window.removeEventListener('storage', syncUserData);
  }, [userProp]);

  // ✅ إعداد السوكت
  useEffect(() => {
    const newSocket = io(SOCKET || API);
    setSocket(newSocket);

    if (userData?.id) {
      newSocket.emit("newUser", { userId: userData.id, name: userData.name, avatar: userData.avatar });
    }

    return () => newSocket.close();
  }, [userData?.id]);

  // theme init + listener for global themeChange
  useEffect(() => {
    const applyTheme = (t) => {
      if (t === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      setDark(t === 'dark');
    };

    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') applyTheme(stored);
      else { applyTheme('light'); localStorage.setItem('theme', 'light'); }
    } catch (e) { applyTheme('light'); }

    const handler = (ev) => {
      const t = ev?.detail || localStorage.getItem('theme') || 'light';
      applyTheme(t);
    };
    window.addEventListener('themeChange', handler);
    return () => window.removeEventListener('themeChange', handler);
  }, []);

  const toggleDark = () => {
    try {
      const newTheme = dark ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
      setDark(newTheme === 'dark');
      console.debug('[Navbar] toggled theme ->', newTheme);
      try { window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme })); } catch (e) { window.dispatchEvent(new Event('themeChange')); }
    } catch (e) { console.error('toggle theme failed', e); }
  };

  // ✅ الاستماع للتنبيهات اللحظية
  useEffect(() => {
    if (socket) {
      socket.on("getNotification", (data) => {
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
      // apply settings updates pushed from server
      socket.on('settingsUpdated', (s) => {
        try {
          const mode = s?.theme?.mode || 'dark';
          const primary = s?.theme?.primary || '#0ea5e9';
          if (mode === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
          document.documentElement.style.setProperty('--najah-primary', primary);
          document.documentElement.style.setProperty('--najah-accent', primary);
          document.documentElement.style.setProperty('--accent', primary);
        } catch (e) { console.error('apply settings failed', e); }
      });
    }
  }, [socket]);

  // ✅ جلب التنبيهات من السيرفر
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
          const res = await axios.get(`${API}/api/notifications`, config);
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.isRead).length);
      } catch (err) {
        console.error("خطأ جلب الإشعارات", err);
      }
    };
    if (userData?.id) fetchNotifications();
  }, [userData?.id]);

  const toggleNotifications = async () => {
    if (!showNotifMenu && unreadCount > 0) {
      try {
        await axios.put(`${API}/api/notifications/mark-as-read`, {}, config);
        setUnreadCount(0);
      } catch (err) { console.error(err); }
    }
    setShowNotifMenu(!showNotifMenu);
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API}/api/notifications/${id}`, config);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed delete', err);
      alert(err.response?.data?.message || 'فشل حذف الإشعار');
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('هل أنت متأكد من مسح كل الإشعارات؟')) return;
    try {
      await axios.delete(`${API}/api/notifications`, config);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed clear', err);
      alert(err.response?.data?.message || 'فشل مسح الإشعارات');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
    <nav className={`sticky top-0 z-50 app-header border-b ${navLoading ? 'loading' : ''}`} >
      <div className="max-w-7xl mx-auto px-4 font-sans">
        <div className="flex justify-between items-center h-16">
          
          {/* الشعار */}
          <NavLink to="/home" onClick={()=>{ setNavLoading(true); setLoadingPath('/home'); }} className={`flex items-center gap-2 nav-hover nav-title nav-link ${loadingPath === '/home' ? 'is-loading' : ''}`}>
            <img src="/najah-hub-icon.png" alt="Najah Hub" className="h-10 w-10 rounded-md shadow-sm" />
            <span className="text-2xl font-bold text-gray-800 hidden md:block title-text link-label">Najah Hub</span>
            <span className="link-loader" />
          </NavLink>

          {/* زر الهامبرغر للهواتف */}
          <button onClick={() => setMobileOpen(s => !s)} className="md:hidden p-2 text-gray-600 mr-2" aria-label="menu-toggle">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* روابط التنقل */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/home" onClick={()=>{ setNavLoading(true); setLoadingPath('/home'); }} className={`flex items-center gap-2 text-gray-600 nav-hover nav-link hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white ${loadingPath === '/home' ? 'is-loading' : ''}`}>
              <Home size={20} className="nav-icon" /> <span className="link-label">الرئيسية</span>
              <span className="link-loader" />
            </NavLink>
            
            <NavLink to={`/profile/${userData?.id}`} onClick={()=>{ setNavLoading(true); setLoadingPath(`/profile/${userData?.id}`); }} className={`flex items-center gap-2 text-gray-800 nav-hover nav-link hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white ${loadingPath === `/profile/${userData?.id}` ? 'is-loading' : ''}`}>
              <User size={20} /> <span className="link-label">ملفي الشخصي</span>
              <span className="link-loader" />
            </NavLink>

            <NavLink to="/communities" onClick={()=>{ setNavLoading(true); setLoadingPath('/communities'); }} className={`flex items-center gap-2 text-gray-800 nav-hover nav-link hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white ${loadingPath === '/communities' ? 'is-loading' : ''}`}>
              <Menu size={20} /> <span className="link-label">المجتمعات</span>
              <span className="link-loader" />
            </NavLink>

            <NavLink to="/ai" onClick={()=>{ setNavLoading(true); setLoadingPath('/ai'); }} className={`flex items-center gap-2 text-gray-800 nav-hover nav-link hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white ${loadingPath === '/ai' ? 'is-loading' : ''}`}>
              <Cpu size={18} /> <span className="link-label">الذكاء</span>
              <span className="link-loader" />
            </NavLink>

            <NavLink to="/settings" onClick={()=>{ setNavLoading(true); setLoadingPath('/settings'); }} className={`flex items-center gap-2 text-gray-800 nav-hover nav-link hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white ${loadingPath === '/settings' ? 'is-loading' : ''}`}>
              <SettingsIcon size={20} /> <span className="link-label">الإعدادات</span>
              <span className="link-loader" />
            </NavLink>
          </div>

            <div className="flex items-center gap-2 md:gap-4">
            {/* جرس الإشعارات */}
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className={`p-2 rounded-full transition relative nav-hover ${showNotifMenu ? 'bg-gray-100 text-najah-primary' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute left-0 md:-left-20 mt-3 w-80 card-bg border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-fade-in" dir="rtl">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <span className="font-bold text-gray-800">التنبيهات</span>
                    <div className="flex items-center gap-2">
                      <button onClick={clearAllNotifications} className="text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-1 rounded">مسح الكل</button>
                      <button onClick={() => setShowNotifMenu(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} className={`flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                          <div onClick={() => { setShowNotifMenu(false); navigate(`/profile/${n.Sender?.id || n.senderId}`); }} role="button" tabIndex={0} className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 cursor-pointer">
                            {n.Sender?.avatar ? <img src={n.Sender.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-najah-primary text-white font-bold">{n.Sender?.name?.[0] || 'U'}</div>}
                          </div>
                          <div className="flex-1 cursor-pointer" onClick={() => { setShowNotifMenu(false); navigate(`/profile/${n.Sender?.id || n.senderId}`); }}>
                            <p className="text-sm text-gray-800">
                              <span className="font-bold">{n.Sender?.name || "مستخدم"}</span> 
                              {n.type === 'like' ? ' أعجب بمنشورك ❤️' : ' علّق على منشورك 💬'}
                            </p>
                            <span className="text-[10px] text-gray-400 font-medium">منذ قليل</span>
                          </div>
                          <button onClick={() => deleteNotification(n.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><X size={16} /></button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm font-medium italic">لا توجد تنبيهات جديدة</div>
                    )}
                  </div>
                  <div className="p-3 border-t text-center bg-gray-50">
                    <button onClick={() => { setShowNotifMenu(false); navigate('/notifications'); }} className="text-sm text-najah-primary font-bold">عرض المزيد</button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
              <span className="font-bold text-sm text-gray-800">{userData?.name || "مستخدم"}</span>
              <span className="text-[10px] text-gray-500 font-mono font-bold tracking-tighter">#{userData?.universityId || "0000"}</span>
            </div>
            
            {/* ✅ الصورة الشخصية (ثابتة وقوية) */}
            <NavLink to={`/profile/${userData?.id}`} onClick={()=>{ setNavLoading(true); setLoadingPath(`/profile/${userData?.id}`); }} className="w-10 h-10 rounded-full border-2 border-gray-100 overflow-hidden hover:border-najah-primary transition bg-gray-100 flex items-center justify-center shadow-inner group nav-hover">
              {userData?.avatar ? (
                <img src={userData.avatar} alt="avatar" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
              ) : (
                <div className="text-gray-400">
                  <UserCircle size={28} />
                </div>
              )}
            </NavLink>
            
            <button onClick={handleLogout} className="p-2 text-gray-400 nav-hover hover:text-red-500 hover:bg-red-50 rounded-full transition" title="تسجيل الخروج">
              <LogOut size={20} />
            </button>
            <button onClick={toggleDark} className="p-2 text-gray-400 nav-hover hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition" title="تبديل الثيم">
              {dark ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {/* Small persistent subscribe CTA visible on larger screens */}
            <NavLink to="/subscribe" onClick={()=>{ setNavLoading(true); setLoadingPath('/subscribe'); }} className={`hidden md:inline-flex items-center strong-btn ml-2 nav-hover nav-link ${loadingPath === '/subscribe' ? 'is-loading' : ''}`}><span className="link-label">اشترك الآن</span><span className="link-loader" /></NavLink>
          </div>
        </div>
      </div>
    </nav>
    <style>{`
      /* color vars — brighter and more visible */
      .app-header { position: relative; --navbar-accent: #60e1f3; }
      .dark .app-header { --navbar-accent: #60a5fa; }

      .nav-hover { transition: box-shadow .25s, transform .18s, color .18s; }
      .nav-hover:hover { transform: translateY(-2px); }

      .nav-link { position: relative; }
      .link-label { position: relative; display: inline-block; transition: color .18s; }
      /* color only on hover/active */
      .nav-link:hover .link-label, .nav-link.is-loading .link-label, .nav-link[aria-current="page"] .link-label { color: var(--navbar-accent); }

      /* full-width underline under the entire link (includes icon) */
      .nav-link::after { content: ''; position: absolute; left: 0; right: 0; bottom: -6px; height: 3px; width: 0%; background: var(--navbar-accent); border-radius: 3px; transform-origin: left; transition: width .28s cubic-bezier(.2,.9,.2,1), opacity .15s; opacity: 0; pointer-events:none; }
      .nav-link:hover::after, .nav-link.is-loading::after, .nav-link[aria-current="page"]::after { width: 100%; opacity: 1; }
      /* ensure logo/title doesn't get the underline */
      .nav-title::after { display: none !important; }

      .link-loader { position: absolute; left: 8px; right: 8px; bottom: -6px; height: 4px; width: 0; background: var(--navbar-accent); border-radius: 4px; transition: width .45s ease, background .2s, opacity .2s; opacity: .98 }
      .nav-link:active .link-loader { width: calc(100% - 16px); }
      /* persistent loading when navigating */
      .nav-link.is-loading .link-loader { width: calc(100% - 16px); opacity: 1; }
      .nav-link:hover .link-loader { width: calc(100% - 16px); }
      .app-header.loading::after { transform: scaleX(1); transition: transform .55s cubic-bezier(.2,.9,.2,1); }
      .app-header::after { transform: scaleX(0); height: 3px; }

      .nav-title { outline: none; box-shadow: none; }
      .nav-title .title-text { transition: color .18s; color: inherit; }
      .nav-title:focus .title-text, .nav-title:active .title-text { color: var(--navbar-accent); text-shadow: 0 8px 28px rgba(0,0,0,0.25); }

      /* DARK MODE FIXES: stronger accents and loader visibility */
      .dark .nav-link::after { background: var(--navbar-accent); }
      .dark .link-loader { background: var(--navbar-accent); }
      .dark .nav-link.is-loading .link-loader { width: calc(100% - 16px); opacity: 1; }
      .dark .nav-link:hover, .dark .nav-link.is-loading { color: var(--navbar-accent); }

      .dark .nav-hover:hover { box-shadow: 0 12px 40px rgba(59,130,246,0.18), 0 0 38px var(--navbar-accent); color: var(--navbar-accent); }
      .nav-link[aria-current="page"] { color: var(--navbar-accent); box-shadow: 0 6px 20px rgba(124,58,237,0.12); }

      /* tuning: make the top bar slightly brighter in dark */
      .dark .app-header::after { background: var(--navbar-accent); }

      /* Small ambient bar across top during a click (visual loading hint) */
      .app-header::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px; background: var(--navbar-accent); transform-origin: left; transform: scaleX(0); transition: transform .6s ease; pointer-events: none; z-index: 60; }

      /* Accent for strong button to sync with chosen accent */
      .strong-btn.nav-hover:hover { box-shadow: 0 6px 30px rgba(59,130,246,0.12), 0 0 18px var(--navbar-accent); transform: translateY(-3px) scale(1.02); }

      /* card pop subtle hue in dark mode */
      .dark .card-bg a.nav-hover:hover, .dark .card-bg .nav-hover:hover { box-shadow: 0 8px 30px rgba(14,165,233,0.08), 0 0 18px rgba(99,102,241,0.06); }

      @media (prefers-reduced-motion: reduce) { .nav-hover, .app-header::before, .nav-link::after, .link-loader { transition:none !important; transform:none !important; } }
    `}</style>
    {/* Mobile menu */}
    <div className={`md:hidden fixed inset-x-0 top-16 z-40 transition-transform ${mobileOpen ? 'translate-y-0' : '-translate-y-[110%]'} `}>
      <div className="card-bg p-4 border-b shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NavLink to="/home" onClick={()=>{ setMobileOpen(false); setNavLoading(true); setLoadingPath('/home'); }} className="flex items-center gap-2">
              <img src="/najah-hub-icon.png" alt="Najah Hub" className="h-8 w-8 rounded-md" />
              <span className="font-bold link-label">Najah Hub</span>
            </NavLink>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{ setMobileOpen(false); toggleDark(); }} className="p-2 admin-btn-outline">{dark ? 'فاتح' : 'داكن'}</button>
            <button onClick={()=>{ setMobileOpen(false); handleLogout(); }} className="admin-btn-outline">خروج</button>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <NavLink to="/home" onClick={()=>{ setMobileOpen(false); setNavLoading(true); setLoadingPath('/home'); }} className={`p-3 rounded admin-btn-outline nav-hover nav-link hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 ${loadingPath === '/home' ? 'is-loading' : ''}`}><span className="link-label">الرئيسية</span><span className="link-loader" /></NavLink>
          <NavLink to={`/profile/${userData?.id}`} onClick={()=>{ setMobileOpen(false); setNavLoading(true); setLoadingPath(`/profile/${userData?.id}`); }} className={`p-3 rounded admin-btn-outline nav-hover nav-link hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 ${loadingPath === `/profile/${userData?.id}` ? 'is-loading' : ''}`}><span className="link-label">ملفي الشخصي</span><span className="link-loader" /></NavLink>
          <NavLink to="/communities" onClick={()=>{ setMobileOpen(false); setNavLoading(true); setLoadingPath('/communities'); }} className={`p-3 rounded admin-btn-outline nav-hover nav-link hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 ${loadingPath === '/communities' ? 'is-loading' : ''}`}><span className="link-label">المجتمعات</span><span className="link-loader" /></NavLink>
          <NavLink to="/ai" onClick={()=>{ setMobileOpen(false); setNavLoading(true); setLoadingPath('/ai'); }} className={`p-3 rounded admin-btn-outline nav-hover nav-link hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 ${loadingPath === '/ai' ? 'is-loading' : ''}`}><span className="link-label">الذكاء</span><span className="link-loader" /></NavLink>
          <NavLink to="/settings" onClick={()=>{ setMobileOpen(false); setNavLoading(true); setLoadingPath('/settings'); }} className={`p-3 rounded admin-btn-outline nav-hover nav-link hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 ${loadingPath === '/settings' ? 'is-loading' : ''}`}><span className="link-label">الإعدادات</span><span className="link-loader" /></NavLink>
          <NavLink to="/subscribe" onClick={()=>{ setMobileOpen(false); setNavLoading(true); setLoadingPath('/subscribe'); }} className="p-3 rounded admin-btn">اشترك الآن</NavLink>
        </div>
      </div>
    </div>
    <AthkarBar />
    </>
  );
};

export default Navbar;