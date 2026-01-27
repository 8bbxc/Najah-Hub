import { useState, useEffect } from 'react';
import axios from 'axios';
import { API as API_BASE } from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
    Users, FileText, Database, TrendingUp, ShieldAlert, 
    Loader, Trash2, UserCog, Search, ShieldCheck, UserCheck, Star 
} from 'lucide-react';
// Announcement editor component for Admin Dashboard
const AnnouncementEditor = () => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const [anns, setAnns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', isActive: true });
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAll = () => {
        if (selectedIds.length === anns.length) setSelectedIds([]);
        else setSelectedIds(anns.map(a => a.id));
    };

    const deleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`هل تريد حذف ${selectedIds.length} إعلان(ات)؟`)) return;
        try {
            await axios.post(`${API_BASE}/api/announcements/bulk-delete`, { ids: selectedIds }, config);
            fetchAnns();
            setSelectedIds([]);
            alert('تم حذف الإعلانات المحددة');
        } catch (err) { console.error(err); alert(err.response?.data?.message || 'فشل حذف الإعلانات'); }
    };

    const fetchAnns = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/announcements?active=false`, config);
            setAnns(res.data || []);
        } catch (err) {
            console.error('Failed to fetch announcements', err);
            alert('فشل جلب الإعلانات');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAnns(); }, []);

    const createAnn = async () => {
        if (!form.title.trim() || !form.content.trim()) return alert('العنوان والمحتوى مطلوبان');
        try {
            const res = await axios.post(`${API_BASE}/api/announcements`, form, config);
            setForm({ title: '', content: '', isActive: true });
            fetchAnns();
            alert('تم نشر الإعلان');
        } catch (err) { console.error(err); alert(err.response?.data?.message || 'فشل إنشاء الإعلان'); }
    };

    const toggleActive = async (id, current) => {
        try {
            await axios.put(`${API_BASE}/api/announcements/${id}`, { isActive: !current }, config);
            fetchAnns();
        } catch (err) { console.error(err); alert('فشل تحديث الحالة'); }
    };

    const deleteAnn = async (id) => {
        if (!window.confirm('هل تريد حذف هذا الإعلان؟')) return;
        try {
            await axios.delete(`${API_BASE}/api/announcements/${id}`, config);
            fetchAnns();
        } catch (err) { console.error(err); alert('فشل حذف الإعلان'); }
    };

    return (
        <div>
            <div className="flex gap-3 items-start">
                <input value={form.title} onChange={(e)=>setForm(s=>({...s, title:e.target.value}))} placeholder="عنوان الإعلان" className="flex-1 px-3 py-2 border rounded-lg" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm(s=>({...s, isActive: e.target.checked}))} /> مفعل</label>
                <button onClick={createAnn} className="admin-btn">إنشاء</button>
            </div>
            <textarea value={form.content} onChange={(e)=>setForm(s=>({...s, content: e.target.value}))} placeholder="محتوى الإعلان (نص مختصر)" className="w-full mt-3 p-3 border rounded-lg min-h-[80px]" />

            <div className="mt-4">
                <h4 className="font-bold mb-2">الإعلانات الحالية</h4>
                {loading ? <div>تحميل...</div> : (
                    <div className="space-y-2">
                        {anns.length === 0 && <div className="text-gray-400">لا توجد إعلانات حالياً.</div>}

                        {/* Bulk actions header */}
                        {anns.length > 0 && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border mb-2">
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={selectedIds.length === anns.length} onChange={selectAll} />
                                        <span>تحديد الكل</span>
                                    </label>
                                    {selectedIds.length > 0 && <span className="text-xs text-gray-600">محدد: {selectedIds.length}</span>}
                                </div>
                                <div>
                                    <button onClick={deleteSelected} className="admin-btn-danger text-sm" disabled={selectedIds.length === 0}>حذف المحدد</button>
                                </div>
                            </div>
                        )}

                        {anns.map(a => (
                            <div key={a.id} className="p-3 border rounded-lg flex items-start justify-between bg-white">
                                <div className="flex items-start gap-3">
                                    <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={()=>toggleSelect(a.id)} />
                                    <div>
                                        <div className="font-bold">{a.title} {a.isActive && <span className="text-xs text-green-600">(مفعل)</span>}</div>
                                        <div className="text-xs text-gray-600 mt-1">{a.content}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={()=>toggleActive(a.id, a.isActive)} className="admin-btn-outline text-sm">{a.isActive ? 'إلغاء التفعيل' : 'تفعيل'}</button>
                                    <button onClick={()=>deleteAnn(a.id)} className="admin-btn-danger text-sm">حذف</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [users, setUsers] = useState([]); 
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(""); 

    // bulk selection for users
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const toggleSelectUser = (id) => setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const selectAllUsers = () => setSelectedUserIds(prev => prev.length === users.length ? [] : users.map(u => u.id || u._id));
    const deleteSelectedUsers = async () => {
        if (selectedUserIds.length === 0) return;
        if (!window.confirm(`هل تريد حذف ${selectedUserIds.length} حساب(ات)؟`)) return;
        try {
            const res = await axios.post(`${API_BASE}/api/admin/users/bulk-delete`, { ids: selectedUserIds }, config);
            await fetchAdminData();
            setSelectedUserIds([]);
            const results = res.data?.results;
            if (results) {
                const msgParts = [];
                if ((results.deleted || []).length) msgParts.push(`تم حذف ${results.deleted.length} حساب(ات)`);
                if ((results.failed || []).length) msgParts.push(`فشل حذف ${results.failed.length} (انظر السجل)`);
                alert(msgParts.join(' — '));
            } else {
                alert(res.data?.message || 'تمت العملية');
            }
        } catch (err) { console.error(err); alert(err.response?.data?.message || 'فشل حذف الحسابات'); }
    };

    // bulk selection for communities
    const [selectedCommunityIds, setSelectedCommunityIds] = useState([]);
    const toggleSelectCommunity = (id) => setSelectedCommunityIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const selectAllCommunities = () => setSelectedCommunityIds(prev => prev.length === communities.length ? [] : communities.map(c => c.id));
    const deleteSelectedCommunities = async () => {
        if (selectedCommunityIds.length === 0) return;
        if (!window.confirm(`هل تريد حذف ${selectedCommunityIds.length} مجتمع(ات)؟`)) return;
        try {
            const res = await axios.post(`${API_BASE}/api/admin/communities/bulk-delete`, { ids: selectedCommunityIds }, config);
            await fetchAdminData();
            setSelectedCommunityIds([]);
            const results = res.data?.results;
            if (results) {
                const msgParts = [];
                if ((results.deleted || []).length) msgParts.push(`تم حذف ${results.deleted.length} مجتمع(ات)`);
                if ((results.failed || []).length) msgParts.push(`فشل حذف ${results.failed.length} (انظر السجل)`);
                alert(msgParts.join(' — '));
            } else {
                alert(res.data?.message || 'تمت العملية');
            }
        } catch (err) { console.error(err); alert(err.response?.data?.message || 'فشل حذف المجتمعات'); }
    };
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    useEffect(() => {
        // ✅ إضافة تأخير بسيط لضمان استقرار التوكن والاتصال
        const timer = setTimeout(() => {
            fetchAdminData();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // ✅ محاولة جلب البيانات مع معالجة الخطأ لكل طلب
            const statsPromise = axios.get(`${API_BASE}/api/admin/stats`, config).catch(e => e);
            const usersPromise = axios.get(`${API_BASE}/api/admin/users`, config).catch(e => e);
            const communitiesPromise = axios.get(`${API_BASE}/api/communities`, config).catch(e => e);

            const [statsRes, usersRes, communitiesRes] = await Promise.all([statsPromise, usersPromise, communitiesPromise]);

            if (statsRes.data) setData(statsRes.data);
            if (usersRes.data) setUsers(usersRes.data);
            if (communitiesRes.data) setCommunities(communitiesRes.data);

            // إذا فشل الطلبان معاً
            if (!statsRes.data && !usersRes.data) throw new Error("Connection Failed");

        } catch (err) {
            console.error("Admin API Error:", err);
            // ✅ كسر حالة التحميل لإظهار رسالة الخطأ بدلاً من التعليق للأبد
            alert("مهندس، السيرفر لا يستجيب.. تأكد من تشغيل الباك إند");
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, name) => {
        if (window.confirm(`هل أنت متأكد من حذف حساب "${name}" نهائياً؟`)) {
            try {
                await axios.delete(`${API_BASE}/api/admin/users/${userId}`, config);
                setUsers(users.filter(u => (u.id || u._id) !== userId));
                setSelectedUserIds(prev => prev.filter(x => x !== userId));
                showToast('تم حذف الحساب بنجاح', 'success');
            } catch (err) {
                showToast("فشل الحذف: " + (err.response?.data?.message || "خطأ تقني"), 'error');
            }
        }
    };

    const setRole = async (userId, role) => {
        try {
            await axios.put(`${API}/api/admin/users/${userId}/role`, { role }, config);
            setUsers(users.map(u => (u.id || u._id) === userId ? { ...u, role } : u));
            showToast('تم تحديث الرتبة بنجاح', 'success');
                // if promoted to admin, open permissions modal to let master admin grant rights
                if (role === 'admin') {
                    const promoted = users.find(u => (u.id || u._id) === userId) || null;
                    if (promoted) openPermissionsModal(promoted);
                }
        } catch (err) {
            showToast('فشل تحديث الرتبة', 'error');
        }
    };

    const setPasswordForUser = async (userId) => {
        const newPassword = window.prompt('اكتب كلمة المرور الجديدة للمستخدم:');
        if (!newPassword) return;
        try {
            await axios.put(`${API}/api/admin/users/${userId}/password`, { newPassword }, config);
            alert('تم تعيين كلمة المرور الجديدة');
        } catch (err) { alert('فشل تعيين كلمة المرور'); }
    };
    const [permissionEditUser, setPermissionEditUser] = useState(null);
    const [permissionForm, setPermissionForm] = useState({ canDelete: false, canEdit: false, canAssignAdmin: false, canModerate: false, canCreateCommunity: false });
    const [toast, setToast] = useState(null);

    const showToast = (text, type = 'info', timeout = 3000) => {
        setToast({ text, type });
        setTimeout(() => setToast(null), timeout);
    };

    const openPermissionsModal = (user) => {
        setPermissionEditUser(user);
        setPermissionForm({
            canDelete: !!user.permissions?.canDelete,
            canEdit: !!user.permissions?.canEdit,
            canAssignAdmin: !!user.permissions?.canAssignAdmin,
            canModerate: !!user.permissions?.canModerate,
            canCreateCommunity: !!user.permissions?.canCreateCommunity,
        });
    };

    const savePermissions = async () => {
        if (!permissionEditUser) return;
        try {
            await axios.put(`${API}/api/admin/users/${permissionEditUser.id || permissionEditUser._id}/permissions`, { permissions: permissionForm }, config);
            setUsers(users.map(u => (u.id || u._id) === (permissionEditUser.id || permissionEditUser._id) ? { ...u, permissions: permissionForm } : u));
            setPermissionEditUser(null);
            alert('تم حفظ الصلاحيات');
        } catch (err) { showToast('فشل حفظ الصلاحيات', 'error'); }
    };

    const toggleFeatured = async (userId) => {
        console.log('toggleFeatured clicked for', userId);
        try {
            // normalize id comparison to string to avoid type mismatch
            const idStr = String(userId);
            const u = users.find(x => String(x.id || x._id) === idStr);
            const newVal = !Boolean(u?.isFeatured);

            // optimistic update
            setUsers(prev => prev.map(x => String(x.id || x._id) === idStr ? { ...x, isFeatured: newVal } : x));

            const res = await axios.put(`${API}/api/admin/users/${userId}/feature`, { featured: newVal }, config);
            console.log('feature API response', res.data);
            // if server returns updated user, merge it (optional)
            if (res.data?.user) {
                setUsers(prev => prev.map(x => String(x.id || x._id) === idStr ? { ...x, ...res.data.user } : x));
            }
            showToast('تم تحديث حالة الميزة بنجاح', 'success');
        } catch (err) {
            console.error('toggleFeatured error', err);
            // rollback optimistic change
            setUsers(prev => prev.map(x => (x.id || x._id) === userId ? { ...x, isFeatured: !x.isFeatured } : x));
            showToast('فشل تغيير حالة الميزة', 'error');
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (String(u.universityId).includes(searchTerm))
    );

    const pendingUsers = users.filter(u => u.status === 'pending');

    const approveUser = async (id) => {
        try {
            await axios.put(`${API}/api/admin/users/${id}/status`, { status: 'active' }, config);
            setUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u));
            showToast('تمت الموافقة على المستخدم', 'success');
        } catch (err) { showToast(err.response?.data?.message || err.message || 'فشل', 'error'); }
    };

    const rejectUser = async (id) => {
        try {
            await axios.put(`${API}/api/admin/users/${id}/status`, { status: 'disabled' }, config);
            setUsers(users.map(u => u.id === id ? { ...u, status: 'disabled' } : u));
            showToast('تم رفض المستخدم', 'success');
        } catch (err) { showToast(err.response?.data?.message || err.message || 'فشل', 'error'); }
    };

    const [communitySearch, setCommunitySearch] = useState('');
    const filteredCommunities = communities.filter(c => (c.name || '').toLowerCase().includes(communitySearch.toLowerCase()));

    const handleDeleteCommunity = async (id) => {
        if (!window.confirm('هل تريد حذف هذا المجتمع نهائياً؟')) return;
        try {
            await axios.delete(`${API_BASE}/api/communities/${id}`, config);
            setCommunities(communities.filter(c => c.id !== id));
            setSelectedCommunityIds(prev => prev.filter(x => x !== id));
            alert('تم حذف المجتمع');
        } catch (err) { alert(err.response?.data?.message || err.message || 'فشل الحذف'); }
    };

    const [editingCommunity, setEditingCommunity] = useState(null);
    const openEditCommunity = (c) => setEditingCommunity({ ...c });
    const saveEditingCommunity = async () => {
        if (!editingCommunity) return;
        try {
            const payload = { name: editingCommunity.name, description: editingCommunity.description, privacy: editingCommunity.privacy, batch: editingCommunity.batch };
            const res = await axios.put(`${API}/api/communities/${editingCommunity.id}`, payload, config);
            setCommunities(communities.map(cc => cc.id === editingCommunity.id ? res.data.community || { ...cc, ...editingCommunity } : cc));
            setEditingCommunity(null);
            alert('تم حفظ التغييرات');
        } catch (err) { alert(err.response?.data?.message || err.message || 'فشل حفظ التعديلات'); }
    };

    // ✅ التحقق السيادي للصلاحيات: مالك النظام أو رتبة admin أو assistant
    const isAdmin = String(currentUser?.universityId).trim() === '0000' || currentUser?.role === 'admin' || currentUser?.role === 'assistant';

    if (!isAdmin) return (
        <div className="flex flex-col items-center justify-center min-h-screen app-bg">
            <ShieldAlert className="text-red-500 mb-4" size={64} />
            <h2 className="text-xl font-bold">وصول غير مسموح</h2>
            <button onClick={() => window.location.href='/home'} className="mt-4 text-blue-500 underline">العودة للرئيسية</button>
        </div>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <Loader className="animate-spin text-najah-primary" size={48} />
            <p className="mt-4 font-bold text-gray-500 italic">يتم فحص الصلاحيات والاتصال بـ Najah Server...</p>
        </div>
    );

    return (
        <div className="min-h-screen admin-surface font-sans">
            <Navbar user={currentUser} />
            <div className="max-w-7xl mx-auto p-4 md:p-6 flex gap-8 flex-col lg:flex-row lg:pr-[280px]">
                <div className="flex-1 space-y-8" dir="rtl">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                            <ShieldAlert className="text-red-500" size={32} /> لوحة تحكم النظام
                        </h1>
                        <div className="flex items-center gap-3">
                            <a href="/admin/settings" className="text-sm text-indigo-600 hover:underline">الإعدادات</a>
                            <a href="/admin/audits" className="text-sm text-indigo-600 hover:underline">سجل التدقيق</a>
                            <span className="bg-red-100 text-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-sm border border-red-200">Master Admin Mode</span>
                        </div>
                    </div>

                    <div>
                        {toast && (
                            <div className={`p-3 rounded-lg mb-4 ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
                                {toast.text}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard icon={<Users size={24}/>} label="إجمالي الطلاب" value={data?.stats?.totalUsers || 0} color="bg-blue-600" />
                        <StatCard icon={<FileText size={24}/>} label="المنشورات" value={data?.stats?.totalPosts || 0} color="bg-green-600" />
                        <StatCard icon={<Database size={24}/>} label="المرفقات" value={data?.stats?.totalFiles || 0} color="bg-amber-600" />
                    </div>

                    {/* Announcements management */}
                    <div className="card-bg rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                        <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">إعلانات النظام</h3>
                            <div className="text-xs text-gray-500">يمكنك إنشاء إعلان يظهر في الصفحة الرئيسية كصندوق صغير</div>
                        </div>
                        <div className="p-6">
                            <AnnouncementEditor />
                        </div>
                    </div>

                    <div className="card-bg rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800"><UserCog className="text-najah-primary" /> إدارة المستخدمين</h3>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="ابحث باسم الطالب أو رقمه..." className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-najah-primary transition shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>

                        {pendingUsers.length > 0 && (
                            <div className="p-4 border-b bg-yellow-50 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-bold">طلبات تسجيل معلقة ({pendingUsers.length})</div>
                                    <div className="text-xs text-gray-500">راجع الحسابات ووافق عليها</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {pendingUsers.map(p => (
                                        <div key={p.id || p._id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded shadow-sm hover:bg-blue-900 hover:bg-opacity-10 dark:hover:bg-blue-800 dark:hover:bg-opacity-30 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">{p.name?.[0]}</div>
                                                <div>
                                                    <div className="font-bold text-sm">{p.name}</div>
                                            {/* Permissions modal */}
                                            {permissionEditUser && (
                                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                                    <div className="w-96 admin-modal p-6" dir="rtl">
                                                        <h3 className="font-bold mb-3">تعيين صلاحيات لـ {permissionEditUser.name}</h3>
                                                        <div className="flex flex-col gap-2 mb-4">
                                                            <label className="flex items-center justify-between"><span>السماح بالحذف</span><input type="checkbox" checked={!!permissionForm.canDelete} onChange={e=>setPermissionForm(s=>({...s, canDelete: e.target.checked}))} /></label>
                                                            <label className="flex items-center justify-between"><span>السماح بالتعديل</span><input type="checkbox" checked={!!permissionForm.canEdit} onChange={e=>setPermissionForm(s=>({...s, canEdit: e.target.checked}))} /></label>
                                                            <label className="flex items-center justify-between"><span>تعيين أدمن</span><input type="checkbox" checked={!!permissionForm.canAssignAdmin} onChange={e=>setPermissionForm(s=>({...s, canAssignAdmin: e.target.checked}))} /></label>
                                                            <label className="flex items-center justify-between"><span>إدارة الإشراف</span><input type="checkbox" checked={!!permissionForm.canModerate} onChange={e=>setPermissionForm(s=>({...s, canModerate: e.target.checked}))} /></label>
                                                            <label className="flex items-center justify-between"><span>إنشاء مجتمع</span><input type="checkbox" checked={!!permissionForm.canCreateCommunity} onChange={e=>setPermissionForm(s=>({...s, canCreateCommunity: e.target.checked}))} /></label>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <button className="admin-btn-outline" onClick={()=>setPermissionEditUser(null)}>إلغاء</button>
                                                            <button className="admin-btn" onClick={savePermissions}>حفظ</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                                    <div className="text-xs text-gray-500">#{p.universityId}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => approveUser(p.id || p._id)} className="admin-btn text-sm">موافق</button>
                                                <button onClick={() => rejectUser(p.id || p._id)} className="admin-btn-danger text-sm">رفض</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Users bulk actions */}
                        {users.length > 0 && (
                            <div className="flex items-center justify-between p-2 mb-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={selectedUserIds.length === users.length} onChange={selectAllUsers} />
                                        <span className="text-sm">تحديد الكل</span>
                                    </label>
                                    {selectedUserIds.length > 0 && <span className="text-xs text-gray-600">محدد: {selectedUserIds.length}</span>}
                                </div>
                                <div>
                                    <button onClick={deleteSelectedUsers} className="admin-btn-danger text-sm" disabled={selectedUserIds.length === 0}>حذف المحدد</button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-100/50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">المستخدم</th>
                                        <th className="px-6 py-4 text-center">الرقم الجامعي</th>
                                        <th className="px-6 py-4 text-center">الرتبة</th>
                                        <th className="px-6 py-4 text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                        <tr key={user.id || user._id} className="hover:bg-gray-50/80 transition dark:hover:bg-blue-900 dark:hover:bg-opacity-30">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <input type="checkbox" checked={selectedUserIds.includes(user.id || user._id)} onChange={()=>toggleSelectUser(user.id || user._id)} />
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-white shadow-sm shrink-0">
                                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white text-xs">{user.name?.[0]}</div>}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-gray-800 block">{user.name} {user.isFeatured && <span className="text-yellow-500 text-sm mr-2">⭐</span>}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">ID: {user.id || user._id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-xs text-gray-600">#{user.universityId}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border shadow-sm ${user.role === 'doctor' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{user.role === 'doctor' ? 'دكتور' : 'طالب'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <select value={user.role} onChange={(e) => setRole(user.id || user._id, e.target.value)} className="p-2 rounded-xl border">
                                                        <option value="student">طالب</option>
                                                        <option value="doctor">دكتور</option>
                                                        <option value="admin">أدمن</option>
                                                        <option value="assistant">مساعد أدمن</option>
                                                    </select>
                                                    <button onClick={() => setPasswordForUser(user.id || user._id)} className="admin-btn-outline" title="تعيين كلمة مرور">🔑</button>
                                                    <button onClick={() => openPermissionsModal(user)} className="admin-btn-outline" title="تعيين صلاحيات">⚙️</button>
                                                    <button onClick={() => toggleFeatured(user.id || user._id)} className={`admin-btn-outline ${user.isFeatured ? 'text-yellow-400' : ''}`} title={user.isFeatured ? 'إلغاء تمييز المستخدم' : 'تمييز المستخدم'}>
                                                        <Star size={18} />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id || user._id, user.name)} disabled={!user.canDelete} className={`admin-btn-danger ${!user.canDelete ? 'opacity-40 cursor-not-allowed' : ''}`} title={!user.canDelete ? (String(user.id || user._id) === String(currentUser?.id) ? 'لا يمكنك حذف حسابك' : 'غير مصرح') : 'حذف الحساب'}><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-400 font-medium italic">لا توجد بيانات مستخدمين لعرضها..</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Communities management */}
                    <div className="card-bg rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                        <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800"><Database className="text-najah-primary" /> المجتمعات</h3>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="ابحث باسم المجتمع..." className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-najah-primary transition shadow-sm" onChange={(e) => setCommunitySearch(e.target.value)} />
                            </div>
                        </div>

                        {/* Communities bulk actions */}
                        {communities.length > 0 && (
                            <div className="flex items-center justify-between p-2 mb-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={selectedCommunityIds.length === communities.length} onChange={selectAllCommunities} />
                                        <span className="text-sm">تحديد الكل</span>
                                    </label>
                                    {selectedCommunityIds.length > 0 && <span className="text-xs text-gray-600">محدد: {selectedCommunityIds.length}</span>}
                                </div>
                                <div>
                                    <button onClick={deleteSelectedCommunities} className="admin-btn-danger text-sm" disabled={selectedCommunityIds.length === 0}>حذف المحدد</button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-100/50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">اسم المجتمع</th>
                                        <th className="px-6 py-4 text-center">الأعضاء</th>
                                        <th className="px-6 py-4 text-center">الخصوصية</th>
                                        <th className="px-6 py-4 text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredCommunities.length > 0 ? filteredCommunities.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50/80 transition dark:hover:bg-blue-900 dark:hover:bg-opacity-30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <input type="checkbox" checked={selectedCommunityIds.includes(c.id)} onChange={()=>toggleSelectCommunity(c.id)} />
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-800">{c.name}</div>
                                                        <div className="text-[10px] text-gray-400">{c.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-xs text-gray-600">{c.membersCount || 0}</td>
                                            <td className="px-6 py-4 text-center">{c.privacy}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => openEditCommunity(c)} className="admin-btn-outline">تعديل</button>
                                                    <button onClick={() => handleDeleteCommunity(c.id)} disabled={!c.canDelete} className={`admin-btn-danger ${!c.canDelete ? 'opacity-40 cursor-not-allowed' : ''}`} title={!c.canDelete ? 'غير مصرح' : 'حذف'}>حذف</button>
                                                    <a href={`/communities/${c.id}/chat`} className="admin-btn-outline">فتح</a>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-400 font-medium italic">لا توجد مجتمعات لعرضها..</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Edit community modal */}
                    {editingCommunity && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="card-bg rounded-lg p-6 w-96" dir="rtl">
                                <h3 className="font-bold mb-3">تعديل المجتمع</h3>
                                <div className="mb-3">
                                    <label className="block text-sm mb-1">اسم المجتمع</label>
                                    <input className="w-full p-2 border rounded" value={editingCommunity.name || ''} onChange={e=>setEditingCommunity(s=>({...s, name: e.target.value}))} />
                                </div>
                                <div className="mb-3">
                                    <label className="block text-sm mb-1">الوصف</label>
                                    <textarea className="w-full p-2 border rounded" value={editingCommunity.description || ''} onChange={e=>setEditingCommunity(s=>({...s, description: e.target.value}))} />
                                </div>
                                <div className="mb-3">
                                    <label className="block text-sm mb-1">الخصوصية</label>
                                    <select className="w-full p-2 border rounded" value={editingCommunity.privacy || 'public'} onChange={e=>setEditingCommunity(s=>({...s, privacy: e.target.value}))}>
                                        <option value="public">عام</option>
                                        <option value="private">خاص</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="block text-sm mb-1">دفعة (اختياري)</label>
                                    <input className="w-full p-2 border rounded" value={editingCommunity.batch || ''} onChange={e=>setEditingCommunity(s=>({...s, batch: e.target.value}))} />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={()=>setEditingCommunity(null)} className="admin-btn-outline">إلغاء</button>
                                    <button onClick={saveEditingCommunity} className="admin-btn">حفظ</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="card-bg p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition duration-300">
        <div className={`${color} text-white p-4 rounded-2xl shadow-lg`}>{icon}</div>
        <div>
            <p className="text-gray-400 text-[10px] font-black uppercase mb-1 tracking-wider">{label}</p>
            <p className="text-2xl font-black text-gray-800">{value}</p>
        </div>
    </div>
);

export default AdminDashboard;