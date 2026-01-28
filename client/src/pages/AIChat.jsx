import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { API } from '../utils/api';

// Helper to format time
const fmtTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
};

export default function AIChat() {
  const token = localStorage.getItem('token');
  const [convs, setConvs] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);
  const messagesRef = useRef(null);

  const userObj = JSON.parse(localStorage.getItem('user') || 'null');
  const userAvatar = userObj?.avatar || '/default-avatar.png';
  const aiAvatar = '/ai-avatar.png';

  const loadConvs = async () => {
    try { const r = await axios.get(`${API}/api/ai/conversations`, { headers: { Authorization: `Bearer ${token}` } }); setConvs(r.data || []); } catch(e){ console.error(e); }
  };

  const loadMessages = async (id) => {
    try {
      const r = await axios.get(`${API}/api/ai/conversations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const mapped = (r.data || []).map(m => ({ id: m.id, role: m.role, content: m.text, attachments: m.attachments, createdAt: m.createdAt }));
      setMessages(mapped);
      setActive(id);
      // scroll to bottom after a tick
      setTimeout(()=> messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } catch(e){ console.error(e); }
  };

  useEffect(()=>{ loadConvs(); }, []);

  const send = async () => {
    if (!text.trim() && files.length === 0) return;
    try {
      const createdAt = new Date().toISOString();
      const userLocal = { id: `local-${Date.now()}`, role: 'user', content: text, attachments: files.length ? previews : [], createdAt };
      setMessages((prev) => [...prev, userLocal]);

      const historyPayload = [...messages, userLocal].map(m => ({ role: m.role, content: m.content || m.text, attachments: m.attachments || null, createdAt: m.createdAt }));

      let r;
      if (files && files.length) {
        const fd = new FormData();
        fd.append('text', text);
        fd.append('history', JSON.stringify(historyPayload));
        for (const f of files) fd.append('files', f);
        if (active) fd.append('conversationId', active);
        r = await axios.post(`${API}/api/ai/chat`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      } else {
        r = await axios.post(`${API}/api/ai/chat`, { text, history: historyPayload, conversationId: active }, { headers: { Authorization: `Bearer ${token}` } });
      }

      setText(''); setFiles([]); setPreviews([]);
      await loadConvs();

      if (r.data) {
        const assistant = r.data.assistantMessage ? { id: r.data.assistantMessage.id, role: 'assistant', content: r.data.assistantMessage.text, attachments: r.data.assistantMessage.attachments, createdAt: r.data.assistantMessage.createdAt } : { id: `local-assistant-${Date.now()}`, role: 'assistant', content: r.data.answer || '...', createdAt: new Date().toISOString() };
        setMessages((prev) => [...prev, assistant]);
        if (r.data.conversationId) setActive(r.data.conversationId);
      }
      // scroll to bottom
      setTimeout(()=> messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } catch (e) { console.error(e); alert('فشل الاتصال بالذكاء الاصطناعي'); }
  };

  return (
    <div className="min-h-screen app-bg font-sans">
      <Navbar user={JSON.parse(localStorage.getItem('user'))} />
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 card-bg p-4 rounded-lg border aichat-list">
          <h3 className="font-bold mb-3">أرشيف المحادثات</h3>
          <div className="flex flex-col gap-2">
            {convs.length ? convs.map(c=> (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <button onClick={()=>loadMessages(c.id)} className={`conv-btn ${active===c.id ? 'active' : ''}`}>{c.title || new Date(c.createdAt).toLocaleString()}</button>
                <button onClick={async ()=>{ if (!confirm('حذف هذا الأرشيف؟')) return; try{ await axios.delete(`${API}/api/ai/conversations/${c.id}`, { headers: { Authorization: `Bearer ${token}` } }); await loadConvs(); if (active===c.id) { setActive(null); setMessages([]); } } catch(e){ alert('فشل الحذف'); console.error(e); } }} className="p-2 rounded text-red-500 hover:bg-red-50">حذف</button>
              </div>
            )) : <div className="text-sm text-gray-400">لا توجد محادثات بعد</div>}
          </div>
        </div>

        <div className="md:col-span-3 card-bg p-4 rounded-lg border flex flex-col">
          <div ref={messagesRef} className="flex-1 overflow-y-auto mb-4 p-3 space-y-3 bg-chat-bg flex-chat-center" style={{ maxHeight: '60vh' }}>
            {messages.map(m => (
              <div key={m.id} className={`w-full flex items-end ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex items-end gap-3 w-full max-w-3xl px-2 ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>

                  {m.role === 'assistant' && (
                    <img src={aiAvatar} alt="ai" className="w-8 h-8 rounded-full mr-2 msg-avatar" />
                  )}

                  <div className={`break-words p-3 rounded-lg shadow-sm aichat-msg ${m.role === 'assistant' ? 'assistant rounded-bl-none self-start' : 'user rounded-br-none self-end'}`}>
                    <div className="text-sm aichat-text" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.attachments.map((a,i)=> <img key={i} src={a} className="w-full h-36 object-cover rounded" />)}
                      </div>
                    )}
                    <div className="text-xs aichat-time mt-1 text-right">{fmtTime(m.createdAt)}</div>
                  </div>

                  {m.role === 'user' && (
                    <img src={userAvatar} alt="you" className="w-8 h-8 rounded-full ml-2 msg-avatar" />
                  )}

                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 border-t bg-white dark:bg-gray-800">
            <button onClick={()=>fileRef.current?.click()} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828V7h-2.828z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l6-6" opacity="0" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>{
              const f = Array.from(e.target.files || []);
              setFiles(f);
              const prev = f.map(file => URL.createObjectURL(file));
              setPreviews(prev);
            }} />

            <div className="flex-1">
              {previews.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {previews.map((p,i)=>(<img key={i} src={p} className="w-20 h-16 object-cover rounded" />))}
                </div>
              )}
              <input value={text} onChange={e=>setText(e.target.value)} className="w-full p-3 rounded-full border bg-white dark:bg-gray-900 dark:text-white placeholder-gray-400 aichat-input" placeholder="اسأل الذكاء الاصطناعي..." />
            </div>
            <button onClick={send} className="px-4 py-2 bg-najah-primary text-white rounded">إرسال</button>
          </div>
        </div>
      </div>
    </div>
  );
}
