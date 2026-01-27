import { Link, useNavigate } from 'react-router-dom';
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
  const [dark, setDark] = useState(() => !!document.documentElement.classList.contains('dark') || !!localStorage.getItem('dark'));
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // theme init
  useEffect(() => {
    const stored = localStorage.getItem('dark');
    if (stored === '1') document.documentElement.classList.add('dark');
    if (stored === '0') document.documentElement.classList.remove('dark');
  }, []);

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('dark', isDark ? '1' : '0');
    setDark(isDark);
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
    <nav className="sticky top-0 z-50 app-header border-b">
      <div className="max-w-7xl mx-auto px-4 font-sans">
        <div className="flex justify-between items-center h-16">
          
          {/* الشعار */}
          <Link to="/home" className="flex items-center gap-2">
            <img src="/najah-hub-icon.png" alt="Najah Hub" className="h-10 w-10 rounded-md shadow-sm" />
            <span className="text-2xl font-bold text-gray-800 hidden md:block">Najah Hub</span>
          </Link>

          {/* زر الهامبرغر للهواتف */}
          <button onClick={() => setMobileOpen(s => !s)} className="md:hidden p-2 text-gray-600 mr-2" aria-label="menu-toggle">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* روابط التنقل */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/home" className="flex items-center gap-2 text-gray-600 hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white">
              <Home size={20} className="nav-icon" /> <span>الرئيسية</span>
            </Link>
            
            <Link to={`/profile/${userData?.id}`} className="flex items-center gap-2 text-gray-800 hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white">
              <User size={20} /> <span>ملفي الشخصي</span>
            </Link>

            <Link to="/communities" className="flex items-center gap-2 text-gray-800 hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white">
              <Menu size={20} /> <span>المجتمعات</span>
            </Link>

            <Link to="/ai" className="flex items-center gap-2 text-gray-800 hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white">
              <Cpu size={18} /> <span>الذكاء</span>
            </Link>

            <Link to="/settings" className="flex items-center gap-2 text-gray-800 hover:text-najah-primary transition font-medium px-2 py-1 rounded hover:bg-blue-900 hover:bg-opacity-40 dark:hover:bg-blue-700 dark:hover:bg-opacity-40 dark:hover:text-white">
              <SettingsIcon size={20} /> <span>الإعدادات</span>
            </Link>
          </div>

            <div className="flex items-center gap-2 md:gap-4">
            {/* جرس الإشعارات */}
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className={`p-2 rounded-full transition relative ${showNotifMenu ? 'bg-gray-100 text-najah-primary' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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
            <Link to={`/profile/${userData?.id}`} className="w-10 h-10 rounded-full border-2 border-gray-100 overflow-hidden hover:border-najah-primary transition bg-gray-100 flex items-center justify-center shadow-inner group">
              {userData?.avatar ? (
                <img src={userData.avatar} alt="avatar" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
              ) : (
                <div className="text-gray-400">
                  <UserCircle size={28} />
                </div>
              )}
            </Link>
            
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition" title="تسجيل الخروج">
              <LogOut size={20} />
            </button>
            <button onClick={toggleDark} className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition" title="تبديل الثيم">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Small persistent subscribe CTA visible on larger screens */}
            <Link to="/subscribe" className="hidden md:inline-flex items-center strong-btn ml-2">اشترك الآن</Link>
          </div>
        </div>
      </div>
    </nav>
    {/* Mobile menu */}
    <div className={`md:hidden fixed inset-x-0 top-16 z-40 transition-transform ${mobileOpen ? 'translate-y-0' : '-translate-y-[110%]'} `}>
      <div className="card-bg p-4 border-b shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home" onClick={()=>setMobileOpen(false)} className="flex items-center gap-2">
              <img src="/najah-hub-icon.png" alt="Najah Hub" className="h-8 w-8 rounded-md" />
              <span className="font-bold">Najah Hub</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{ setMobileOpen(false); toggleDark(); }} className="p-2 admin-btn-outline">{dark ? 'فاتح' : 'داكن'}</button>
            <button onClick={()=>{ setMobileOpen(false); handleLogout(); }} className="admin-btn-outline">خروج</button>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <Link to="/home" onClick={()=>setMobileOpen(false)} className="p-3 rounded admin-btn-outline hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40">الرئيسية</Link>
          <Link to={`/profile/${userData?.id}`} onClick={()=>setMobileOpen(false)} className="p-3 rounded admin-btn-outline hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40">ملفي الشخصي</Link>
          <Link to="/communities" onClick={()=>setMobileOpen(false)} className="p-3 rounded admin-btn-outline hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40">المجتمعات</Link>
          <Link to="/ai" onClick={()=>setMobileOpen(false)} className="p-3 rounded admin-btn-outline hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40">الذكاء</Link>
          <Link to="/settings" onClick={()=>setMobileOpen(false)} className="p-3 rounded admin-btn-outline hover:bg-blue-900 hover:bg-opacity-30 dark:hover:bg-blue-700 dark:hover:bg-opacity-40">الإعدادات</Link>
          <Link to="/subscribe" onClick={()=>setMobileOpen(false)} className="p-3 rounded admin-btn">اشترك الآن</Link>
        </div>
      </div>
    </div>
    <AthkarBar />
    </>
  );
};

export default Navbar;