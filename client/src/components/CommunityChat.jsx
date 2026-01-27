import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../utils/api';
import { io } from 'socket.io-client';
import CommunityMembers from './CommunityMembers';

const CommunityChat = ({ communityId, currentUser }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [earliest, setEarliest] = useState(null);
  const [communityCreatorId, setCommunityCreatorId] = useState(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const GENERIC_AVATAR = '/images/default-avatar.png';

  useEffect(() => {
    let mounted = true;
    // Setup socket for community room + listeners
    const socket = io(API);
    const userId = currentUser?.id;
    socketRef.current = socket;

    socket.emit('registerUser', { userId });
    socket.emit('joinRoom', { communityId, userId });

    socket.on('communityMessage', (m) => {
      if (!mounted) return;
      // ignore messages for other communities
      if (String(m.communityId) !== String(communityId)) return;
      setMessages(prev => {
        // if server message contains clientTempId, replace optimistic entry if present, otherwise append
        if (m.clientTempId) {
          const idx = prev.findIndex(p => String(p.id) === String(m.clientTempId));
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = m;
            return copy;
          }
          return [...prev, m];
        }
        // avoid duplicating exact id
        if (prev.some(p => String(p.id) === String(m.id))) return prev;
        return [...prev, m];
      });
      setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    });

    socket.on('messageDeleted', (data) => {
      if (!mounted) return;
      setMessages(prev => prev.filter(mm => String(mm.id) !== String(data.id)));
    });

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/api/communities/${communityId}/messages?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        setMessages(res.data || []);
        setEarliest(res.data?.[0]?.createdAt || null);
        setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
      } catch (err) {
        console.error('Failed to fetch messages', err);
        if (!mounted) return;
        setMessages([]);
      }
    };

    const fetchCommunityMeta = async () => {
      try {
        const token = localStorage.getItem('token');
        const r = await axios.get(`${API}/api/communities/${communityId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        setCommunityCreatorId(r.data?.community?.creatorId || null);
      } catch (err) {
        // ignore
      }
    };

    fetchMessages();
    fetchCommunityMeta();

    return () => {
      mounted = false;
      try { socket.emit('leaveRoom', { communityId, userId }); } catch (e) {}
      socket.disconnect();
    };
  }, [communityId, currentUser?.id]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const payload = { communityId, userId: currentUser?.id, text: text.trim(), name: currentUser?.name || '', clientTempId: `temp-${Date.now()}` };
      // optimistic update
      setMessages(prev => [...prev, { id: payload.clientTempId, communityId, userId: payload.userId, text: payload.text, name: payload.name, createdAt: new Date().toISOString(), clientTempId: payload.clientTempId }]);
      socketRef.current?.emit('sendMessage', payload);
      setText('');
      setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    } catch (err) {
      console.error('Send failed', err);
      alert('فشل إرسال الرسالة');
    }
  };

  const loadEarlier = async () => {
    if (!earliest) return;
    setLoadingEarlier(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/communities/${communityId}/messages?limit=50&before=${encodeURIComponent(earliest)}`, { headers: { Authorization: `Bearer ${token}` } });
      const older = res.data || [];
      if (older.length) setMessages(prev => [...older, ...prev]);
    } catch (err) {
      console.error('Failed to load earlier messages', err);
    } finally { setLoadingEarlier(false); }
  };

  const handleDelete = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/communities/${communityId}/messages/${messageId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => prev.filter(m => String(m.id || m._id) !== String(messageId)));
    } catch (err) {
      console.error('Failed to delete message', err);
      alert(err?.response?.data?.message || 'فشل حذف الرسالة');
    }
  };

  const canDelete = (message) => {
    if (!currentUser) return false;
    if (String(currentUser.id) === String(message.senderId) || String(currentUser.id) === String(message.userId)) return true;
    const role = (currentUser.role || '').toString().toLowerCase();
    if (role === 'admin' || role === 'owner') return true;
    // System owner override: universityId '0000' can delete any message
    if (String(currentUser.universityId) === '0000') return true;
    return false;
  };

  const isOwner = (sender) => {
    if (!sender) return false;
    return String(sender.id) === '#0000' || ((sender.role || '').toString().toLowerCase() === 'owner');
  };

  return (
    <>
      <div className="bg-white dark:bg-[#0a0e13] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm community-chat-area">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">المحادثة</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMembersDrawer(true)} className="md:hidden text-sm btn-secondary px-2 py-1 rounded">قائمة الأعضاء</button>
          </div>
        </div>

        <div className="my-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="font-bold">Najah Hub</div>
            <div className="text-sm text-gray-500">محادثة المجتمع</div>
          </div>
        </div>

        <div ref={containerRef} className="h-[60vh] overflow-y-auto mb-2 rounded flex flex-col bg-transparent">
          <div className="messages-container space-y-2 p-3">
            <div className="flex justify-center mb-2">
              <button onClick={loadEarlier} disabled={loadingEarlier} className="text-xs text-gray-400 hover:underline">{loadingEarlier ? 'جارٍ التحميل...' : 'تحميل رسائل أقدم'}</button>
            </div>

            {messages.map((m) => {
              const msgId = m.id || m._id;
              const sender = m.sender || { id: m.userId, profilePic: m.avatar, name: m.name };
              const mine = String(sender?.id) === String(currentUser?.id) || String(m.senderId) === String(currentUser?.id) || String(m.userId) === String(currentUser?.id);
              const bubbleClass = mine ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white';
              return (
                <div key={msgId} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && (
                    <img
                      src={(sender && !sender.hideAvatar) ? (sender.profilePic || sender.avatar || GENERIC_AVATAR) : GENERIC_AVATAR}
                      alt={sender?.name || 'avatar'}
                      className="w-10 h-10 rounded-full mr-2 cursor-pointer"
                      onClick={() => navigate(`/profile/${sender?.id || sender?.userId}`)}
                      onError={(e) => { e.currentTarget.src = GENERIC_AVATAR; }}
                    />
                  )}

                  <div className={`max-w-[72%] p-3 rounded-lg text-sm ${bubbleClass}`} style={{ backgroundClip: 'padding-box' }}>
                    <div className="flex items-center mb-1">
                      <span className={`${isOwner(sender) ? 'text-yellow-400 font-semibold' : 'font-semibold'}`}>{sender?.name || 'Unknown'}</span>
                      {isOwner(sender) && <span className="ml-2">👑</span>}
                    </div>
                    <div style={{ backgroundColor: 'transparent' }} className="whitespace-pre-wrap break-words">{m.text}</div>
                    <div className="text-xs text-gray-300 mt-1 flex justify-between items-center">
                      <span>{new Date(m.createdAt || m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {canDelete(m) && <button onClick={() => handleDelete(msgId)} className="text-xs text-red-300 ml-2">Delete</button>}
                    </div>
                  </div>

                  {mine && (
                    <img
                      src={(sender && !sender.hideAvatar) ? (sender.profilePic || sender.avatar || GENERIC_AVATAR) : GENERIC_AVATAR}
                      alt={sender?.name || 'avatar'}
                      className="w-10 h-10 rounded-full ml-2 cursor-pointer"
                      onClick={() => navigate(`/profile/${sender?.id || sender?.userId}`)}
                      onError={(e) => { e.currentTarget.src = GENERIC_AVATAR; }}
                    />
                  )}
                </div>
              );
            })}

            <div ref={listRef}></div>
          </div>
        </div>

        <div className="flex gap-2 items-center input-row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 p-2 rounded-full bg-white dark:bg-[#111827] text-black dark:text-white placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none"
          />

          <button onClick={sendMessage} className="strong-btn">إرسال</button>
        </div>
      </div>

      {/* Mobile slide-over for members list */}
      {showMembersDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMembersDrawer(false)} />
          <div className="ml-auto w-full max-w-xs h-full p-4">
            <div className="card-bg rounded-lg h-full p-3 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold">أعضاء المجتمع</h4>
                <button onClick={() => setShowMembersDrawer(false)} className="btn-secondary px-2 py-1 rounded">إغلاق</button>
              </div>
              <CommunityMembers communityId={communityId} currentUser={currentUser} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommunityChat;
