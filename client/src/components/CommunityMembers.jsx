import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import axios from 'axios';
import { API } from '../utils/api';

const defaultPermissions = {
  canRemoveMembers: true,
  canPromote: true,
  canPin: true,
  canUploadCover: true,
};

const AVATAR_URL = (name = 'User') => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=dddddd&color=555555&size=128`;

function roleRank(role) {
  if (!role) return 4;
  const r = role.toString().toLowerCase();
  if (r === 'owner') return 0;
  if (r === 'admin') return 1;
  if (r === 'moderator' || r === 'mod') return 2;
  return 3;
}

export default function CommunityMembers({ communityId, currentUser }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addId, setAddId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState(null);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [roleOption, setRoleOption] = useState('member');
  const [currentMemberPermissions, setCurrentMemberPermissions] = useState(defaultPermissions);
  const [communityCreatorId, setCommunityCreatorId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const navigate = useNavigate();

  const canManageGlobal = (() => {
    try {
      const role = (currentUser && (currentUser.role || '')).toString().toLowerCase();
      return !!currentUser && role !== 'student';
    } catch (e) {
      return false;
    }
  })();

  const fetchMembers = async () => {
    if (!communityId) return;
    setLoading(true);
    try {
      const [membersRes, communityRes] = await Promise.all([
        axios.get(`${API}/api/communities/${communityId}/members`, config),
        axios.get(`${API}/api/communities/${communityId}`, config),
      ]);

      const list = (membersRes.data || []).map((m) => {
        const user = m.user || m.User || {};
        return {
          id: m.userId || user.id || m.id,
          name: m.name || user.name || user.username || '---',
          role: (m.role || user.role || 'member').toString(),
          avatar: m.profileImage || user.profileImage || user.avatar || m.avatar || AVATAR_URL(m.name || user.name || 'User'),
          batch: m.batch ?? user.batch ?? null,
          permissions: m.permissions || defaultPermissions,
        };
      });

      const c = communityRes.data?.community || {};
      setCommunityCreatorId(c.creatorId || null);

      list.sort((a, b) => {
        const r = roleRank(a.role) - roleRank(b.role);
        return r !== 0 ? r : ('' + a.name).localeCompare(b.name);
      });

      setMembers(list);

      const meId = JSON.parse(localStorage.getItem('user'))?.id;
      const myEntry = list.find((x) => String(x.id) === String(meId));
      if (String(meId) === String(c.creatorId)) {
        setCurrentMemberPermissions({ canRemoveMembers: true, canPromote: true, canPin: true, canUploadCover: true });
      } else {
        setCurrentMemberPermissions(myEntry?.permissions || defaultPermissions);
      }
    } catch (err) {
      console.error('fetchMembers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const handleAdd = async () => {
    if (!addId.trim()) return;
    try {
      await axios.post(`${API}/api/communities/${communityId}/members`, { universityId: addId.trim() }, config);
      setAddId('');
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الإضافة');
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('تأكيد إزالة العضو؟')) return;
    try {
      await axios.delete(`${API}/api/communities/${communityId}/members/${id}`, config);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الإزالة');
    }
  };

  const openSettings = (m) => {
    setSelected(m);
    setRoleOption(m.role || 'member');
    setPermissions(m.permissions || defaultPermissions);
    setShowSettings(true);
  };

  const saveSettings = async () => {
    if (!selected) return;
    try {
      await axios.put(`${API}/api/communities/${communityId}/members/${selected.id}`, { role: roleOption, permissions }, config);
      setShowSettings(false);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الحفظ');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border rounded-lg p-4 community-members-card">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold">أعضاء المجتمع ({members.length})</h4>
        <div className="flex items-center gap-2">
          <input
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            placeholder="ادخل رقم الجامعة لإضافة"
            className="p-2 border rounded text-sm"
          />
          <button onClick={handleAdd} className="px-3 py-1 bg-najah-primary text-white rounded text-sm">أضف</button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-center py-6 text-sm text-gray-500">جاري التحميل...</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-gray-500">لا يوجد أعضاء حتى الآن.</div>
        ) : (
          members.map((m) => {
            const isOwner = String(m.id) === '0000' || String(m.id) === String(communityCreatorId) || (m.role || '').toLowerCase() === 'owner';
            return (
              <div key={m.id} onMouseEnter={() => setHoveredId(m.id)} onMouseLeave={() => setHoveredId(null)} className={`flex items-center justify-between p-3 gap-3 rounded transition group hover:shadow-sm`} style={{ backgroundColor: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') && hoveredId === m.id) ? 'rgba(30,64,175,0.25)' : undefined }}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => navigate(`/profile/${m.id}`)} className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = AVATAR_URL(m.name);
                      }}
                    />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`${isOwner ? 'text-yellow-400 font-semibold' : 'font-semibold'} truncate transition-colors`}>{m.name}</span>
                      {isOwner && <Crown size={14} className="text-yellow-400" />}
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:bg-transparent dark:group-hover:bg-transparent">{m.role}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 group-hover:text-blue-500 dark:group-hover:text-blue-400">{m.batch !== null ? `دفعة ${m.batch}` : 'دفعة ---'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {((currentMemberPermissions && currentMemberPermissions.canRemoveMembers) || canManageGlobal) && (
                    <>
                      <button onClick={() => openSettings(m)} className="text-xs px-2 py-1 rounded border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 group-hover:bg-transparent dark:group-hover:bg-transparent group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:border-blue-400">إعدادات</button>
                      <button onClick={() => handleRemove(m.id)} className="text-xs px-2 py-1 rounded bg-red-600 text-white group-hover:ring-2 group-hover:ring-blue-400 dark:group-hover:ring-blue-300 group-hover:bg-red-500">إزالة</button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showSettings && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-bg rounded-lg p-6 w-96">
            <h3 className="font-bold mb-3">إعدادات العضو</h3>
            <div className="mb-3">
              <label className="block text-sm mb-1">الدور</label>
              <select value={roleOption} onChange={(e) => setRoleOption(e.target.value)} className="w-full p-2 border rounded">
                <option value="member">عضو</option>
                <option value="moderator">مشرف</option>
                <option value="admin">أدمن</option>
                <option value="owner">مالك</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">الصلاحيات</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!permissions.canRemoveMembers} onChange={(e) => setPermissions((p) => ({ ...p, canRemoveMembers: e.target.checked }))} /> إزالة أعضاء</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!permissions.canPromote} onChange={(e) => setPermissions((p) => ({ ...p, canPromote: e.target.checked }))} /> ترقية/خفض أعضاء</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!permissions.canPin} onChange={(e) => setPermissions((p) => ({ ...p, canPin: e.target.checked }))} /> تثبيت رسائل</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!permissions.canUploadCover} onChange={(e) => setPermissions((p) => ({ ...p, canUploadCover: e.target.checked }))} /> رفع غلاف</label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSettings(false)} className="px-3 py-2 rounded border">إلغاء</button>
              <button onClick={saveSettings} className="px-3 py-2 rounded bg-blue-600 text-white">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



