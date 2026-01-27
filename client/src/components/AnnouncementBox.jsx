import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, SOCKET } from '../utils/api';
import { io } from 'socket.io-client';

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
    const socket = io(SOCKET || 'http://localhost:5001');
    socket.on('announcementsUpdated', fetch);
    return () => socket.close();
  }, []);

  if (!ann) return null;

  return (
    <div className="announcement-box card-bg rounded-xl border border-gray-100 shadow-sm p-3 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-gray-800">{ann.title}</div>
          <div className="text-xs text-gray-600 mt-1 leading-tight">{ann.content}</div>
        </div>
        <div className="text-[10px] text-gray-400">إعلان نظامي</div>
      </div>
    </div>
  );
};

export default AnnouncementBox;
