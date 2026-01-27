import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function PrivateChat({ otherUserId }) {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(()=>{
    const setup = async ()=>{
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API}/api/private`, { otherUserId }, { headers: { Authorization: `Bearer ${token}` } });
        setChat(res.data.chat);
        const msgs = await axios.get(`${API}/api/private/${res.data.chat.id}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(msgs.data || []);

        socketRef.current = io(API);
        socketRef.current.emit('registerUser', { userId: currentUser?.id });
        socketRef.current.on('privateMessage', (m)=>{
          if (m.chatId === res.data.chat.id) setMessages(prev => [...prev, m]);
        });
      } catch (e) { console.error('PrivateChat init error', e); }
    };
    setup();
    return ()=>{ socketRef.current?.disconnect(); };
  }, [otherUserId]);

  const send = ()=>{
    if (!text.trim()) return;
    const payload = { chatId: chat.id, senderId: currentUser.id, receiverId: otherUserId, text, clientTempId: `temp-${Date.now()}` };
    setMessages(prev=>[...prev, { ...payload, createdAt: new Date().toISOString() }]);
    socketRef.current.emit('privateMessage', payload);
    setText('');
  };

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    const token = localStorage.getItem('token');
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    try {
      const res = await axios.post(`${API}/api/private/${chat.id}/upload`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      const attachments = res.data.attachments || [];
      const payload = { chatId: chat.id, senderId: currentUser.id, receiverId: otherUserId, text: '', attachments, clientTempId: `temp-${Date.now()}` };
      setMessages(prev=>[...prev, { ...payload, createdAt: new Date().toISOString() }]);
      socketRef.current.emit('privateMessage', payload);
    } catch (e) { console.error('Upload failed', e); alert('فشل رفع الملفات'); }
  };

  return (
    <div className="p-4 card-bg rounded-lg h-full flex flex-col">
      <div className="flex-1 overflow-auto mb-4">
        {messages.map(m=> (
          <div key={m.clientTempId || m.id} className={`mb-2 ${m.senderId===currentUser?.id ? 'text-right' : 'text-left'}`}>
            <div className="inline-block p-2 rounded-md bg-gray-100 dark:bg-[#072024]">{m.text}</div>
            <div className="text-xs muted">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 p-2 rounded border" placeholder="اكتب رسالة..." />
        <input type="file" multiple accept="image/*,video/*" onChange={e=>uploadFiles(e.target.files)} className="hidden" id="pc-upload" />
        <label htmlFor="pc-upload" className="px-3 py-2 bg-gray-100 rounded cursor-pointer">📎</label>
        <button onClick={send} className="px-4 py-2 bg-najah-primary text-white rounded">إرسال</button>
      </div>
    </div>
  );
}
