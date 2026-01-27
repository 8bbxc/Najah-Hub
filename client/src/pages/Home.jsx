import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard'; 
import AnnouncementBox from '../components/AnnouncementBox';
import ReactMarkdown from 'react-markdown';
import ConfirmDialog from '../components/ConfirmDialog';
import { Send, Loader, Bot, X, Paperclip, FileText, Image as ImageIcon, Search, Filter, SortDesc, UserCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom'; 

const Home = () => {
  // ✅ جلب بيانات المستخدم المحدثة مباشرة لضمان ظهور الصورة والاسم فوراً
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');
  
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userNameQuery, setUserNameQuery] = useState(''); 
  const [filterType, setFilterType] = useState(''); 
  const [sortBy, setSortBy] = useState('newest'); 

  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [previews, setPreviews] = useState([]); 
  const [uploadedFiles, setUploadedFiles] = useState([]); // ملفات مرفوعة مسبقاً (روابط من السيرفر)
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // AI States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // ✅ تحديث بيانات المستخدم في حال حدوث تغيير في التخزين المحلي
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [filterType, sortBy]); 

  useEffect(() => {
    const handler = () => fetchPosts();
    window.addEventListener('postsChanged', handler);
    return () => window.removeEventListener('postsChanged', handler);
  }, [filterType, sortBy, searchQuery, userNameQuery]); 

  const fetchPosts = async (e) => {
    if (e) e.preventDefault(); 
    setIsRefreshing(true);
    try {
      const res = await axios.get(
        `${API}/api/posts?search=${searchQuery}&userName=${userNameQuery}&type=${filterType}&sortBy=${sortBy}`, 
        config
      );
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // نرفع الملفات فوراً للسيرفر للحصول على روابط ثابتة للمعاينة
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    (async () => {
      try {
        const res = await axios.post(`${API}/api/posts/upload`, formData, config);
        // res.data should be an array of uploaded file info
        const uploaded = res.data.map(u => ({ url: u.url, fileType: u.fileType, name: u.originalName || u.originalname || u.original_name || '' }));
        setUploadedFiles(prev => [...prev, ...uploaded.map((u) => ({ ...u }))]);
        const newPreviews = uploaded.map(u => ({ url: u.url, type: u.fileType, name: u.name }));
        setPreviews(prev => [...prev, ...newPreviews]);
      } catch (err) {
        console.error('Upload error', err);
        alert('فشل رفع الملف، حاول مرة أخرى');
      }
    })();

    e.target.value = '';
  };

  const removeFile = (index) => {
    // إزالة المعاينة والملف المرفوع المتوافق
    const newPreviews = [...previews];
    const newUploaded = [...uploadedFiles];
    newPreviews.splice(index, 1);
    newUploaded.splice(index, 1);
    setPreviews(newPreviews);
    setUploadedFiles(newUploaded);
  };

  const handlePostSubmit = async () => {
    if (!content.trim() && uploadedFiles.length === 0) return;
    setLoading(true);
    try {
      // نرسل المحتوى مع مصفوفة المرفقات (روابط) بدل رفعها مجدداً
      const body = {
        content,
        attachments: JSON.stringify(uploadedFiles)
      };
      const res = await axios.post(`${API}/api/posts`, body, config);
      setPosts([res.data, ...posts]);
      setContent('');
      setPreviews([]);
      setUploadedFiles([]);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء النشر');
    } finally {
      setLoading(false);
    }
  };

  // Confirm modal flow for deleting a post
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
      setPosts(posts.filter((p) => p.id !== confirmTarget));
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الحذف');
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/api/ai/ask`, { prompt: aiPrompt }, config);
      setAiResponse(res.data.answer);
      // emit global event so other components (e.g., chat input) can receive the AI text
      try {
        window.dispatchEvent(new CustomEvent('aiGenerated', { detail: { text: res.data.answer } }));
      } catch (e) {}
    } catch (err) {
      setAiResponse('عذراً، حدث خطأ في التواصل مع الذكاء الاصطناعي.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative font-sans">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 flex-col lg:flex-row">
        <div className="hidden lg:block w-64 shrink-0 lg:-ml-12 lg:mr-[19px]">
          <Sidebar />
        </div>

        <div className="flex-1 space-y-6">
          
          {/* شريط البحث والفلترة المطور */}
          <div className="card-bg rounded-xl shadow-sm p-4 border border-gray-100 space-y-4">
            <form onSubmit={fetchPosts} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="ابحث في المحتوى..." 
                  className="w-full bg-gray-50 rounded-lg pl-10 pr-4 py-2 border border-transparent focus:border-najah-primary outline-none transition text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="اسم الشخص..." 
                  className="w-full bg-gray-50 rounded-lg pl-10 pr-4 py-2 border border-transparent focus:border-najah-primary outline-none transition text-sm"
                  value={userNameQuery}
                  onChange={(e) => setUserNameQuery(e.target.value)}
                />
              </div>

              <div className="relative">
                <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                  className="w-full bg-gray-50 rounded-lg pl-10 pr-4 py-2 border border-transparent focus:border-najah-primary outline-none transition text-sm appearance-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">الأحدث أولاً</option>
                  <option value="oldest">الأقدم أولاً</option>
                </select>
              </div>

              <button type="submit" className="bg-najah-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-sm flex items-center justify-center gap-2">
                {isRefreshing ? <RefreshCw size={18} className="animate-spin"/> : "تطبيق البحث"}
              </button>
            </form>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t pt-3">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1 shrink-0">
                <Filter size={14} /> تصفية سريعة:
              </span>
              <button onClick={() => setFilterType('')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${filterType === '' ? 'bg-najah-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>الكل</button>
              <button onClick={() => setFilterType('images')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${filterType === 'images' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>📸 الصور</button>
              <button onClick={() => setFilterType('files')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${filterType === 'files' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>📂 الملفات</button>
            </div>
          </div>

          {/* صندوق النشر المطور مع صورة البروفايل */}
          <div className="card-bg rounded-xl shadow-sm p-4 border border-gray-100">
            {/* Announcement (system) - only on Home center column */}
            {/* Note: appears above the post composer */}
            <div className="mb-4">
              <AnnouncementBox />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-najah-primary/20 bg-gray-100 flex items-center justify-center shadow-sm">
                {user?.avatar ? (
                  <img src={user.avatar} alt="my-profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400">
                    <UserCircle size={32} />
                  </div>
                )}
              </div>
              <div className="w-full">
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`شاركنا ملفاتك وعلمك يا ${user?.name?.split(' ')[0] || "مستخدم"}...`}
                  className="w-full bg-gray-50 rounded-lg p-3 resize-none focus:outline-none min-h-[80px] text-sm"
                ></textarea>

                {previews.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {previews.some(f => f.type.startsWith('image')) && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {previews.map((file, index) => (
                          file.type.startsWith('image') && (
                            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 h-24">
                              <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                              <button onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition shadow-sm">
                                <X size={12} />
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                    {previews.some(f => !f.type.startsWith('image')) && (
                      <div className="space-y-2">
                        {previews.map((file, index) => (
                          !file.type.startsWith('image') && (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg group text-right" dir="rtl">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={18} className="text-red-500 shrink-0" />
                                <span className="text-sm text-gray-700 truncate font-medium">{file.name}</span>
                              </div>
                              <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-red-500 transition">
                                <X size={16} />
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-3">
              <div className="flex gap-3">
                <input type="file" hidden ref={imageInputRef} onChange={handleFileChange} multiple accept="image/*" />
                <button onClick={() => imageInputRef.current.click()} className="flex items-center gap-2 text-gray-600 hover:text-green-600 bg-gray-50 px-3 py-2 rounded-lg transition border border-transparent hover:border-green-200 shadow-sm">
                  <ImageIcon size={18} className="text-green-500"/> <span className="text-sm font-bold">صور</span>
                </button>

                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} multiple accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.zip,.rar" />
                <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-gray-50 px-3 py-2 rounded-lg transition border border-transparent hover:border-blue-200 shadow-sm">
                  <Paperclip size={18} className="text-blue-500"/> <span className="text-sm font-bold">ملف</span>
                </button>
              </div>

              <button 
                onClick={handlePostSubmit} 
                disabled={loading || (!content.trim() && uploadedFiles.length === 0)} 
                className="bg-najah-primary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition disabled:opacity-50 shadow-md text-sm lg:text-base"
              >
                {loading ? <Loader className="animate-spin" size={18} /> : <Send size={18} className="text-white" />} نشر
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} currentUser={user} onDelete={handleDeletePost} />
              ))
            ) : (
              <div className="text-center py-20 card-bg rounded-xl border border-gray-100">
                <p className="text-gray-400 font-bold">لم يتم العثور على منشورات تطابق بحثك 🔍</p>
                <button onClick={() => {setSearchQuery(''); setUserNameQuery(''); setFilterType(''); setSortBy('newest'); fetchPosts();}} className="mt-4 text-najah-primary text-sm hover:underline">إعادة ضبط البحث</button>
              </div>
            )}
          </div>
        </div>

        {/* المساعد الذكي */}
        <div className="hidden lg:block w-72 shrink-0">
             <div className="sticky top-24">
                <div className="bg-gradient-to-br from-najah-primary to-teal-700 rounded-2xl shadow-lg p-6 text-white text-center">
                    <Bot size={32} className="mx-auto mb-4 text-white/80" />
                    <h3 className="font-bold mb-2">مساعدك الذكي</h3>
                    <button onClick={() => setShowAIModal(true)} className="bg-gray-50 text-najah-primary px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-md">تحدث مع المساعد</button>
                </div>

                <div className="mt-4 bg-white dark:bg-gray-800 border rounded-lg p-4 text-right">
                  <h4 className="font-bold text-lg mb-2">هل لديك ملاحظات؟</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">قدّم أفكارًا أو أبلغ عن أخطاء.</p>
                  <div className="flex gap-2">
                    <Link to="/suggestions" className="inline-block px-3 py-2 rounded bg-najah-primary text-white hover:opacity-90">اذهب إلى الاقتراحات</Link>
                    <Link to="/rating" className="inline-block px-3 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-blue-800 dark:hover:text-white transition-colors duration-150 home-rate-btn">قيم الموقع</Link>
                  </div>
                </div>
            </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="card-bg rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col p-4 shadow-2xl">
                  <div className="flex justify-between mb-4 items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Bot size={20} className="text-najah-primary"/> AI Assistant</h3>
                 <button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-red-500 transition"><X/></button>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl mb-4 p-4 overflow-y-auto border border-gray-100 shadow-inner text-right" dir="auto">
                 <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
              <div className="flex gap-2">
                 <input className="border border-gray-200 flex-1 rounded-lg px-4 py-2 focus:ring-2 focus:ring-najah-primary outline-none transition text-right" dir="rtl" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="اسأل المساعد عن أي شيء..." />
                 <button onClick={handleAskAI} className="bg-najah-primary text-white p-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                   {aiLoading ? <Loader className="animate-spin" size={20} /> : <Send size={20}/>}
                 </button>
              </div>
           </div>
        </div>
      )}

      <ConfirmDialog open={confirmOpen} title="تأكيد حذف المنشور" message="هل تريد حذف هذا المنشور نهائياً؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />

    </div>
  );
};

export default Home;