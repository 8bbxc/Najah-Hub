import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, SOCKET } from '../utils/api';
import { io } from 'socket.io-client';

// Fallback UnifiedBar (file in repo was empty) - keeps layout consistent
const UnifiedBar = ({ compact, className = '', children }) => (
  <div className={`w-full card-bg border border-gray-100 rounded-2xl ${compact ? 'p-3 text-sm' : 'p-4'} ${className}`} dir="rtl">
    {children}
  </div>
);

const AnnouncementBox = () => {
  const [ann, setAnn] = useState(null);

  const fetch = async () => {
    try {
      const res = await axios.get(`${API}/api/announcements?active=true`);
      if (res.data && res.data.length > 0) setAnn(res.data[0]);
      else setAnn(null);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    }
  };

  useEffect(() => {
    fetch();
    const socket = io(SOCKET || 'https://najah-backend-ykto.onrender.com');
    socket.on('announcementsUpdated', fetch);
    return () => socket.close();
  }, []);

  if (!ann) return null;

  return (
    <UnifiedBar compact className="mb-4 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-gray-800 dark:text-white">{ann.title}</div>
          <div className="text-xs text-gray-600 dark:text-slate-300 mt-1 leading-tight">{ann.content}</div>
        </div>
        <div className="text-[10px] text-gray-400 dark:text-slate-400">إعلان نظامي</div>
      </div>
    </UnifiedBar>
  );
};

export default AnnouncementBox;
