import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { API } from '../utils/api';

const AdminAudits = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/audits?limit=100`, config);
      setAudits(res.data.audits || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar user={JSON.parse(localStorage.getItem('user'))} />
      <div className="max-w-7xl mx-auto p-4 md:p-6 flex gap-8 lg:pr-[280px]">
        <div className="flex-1" dir="rtl">
          <h1 className="text-2xl font-black mb-4">سجل التدقيق (Audit)</h1>
          <div className="card-bg rounded-2xl p-4 border">
            {loading ? <div>جارٍ التحميل...</div> : (
              <div className="space-y-3">
                {audits.length === 0 && <div className="text-gray-400">لا يوجد سجلات.</div>}
                {audits.map(a => (
                  <div key={a.id} className="p-3 border rounded bg-white">
                    <div className="text-xs text-gray-500 mb-1">{new Date(a.createdAt).toLocaleString()}</div>
                    <div className="font-bold text-sm">{a.action}</div>
                    <div className="text-sm text-gray-700">actor: {a.actorId} ({a.actorUniversityId}) — target: {a.targetType}#{a.targetId}</div>
                    <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">{JSON.stringify(a.meta || {}, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAudits;
