import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../utils/api';
import PostCard from '../components/PostCard';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { Camera, User as UserIcon, Calendar, Hash, Crown, Loader, Edit3, X, Check, UserCircle, Heart, Bot } from 'lucide-react';

const Profile = () => {
    const { id } = useParams();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // ✅ حالات تعديل البروفايل
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '', gender: '' });

    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    const [isFollowing, setIsFollowing] = useState(false);

    // Likes for this profile (heart)
    const [likesCount, setLikesCount] = useState(0);
    const [likedByMe, setLikedByMe] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    useEffect(() => {
        const handler = () => fetchProfile();
        window.addEventListener('postsChanged', handler);
        return () => window.removeEventListener('postsChanged', handler);
    }, [id]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/users/${id}`, config);
            setProfileData(res.data);
            setIsFollowing(!!res.data.isFollowing);
            // initialize likes if API provides them, otherwise default 0
            setLikesCount(res.data.likesCount || res.data.user?.likesCount || 0);
            setLikedByMe(!!res.data.likedByMe);
        } catch (err) { console.error("Error fetching profile", err); }
        finally { setLoading(false); }
    };

    const toggleLike = async () => {
        const prevLiked = likedByMe;
        const prevCount = likesCount;
        // optimistic
        setLikedByMe(!prevLiked);
        setLikesCount(prevCount + (prevLiked ? -1 : 1));
        try {
            const res = await axios.post(`${API}/api/users/${id}/like`, {}, config);
            if (res.data && typeof res.data.likesCount === 'number') setLikesCount(res.data.likesCount);
            setLikedByMe(res.data.status === 'added');
        } catch (err) {
            // revert on error
            setLikedByMe(prevLiked);
            setLikesCount(prevCount);
            console.error('Like error', err);
            alert(err.response?.data?.message || 'فشل تحديث الإعجاب');
        }
    };

    const toggleFollow = async () => {
        try {
            if (isFollowing) {
                await axios.delete(`${API}/api/users/${id}/follow`, config);
                setIsFollowing(false);
            } else {
                await axios.post(`${API}/api/users/${id}/follow`, {}, config);
                setIsFollowing(true);
            }
        } catch (err) { alert(err.response?.data?.message || 'فشل العملية'); }
    };

    // ✅ دالة فتح المودال وتعبئة البيانات
    const handleOpenEdit = () => {
        setEditForm({
            name: profileData.user.name,
            bio: profileData.user.bio || '',
            gender: profileData.user.gender || ''
        });
        setShowEditModal(true);
    };

    // ✅ دالة حفظ التعديلات النصية
    const handleSaveProfile = async () => {
        try {
            const res = await axios.put(`${API}/api/users/update-profile`, editForm, config);
            setProfileData({ ...profileData, user: { ...profileData.user, ...res.data.user } });
            
            // تحديث اللوكال ستورج ليعكس الاسم الجديد في كل الموقع
            const updatedUser = { ...currentUser, name: res.data.user.name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setShowEditModal(false);
            alert("تم تحديث بياناتك بنجاح! ✨");
        } catch (err) { alert("فشل تحديث البيانات"); }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const res = await axios.put(`${API}/api/users/update-avatar`, formData, config);
            setProfileData(prev => ({ ...prev, user: { ...prev.user, avatar: res.data.avatar } }));
            const updatedUser = { ...currentUser, avatar: res.data.avatar };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) { alert("فشل تحديث الصورة"); }
        finally { setUploading(false); }
    };

    // Confirm modal flow for deleting a post from profile
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState(null);

    const handleDeletePost = (postId) => {
        setConfirmTarget(postId);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!confirmTarget) return setConfirmOpen(false);
        try {
            await axios.delete(`${API}/api/posts/${confirmTarget}`, config);
            setProfileData(prev => ({ ...prev, posts: (prev.posts || []).filter(p => p.id !== confirmTarget) }));
        } catch (err) {
            alert(err.response?.data?.message || 'فشل حذف المنشور');
        } finally {
            setConfirmOpen(false);
            setConfirmTarget(null);
        }
    }; 

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <Loader className="animate-spin text-najah-primary mb-4" size={48} />
            <p className="text-gray-500 font-bold italic font-sans">جاري جلب أرشيف المهندس...</p>
        </div>
    );

    const isProfileOwner = profileData.user.universityId === '0000';
    const isMyProfile = currentUser.id === profileData.user.id;
    const totalLikes = profileData.posts.reduce((acc, post) => acc + (post.Likes?.length || 0), 0);

    return (
        <div className="min-h-screen bg-white relative font-sans">
            <Navbar user={currentUser} />
            
            <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 flex-col lg:flex-row">
                
                {/* 1. السايد بار الجانبي (مُحذوف — Sidebar يظهر فقط في الهوم والمجتمعات) */}

                {/* 2. المنطقة المركزية */}
                <div className="flex-1 space-y-6">
                    
                    {/* كرت البروفايل العلوي */}
                    <div className={`card-bg rounded-3xl shadow-sm border overflow-hidden ${isProfileOwner ? 'border-yellow-400/30 shadow-yellow-100' : 'border-gray-100'}`}> 
                        <div className={`${isProfileOwner ? 'owner-banner h-44 relative overflow-hidden' : 'h-40 bg-gradient-to-r from-najah-primary to-teal-600'}`}>
                            {isProfileOwner && (
                                <>
                                    <div className="owner-banner-crown absolute top-3 left-4 hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-yellow-50 font-bold shadow-lg">
                                        <Crown size={18} className="text-yellow-300" />
                                        <span className="text-xs uppercase tracking-wider">SYSTEM OWNER</span>
                                    </div>
                                    <div className="owner-banner-sparkles" aria-hidden></div>
                                </>
                            )}
                        </div>
                        
                        <div className="px-8 pb-8 text-right">
                            <div className="relative -mt-20 mb-4 flex justify-between items-end flex-row-reverse">
                                
                                <div className={`relative group rounded-full p-1.5 shadow-xl transition-transform hover:scale-105
                                    ${isProfileOwner ? 'owner-frame' : 'card-bg'}`}
                                >
                                    <div className="w-36 h-36 rounded-full border-4 border-white overflow-hidden bg-gray-200 relative">
                                        {profileData.user.avatar ? <img src={profileData.user.avatar} className="w-full h-full object-cover" alt="profile" /> : <UserIcon size={64} className="m-auto mt-10 text-gray-400" />}
                                        {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin text-white" size={32} /></div>}
                                    </div>
                                    {isMyProfile && (
                                        <label className="absolute bottom-1 right-1 card-bg p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-gray-100 group-hover:scale-110">
                                            <Camera size={20} className="text-najah-primary" />
                                            <input type="file" hidden onChange={handleAvatarChange} accept="image/*" />
                                        </label>
                                    )}
                                                                {!isMyProfile && (
                                                                    <button onClick={toggleFollow} className={`px-4 py-2 rounded-xl text-sm font-bold ${isFollowing ? 'bg-gray-200' : 'bg-najah-primary text-white'}`}>{isFollowing ? 'متابع' : 'متابعة'}</button>
                                                                )}
                                </div>

                                {isMyProfile && (
                                    <button 
                                        onClick={handleOpenEdit}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
                                    >
                                        <Edit3 size={16} /> تعديل البيانات
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 justify-start flex-row-reverse">
                                <h2 className={`text-3xl font-bold ${isProfileOwner ? 'text-amber-800' : 'text-gray-800'}`}>{profileData.user.name}</h2>
                                {isProfileOwner && <span className="owner-label text-xs px-3 py-1 rounded-full font-black">SYSTEM OWNER</span>}
                            </div>

                            <div className="mt-3 text-right">
                                {profileData.user.bio ? (
                                    <p className="text-gray-600 max-w-xl line-clamp-3 leading-relaxed mr-auto">{profileData.user.bio}</p>
                                ) : (
                                    <p className="text-gray-400 text-sm italic">لا توجد نبذة شخصية متاحة حالياً.</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 mt-6 text-gray-500 text-sm font-medium justify-start flex-row-reverse">
                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                    <Hash size={16} className="text-gray-400"/> {profileData.user.universityId}
                                </span>
                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                    <Calendar size={16} className="text-gray-400"/> دفعة {profileData.user.batch}
                                </span>
                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                    <UserCircle size={16} className="text-gray-400"/> 
                                    الجنس: {profileData.user.gender === 'male' ? 'ذكر 👨' : profileData.user.gender === 'female' ? 'أنثى 👩' : 'غير محدد 👤'}
                                </span>
                            </div>

                            {/* Like (heart) button and count */}
                            <div className="mt-4 flex items-center gap-3 justify-start flex-row-reverse px-1">
                                <button onClick={toggleLike} aria-pressed={likedByMe} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition ${likedByMe ? 'bg-red-100 text-red-600 shadow-sm scale-105' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                                    <Heart size={16} className={`heart-pop ${likedByMe ? 'liked fill-red-500 text-red-600' : 'text-gray-400'}`} /> <span>{likesCount}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-2 flex-row-reverse text-right px-1">
                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-3 flex-row-reverse">📂 أرشيف المنشورات <span className="bg-najah-primary/10 text-najah-primary px-3 py-1 rounded-full text-sm font-black">{profileData.posts.length}</span></h3>
                    </div>
                    
                    <div className="space-y-4">
                        {profileData.posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} onDelete={handleDeletePost} />)}
                        {profileData.posts.length === 0 && <div className="text-center py-20 card-bg rounded-3xl border border-dashed border-gray-200"><p className="text-gray-400 font-medium font-sans">لا توجد منشورات بعد.</p></div>}
                    </div>
                </div>

                {/* 3. العمود الجانبي الأيسر (الإحصائيات والمساعد) */}
                <div className="hidden lg:block w-72 shrink-0">
                    <div className="sticky top-24 space-y-4">
                        
                        {/* كرت الإحصائيات */}
                        <div className="card-bg rounded-2xl p-6 border border-gray-100 shadow-sm text-right">
                            <h4 className="font-bold text-gray-800 mb-4 border-b pb-2 text-sm flex items-center justify-end gap-2">إحصائيات النشاط <Heart size={14} className="text-red-500 fill-current"/></h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center flex-row-reverse">
                                    <span className="text-gray-500 text-sm">إجمالي المنشورات</span>
                                    <span className="font-bold text-najah-primary">{profileData.posts.length}</span>
                                </div>
                                <div className="flex justify-between items-center flex-row-reverse">
                                    <span className="text-gray-500 text-sm">التفاعلات المستلمة</span>
                                    <span className="font-bold text-red-500">{totalLikes} ❤️</span>
                                </div>
                            </div>
                        </div>

                        {/* كرت المساعد الذكي */}
                        <div className="bg-gradient-to-br from-najah-primary to-teal-700 rounded-2xl shadow-lg p-6 text-white text-center">
                            <Bot size={32} className="mx-auto mb-4 text-white/80" />
                            <h3 className="font-bold mb-2 text-sm">مساعد Najah Hub الذكي</h3>
                            <button onClick={() => navigate('/home')} className="bg-gray-50 text-najah-primary px-4 py-2 rounded-lg text-xs font-bold w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-md">اسأل المساعد</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ مودال التعديل الاحترافي */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="card-bg rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in text-right" dir="rtl">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-800">تعديل الملف الشخصي</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">الاسم الكامل</label>
                                <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-najah-primary outline-none transition" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">النبذة الشخصية (Bio)</label>
                                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-28 resize-none outline-none focus:ring-2 focus:ring-najah-primary transition" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="أخبر الطلاب بشيء عنك..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">الجنس</label>
                                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-najah-primary transition cursor-pointer appearance-none" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} required>
                                    <option value="">اختر الجنس</option>
                                    <option value="male">ذكر 👨</option>
                                    <option value="female">أنثى 👩</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button onClick={handleSaveProfile} className="flex-1 bg-najah-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-md transition"><Check size={18}/> حفظ التعديلات</button>
                            <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-50 text-gray-600 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDialog open={confirmOpen} title="تأكيد حذف المنشور" message="هل تريد حذف هذا المنشور نهائياً؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
        </div>
    );
};

export default Profile;