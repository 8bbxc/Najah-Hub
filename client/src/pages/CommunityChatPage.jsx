import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../utils/api';
import CommunityChat from '../components/CommunityChat';
import CommunityMembers from '../components/CommunityMembers';
import Navbar from '../components/Navbar';

const CommunityChatPage = () => {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetch(); }, [id]);
  const fetch = async () => {
    try {
      const res = await axios.get(`${API}/api/communities/${id}`, config);
      setCommunity(res.data.community);
    } catch (err) { console.error(err); }
  };

  if (!community) return <div className="min-h-screen flex items-center justify-center">جارٍ التحميل...</div>;

  const currentUser = JSON.parse(localStorage.getItem('user'));
  return (
    <div className="min-h-screen app-bg text-gray-900 dark:text-gray-100">
      <Navbar user={currentUser} />
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-9">
            <div className="card-bg rounded-xl shadow p-4 border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-extrabold">{community.name}</h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{community.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/communities/${id}`} className="text-sm text-gray-600 dark:text-gray-400">رجوع</Link>
                  <Link to={`/communities/${id}/chat`} className="text-sm text-indigo-600 dark:text-indigo-400">فتح المحادثة</Link>
                </div>
              </div>

              <CommunityChat communityId={community.id} currentUser={currentUser} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3 hidden lg:block">
            <CommunityMembers communityId={community.id} currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityChatPage;
