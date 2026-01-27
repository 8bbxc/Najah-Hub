import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CommunityCard from '../components/CommunityCard';
import { Plus, Loader } from 'lucide-react';

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', privacy: 'public' });
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/communities`, config);
      // API now returns membersCount, isMember, memberRole per community
      setCommunities(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return alert('اكتب اسم المجتمع');
    try {
      // if regular student creates, keep it private by default and mark as member
      const currentUser = JSON.parse(localStorage.getItem('user')) || {};
      const isAdmin = String(currentUser?.universityId).trim() === '0000' || ['doctor','admin'].includes((currentUser?.role||'').toString().toLowerCase());
      const payload = { ...form, privacy: isAdmin ? form.privacy : 'private' };
      const res = await axios.post(`${API}/api/communities`, payload, config);
      setCommunities(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', privacy: 'public' });
    } catch (err) { console.error(err); alert('فشل إنشاء المجتمع'); }
  };

  const handleJoin = async (id, idx) => {
    try { await axios.post(`${API}/api/communities/${id}/join`, {}, config); alert('انضممت!'); } catch (err) { console.error(err); alert('فشل الانضمام'); }
  };

  const handleLeave = async (id) => {
    try { await axios.post(`${API}/api/communities/${id}/leave`, {}, config); alert('تم الخروج'); } catch (err) { console.error(err); alert('فشل الخروج'); }
  };

  return (
    <div className="min-h-screen app-bg font-sans">
      <Navbar user={JSON.parse(localStorage.getItem('user'))} />
      <div className="max-w-7xl mx-auto p-4 md:p-6 flex gap-8 lg:pr-[280px]">
        <Sidebar />

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold">المجتمعات</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowCreate(!showCreate)} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-2xl font-bold shadow-lg flex items-center gap-2"><Plus/> انشاء مجتمع</button>
            </div>
          </div>

          {showCreate && (
            <div className="card-bg rounded-2xl p-4 shadow-md mb-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="اسم المجتمع" className="p-3 border rounded-lg" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                <select className="p-3 border rounded-lg" value={form.privacy} onChange={e=>setForm({...form,privacy:e.target.value})}>
                  <option value="public">عام</option>
                  <option value="private">خاص</option>
                </select>
                <button onClick={handleCreate} className="bg-najah-primary text-white px-4 py-2 rounded-lg font-bold">انشاء</button>
              </div>
              <textarea placeholder="وصف المجتمع" className="mt-3 p-3 border rounded-lg w-full bg-gray-50" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}></textarea>
            </div>
          )}

          {loading ? (
            <div className="text-center py-24"><Loader className="animate-spin mx-auto" size={36} /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities
                .filter(c => {
                  // Students only see communities they are members of. Admins see all.
                  const isAdmin = String(currentUser?.universityId).trim() === '0000' || ['doctor','admin'].includes((currentUser?.role||'').toString().toLowerCase());
                  if (isAdmin) return true;
                  return !!c.isMember;
                })
                .map((c) => (
                  <CommunityCard key={c.id} community={c} membersCount={c.membersCount} isMember={c.isMember} memberRole={c.memberRole} onJoin={() => handleJoin(c.id)} onLeave={() => handleLeave(c.id)} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communities;
