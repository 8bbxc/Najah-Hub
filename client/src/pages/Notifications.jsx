import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const fetchNotifications = async (pageIdx = 0) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/notifications?limit=30&offset=${pageIdx * 30}`, config);
      if (pageIdx === 0) setNotifications(res.data);
      else setNotifications(prev => [...prev, ...res.data]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(0); }, []);

  const deleteNotification = async (id) => {
    if (!confirm('هل تريد حذف هذا الإشعار؟')) return;
    try {
      await axios.delete(`${API}/api/notifications/${id}`, config);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) { alert(err.response?.data?.message || 'فشل حذف الإشعار'); }
  };

  const clearAll = async () => {
    if (!confirm('هل تريد مسح كل الإشعارات؟')) return;
    try {
      await axios.delete(`${API}/api/notifications`, config);
      setNotifications([]);
    } catch (err) { alert(err.response?.data?.message || 'فشل مسح الإشعارات'); }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">الإشعارات</h1>
          <div className="flex items-center gap-2">
            <button onClick={clearAll} className="px-3 py-1 rounded bg-red-50 text-red-600">مسح الكل</button>
            <button onClick={() => navigate(-1)} className="px-3 py-1 rounded bg-gray-100">رجوع</button>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 && <div className="text-gray-400">لا توجد إشعارات</div>}
          {notifications.map(n => (
            <div key={n.id} className="p-3 border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {n.Sender?.avatar ? <img src={n.Sender.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-najah-primary text-white">{n.Sender?.name?.[0] || 'U'}</div>}
                </div>
                <div>
                  <div className="text-sm font-bold">{n.Sender?.name || 'مستخدم'}</div>
                  <div className="text-xs text-gray-500">{n.type === 'like' ? 'أعجب بمنشورك' : 'علّق على منشورك'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => deleteNotification(n.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><X size={16}/></button>
                <button onClick={() => navigate(`/profile/${n.Sender?.id || n.senderId}`)} className="px-3 py-1 rounded bg-gray-100">عرض</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => { setPage(p => p + 1); fetchNotifications(page + 1); }} className="px-4 py-2 rounded bg-najah-primary text-white">عرض المزيد</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
