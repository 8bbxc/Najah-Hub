import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Star, Edit2, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function StarsDisplay({ value, size = 18 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        size={size}
        fill={i <= value ? 'currentColor' : 'none'}
        className={`${i <= value ? 'text-yellow-400 dark:text-yellow-400' : 'text-gray-300 dark:text-gray-600'} transition-colors duration-150 hover:text-blue-800 dark:hover:text-blue-800 cursor-pointer`} />
    );
  }
  return <div className="flex gap-1">{stars}</div>;
}

function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1 items-center" role="radiogroup" aria-label="site-rating">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-checked={i === value} role="radio" className="group p-1 focus:outline-none focus:ring-2 focus:ring-blue-800/25 rounded-full cursor-pointer" title={`${i} نجوم`}>
          {/* Icon: no square background, star itself changes color; hover makes it dark blue */}
          <Star size={24} fill={i <= value ? 'currentColor' : 'none'} className={`${i <= value ? 'text-yellow-400 dark:text-yellow-400' : 'text-gray-300 dark:text-gray-600'} transition-colors duration-150 hover:text-blue-800 dark:hover:text-blue-800`} />
        </button>
      ))}
    </div>
  );
}

export default function RatingPage(){
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState({ counts: {}, total: 0, avg: 0 });
  const [loading, setLoading] = useState(true);
  const [my, setMy] = useState(null);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        axios.get(`${API}/api/ratings`),
        axios.get(`${API}/api/ratings/summary`)
      ]);
      setRatings(listRes.data || []);
      setSummary(sumRes.data || { counts: {}, total: 0, avg: 0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  };


  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [listRes, sumRes] = await Promise.all([
          axios.get(`${API}/api/ratings`),
          axios.get(`${API}/api/ratings/summary`)
        ]);
        if (!cancelled) {
          setRatings(listRes.data || []);
          setSummary(sumRes.data || { counts: {}, total: 0, avg: 0 });
        }

        if (token) {
          try {
            const r = await axios.get(`${API}/api/ratings/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (!cancelled) {
              setMy(r.data);
              setForm({ rating: r.data.rating, comment: r.data.comment || '' });
            }
          } catch {
            if (!cancelled) setMy(null);
          }
        }
      } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  const submit = async () => {
    if (!token) return alert('يجب أن تكون مسجلاً لتقييم الموقع');
    try {
      if (my) {
        const res = await axios.put(`${API}/api/ratings/${my.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
        setMy(res.data.rating);
      } else {
        const res = await axios.post(`${API}/api/ratings`, form, { headers: { Authorization: `Bearer ${token}` } });
        setMy(res.data.rating);
      }
      await fetchAll();
      alert('تم حفظ التقييم. شكراً لمساهمتك!');
    } catch (e) {
      console.error(e); alert(e.response?.data?.message || 'فشل حفظ التقييم');
    }
  };

  const remove = async (id) => {
    if (!token) return alert('يجب أن تكون مسجلاً');
    if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    try {
      await axios.delete(`${API}/api/ratings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (my && my.id === id) setMy(null);
      await fetchAll();
    } catch (e) { console.error(e); alert('فشل حذف التقييم'); }
  };

  return (
    <>
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto p-4 mt-6">
        <div className="card-bg border rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-2xl mb-2">تقييم الموقع</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">ساعدنا بتحسين الموقع عبر ترك تقييم (١-٥ نجوم) وتعليق إن رغبت.</p>

          <div className="flex gap-6 items-center mb-4">
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md text-center w-40">
              <div className="text-3xl font-bold">{Math.round(summary.avg || 0)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">معدل من {summary.total || 0} تقييم</div>
              <div className="mt-2"><StarsDisplay value={Math.round(summary.avg || 0)} size={18} /></div>
            </div>

            <div className="flex-1">
              {loading ? <div className="text-sm text-gray-500">جارِ التحميل...</div> : (
                <div className="grid grid-cols-5 gap-2 text-sm">
                  {[5,4,3,2,1].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-6 text-xs">{s} نجوم</div>
                      <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div style={{ width: `${((summary.counts && summary.counts[s]) || 0) / (summary.total || 1) * 100}%` }} className="h-3 bg-yellow-400 dark:bg-yellow-500"></div>
                      </div>
                      <div className="w-8 text-xs text-right">{(summary.counts && summary.counts[s]) || 0}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">أضف تقييمك</h3>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <StarInput value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
                <textarea className="w-full mt-2 p-3 border rounded-lg resize-none bg-transparent" rows={3} placeholder="تعليق اختياري" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
                <div className="flex gap-2 mt-2">
                  <button onClick={submit} className="bg-najah-primary text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-800">{my ? 'تحديث التقييم' : 'إرسال التقييم'}</button>
                  {my && <button onClick={() => remove(my.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">حذف تقييمي</button>}
                </div>"
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {ratings.length === 0 ? <div className="text-center text-gray-500">لا توجد تقييمات بعد</div> : ratings.map(r => (
              <div key={r.id} className="card-bg border rounded-lg p-4 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold overflow-hidden">
                  {r.user?.avatar ? <img src={`${API.replace(/http:\/\/localhost:5000/, '')}${r.user.avatar}`} alt="avatar" className="w-full h-full object-cover"/> : (r.user?.name ? r.user.name.charAt(0) : '؟')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-bold">{r.user?.name || 'مجهول'}</div>
                      <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarsDisplay value={r.rating} />
                      {(user && (user.id === r.user?.id || String(user.universityId).trim() === '0000')) && (
                        <div className="flex gap-2">
                          {user.id === r.user?.id && <button onClick={() => { setForm({ rating: r.rating, comment: r.comment || '' }); setMy(r); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><Edit2 size={16} /></button>}
                          <button onClick={() => remove(r.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}