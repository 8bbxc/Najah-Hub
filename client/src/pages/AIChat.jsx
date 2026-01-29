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
        <div className="md:col-span-1 card-bg p-4 rounded-lg border aichat-list sidebar md:order-1 theme-transition">
          <h3 className="font-bold mb-3 text-slate-800 dark:text-white">أرشيف المحادثات</h3>
          <div className="flex flex-col gap-2">
            {convs.length ? convs.map(c=> (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <button onClick={()=>loadMessages(c.id)} className={`w-full text-left px-3 py-2 rounded-lg transition ${active===c.id ? 'bg-blue-100 dark:bg-[#303030] text-blue-600 dark:text-blue-400' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5'}`}>{c.title || new Date(c.createdAt).toLocaleString()}</button>
                <button onClick={async ()=>{ if (!confirm('حذف هذا الأرشيف؟')) return; try{ await axios.delete(`${API}/api/ai/conversations/${c.id}`, { headers: { Authorization: `Bearer ${token}` } }); await loadConvs(); if (active===c.id) { setActive(null); setMessages([]); } } catch(e){ alert('فشل الحذف'); console.error(e); } }} className="p-2 rounded text-red-500 hover:bg-red-50">حذف</button>
              </div>
            )) : <div className="text-sm text-slate-600 dark:text-slate-300">لا توجد محادثات بعد</div>}
          </div>
        </div>

        <div className="md:col-span-3 card-bg p-4 rounded-lg border flex flex-col chat-panel md:order-2 theme-transition">
          <div ref={messagesRef} className="flex-1 overflow-y-auto mb-6 p-6 space-y-4 bg-chat-bg" style={{ maxHeight: '60vh' }}>
            {messages.map(m => (
              <div key={m.id} className={`flex items-end animate-in slide-in-from-bottom-2 fade-in duration-300 ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                {m.role === 'assistant' && (
                  <img src={aiAvatar} alt="ai" className="w-8 h-8 rounded-full mr-2 msg-avatar" />
                )} 

                <div className={`max-w-[70%] break-words p-4 rounded-lg shadow-sm aichat-msg ${m.role === 'assistant' ? 'assistant rounded-bl-none bg-white/70 border border-gray-200 text-slate-900 backdrop-blur-md dark:bg-white/5 dark:border-white/10 dark:text-slate-200' : 'user rounded-br-none bg-blue-600 text-white dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-600 dark:text-black dark:shadow-[0_12px_40px_rgba(0,229,255,0.12)] dark:border dark:border-cyan-400/30'}`}>
                  <div className="text-sm aichat-text" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.attachments.map((a,i)=> <img key={i} src={a} className="w-full h-36 object-cover rounded" />)}
                    </div>
                  )}

                  {/* Decorative copy button (shows when pre/code exists) - visual only */}
                  {/* The actual copy functionality can be wired later without layout changes */}
                  
                  <div className="text-xs aichat-time mt-1 text-right">{fmtTime(m.createdAt)}</div>
                </div>

                {m.role === 'user' && (
                  <img src={userAvatar} alt="you" className="w-8 h-8 rounded-full ml-2 msg-avatar" />
                )}
              </div>
            ))}


          </div>

          {/* Floating input capsule: positioned bottom-center */}
          <div className="relative">
            <button onClick={()=>fileRef.current?.click()} className="sr-only" aria-hidden>Attach</button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>{
              const f = Array.from(e.target.files || []);
              setFiles(f);
              const prev = f.map(file => URL.createObjectURL(file));
              setPreviews(prev);
            }} />

            {/* previews (kept in flow above floating input) */}
            <div className="w-full">
              {previews.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {previews.map((p,i)=>(<img key={i} src={p} className="w-20 h-16 object-cover rounded" />))}
                </div>
              )}
            </div>

            {/* Floating capsule */}
            <div className="fixed left-1/2 transform -translate-x-1/2 bottom-6 w-full max-w-3xl px-4 z-50">
              <div className="flex items-center gap-3 p-3 rounded-full backdrop-blur-md theme-transition bg-white/70 dark:bg-slate-900/50 border border-gray-200 dark:border-cyan-500/30 shadow-md dark:shadow-[0_8px_40px_rgba(0,229,255,0.08)]">
                <button onClick={()=>fileRef.current?.click()} className="p-2 rounded-full text-slate-600 dark:text-cyan-200 hover:bg-slate-100/50 dark:hover:bg-white/5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828V7h-2.828z" />
                  </svg>
                </button>

                <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 p-3 rounded-full aichat-input ai-input-override focus:outline-none" placeholder="اسأل الذكاء الاصطناعي..." />

                <button onClick={send} className="ml-2 px-4 py-2 rounded-full bg-blue-600 text-white dark:bg-cyan-500 dark:text-black shadow-lg transition-all hover:scale-105">إرسال</button>
              </div>
            </div>

            {/* spacer to ensure bottom content isn't overlapped by floating input on small screens */}
            <div className="h-24 md:h-20" />
          </div> 
        </div>
      </div>
    </div>
  );
}
