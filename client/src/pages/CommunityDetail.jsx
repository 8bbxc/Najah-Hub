import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CommunityChat from '../components/CommunityChat';
import CommunityMembers from '../components/CommunityMembers';

const CommunityDetail = () => {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memberRole, setMemberRole] = useState(null);
  const fileRef = useRef();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetch(); }, [id]);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/communities/${id}`, config);
      setCommunity(res.data.community);
      setIsMember(res.data.isMember);
      setMemberRole(res.data.memberRole || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const join = async () => {
    try { await axios.post(`${API}/api/communities/${id}/join`, {}, config); alert('انضممت'); fetch(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const leave = async () => {
    if (!confirm('تأكيد المغادرة؟ هذا سيحذفك من قائمة الأعضاء.')) return;
    try { await axios.post(`${API}/api/communities/${id}/leave`, {}, config); alert('خرجت'); fetch(); } catch (err) { alert(err.response?.data?.message || 'فشل الخروج'); }
  };

  const uploadCover = async () => {
    const file = fileRef.current.files[0];
    if (!file) return alert('اختر ملف');
    const fd = new FormData(); fd.append('cover', file);
    try {
      await axios.put(`${API}/api/communities/${id}/cover`, fd, config);
      alert('تم تحديث الغلاف'); fetch();
    } catch (err) { alert('فشل الرفع'); }
  };

  const setPinned = async () => {
    const message = prompt('اكتب الرسالة المثبتة');
    if (message === null) return;
    try { await axios.put(`${API}/api/communities/${id}/pinned`, { message }, config); alert('تم الحفظ'); fetch(); } catch (err) { alert('فشل الحفظ'); }
  };

  if (loading || !community) return <div className="min-h-screen flex items-center justify-center">جارٍ التحميل...</div>;

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isAdminish = currentUser && (currentUser.universityId === '0000' || currentUser.role === 'doctor' || currentUser.role === 'admin');

  return (
    <div className="min-h-screen app-bg font-sans">
      <Navbar user={currentUser} />
      <div className="max-w-6xl mx-auto p-6">
        <div className="card-bg rounded-3xl shadow-lg overflow-hidden border border-transparent">
          {community.coverUrl ? <img src={community.coverUrl} className="w-full h-56 object-cover" /> : <div className="w-full h-56 bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center text-white text-4xl font-black">{community.name}</div>}
          <div className="p-6 text-right">
            <h2 className="text-2xl font-extrabold">{community.name}</h2>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {community.batch ? <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-mono text-gray-700 border border-gray-100">دفعة {community.batch}</span> : null}
              <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-mono text-gray-700 border border-gray-100">{community.privacy}</span>
              <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-mono text-gray-700 border border-gray-100">أعضاء: {community.membersCount || 0}</span>
            </div>
            <p className="mt-3 text-gray-600">{community.description}</p>
            {community.pinnedMessage && <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">مثبت: {community.pinnedMessage}</div>}
            {memberRole === 'admin' && <div className="mt-3"><span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-black border border-amber-200">أنت أدمن في هذا المجتمع</span></div>}

            <div className="mt-4 flex items-center gap-3">
              {!isMember ? <button onClick={join} className="bg-red-600 text-white px-4 py-2 rounded-xl">انضم</button> : <button onClick={leave} className="bg-gray-200 px-4 py-2 rounded-xl">مغادرة</button>}
              {isAdminish && (
                <>
                  <input type="file" ref={fileRef} className="hidden" id="coverInput" />
                  <label htmlFor="coverInput" onClick={() => fileRef.current.click()} className="card-bg border px-3 py-2 rounded-xl cursor-pointer">اختر غلاف</label>
                  <button onClick={uploadCover} className="bg-green-600 text-white px-3 py-2 rounded-xl">رفع</button>
                  <button onClick={setPinned} className="bg-yellow-500 text-white px-3 py-2 rounded-xl">تعيين مثبت</button>
                </>
              )}
              <Link to={`/communities/${community.id}/chat`} className="ml-2 bg-indigo-600 text-white px-3 py-2 rounded-xl">دخول المحادثة</Link>
            </div>
            
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <h4 className="font-bold text-gray-700 mb-3">المحادثة العامة</h4>
                    <CommunityChat communityId={community.id} currentUser={JSON.parse(localStorage.getItem('user'))} />
                  </div>
                  <div>
                    <CommunityMembers communityId={community.id} currentUser={JSON.parse(localStorage.getItem('user'))} />
                  </div>
                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
