import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; // ✅ إضافة السوكت
import { API, SOCKET } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { 
  Trash, MessageCircle, Heart, Share2, Crown, ShieldCheck, 
  Send, FileText, Download, ChevronDown, ChevronUp, Edit2, Check, X, MapPin 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { handleForceDownload } from '../utils/downloadHelper'; 

const PostCard = ({ post, currentUser, onDelete }) => {
  const [likes, setLikes] = useState(post.Likes || []);
  const [comments, setComments] = useState(post.Comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 250; 
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [postContent, setPostContent] = useState(post.content); 
  const [socket, setSocket] = useState(null); // ✅ حالة السوكت
  const navigate = useNavigate();

  const attachments = post.Attachments || [];
  const images = attachments.filter(att => att.fileType && att.fileType.startsWith('image'));
  const files = attachments.filter(att => att.fileType && !att.fileType.startsWith('image'));

  const isLiked = likes.some(like => like.userId === currentUser.id);
  const isOwner = currentUser?.id === post.userId;
  const isSystemAdmin = String(currentUser?.universityId).trim() === '0000';
  const postAuthorIsOwner = String(post.User?.universityId).trim() === '0000';
  const postAuthorIsDoctor = post.User?.role === 'doctor';

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  };

  const [pinned, setPinned] = useState(post.pinned || false);
  const [pinScopeState, setPinScopeState] = useState(post.pinScope || null);
  // ✅ إعداد السوكت لإرسال التنبيهات
  useEffect(() => {
    const newSocket = io(SOCKET || 'http://localhost:5001');
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // keep local pinned state in sync with prop updates (server/parent may reorder)
  useEffect(() => {
    setPinned(!!post.pinned);
    setPinScopeState(post.pinScope || null);
  }, [post.pinned, post.pinScope]);

  const handleUpdatePost = async () => {
    if (!editedContent.trim()) return;
    try {
      const res = await axios.put(`${API}/api/posts/${post.id}`, 
        { content: editedContent }, config
      );
      setPostContent(res.data.content); 
      setIsEditing(false);
    } catch (error) {
      alert("فشل تعديل المنشور");
    }
  };

  // ✅ دالة الإعجاب المحدثة لإرسال إشعار
  const handleLike = async () => {
    try {
      const res = await axios.put(`${API}/api/posts/${post.id}/like`, {}, config);
      if (res.data.status === 'added') {
        setLikes([...likes, { userId: currentUser.id }]);
        
        // ✅ إطلاق إشعار لحظي لصاحب المنشور
        if (socket && post.userId !== currentUser.id) {
          socket.emit("sendNotification", {
            senderName: currentUser.name,
            receiverId: post.userId,
            type: 'like'
          });
        }
      } else {
        setLikes(likes.filter(l => l.userId !== currentUser.id));
      }
    } catch (error) {
      console.error("Like error", error);
    }
  };

  // ✅ دالة إضافة تعليق المحدثة لإرسال إشعار
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await axios.post(`${API}/api/posts/${post.id}/comment`, { content: commentText }, config);
      setComments([...comments, res.data]);
      setCommentText('');

      // ✅ إطلاق إشعار لحظي لصاحب المنشور
      if (socket && post.userId !== currentUser.id) {
        socket.emit("sendNotification", {
          senderName: currentUser.name,
          receiverId: post.userId,
          type: 'comment'
        });
      }
    } catch (error) {
      console.error("Comment error", error);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar });

  return (
    <div className={`card-bg rounded-xl shadow-sm border p-4 mb-4 transition hover:shadow-md ${postAuthorIsOwner ? 'border-yellow-400/50 shadow-yellow-50 owner-post' : 'border-gray-100'}`}> 
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
             <div role="button" tabIndex={0} onClick={() => navigate(`/profile/${post.User?.id || post.userId}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/profile/${post.User?.id || post.userId}`); }} title={`عرض صفحة ${post.User?.name || 'المستخدم'}`} className={`cursor-pointer w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md relative 
                ${postAuthorIsOwner 
                    ? 'p-[3px] ring-2 ring-amber-300 owner-frame' 
                    : 'bg-gradient-to-tr from-green-600 to-teal-600'
                }`}
             >
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-100 relative">
                    { (post.User?.avatar || currentUser?.avatar) ? (
                        <img src={post.User?.avatar || currentUser?.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-lg">{post.User?.name?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
             </div>

             <div>
                <div className="flex items-center gap-2">
                   <h3 className={`font-bold text-sm ${postAuthorIsOwner ? 'text-amber-700' : 'text-gray-800'}`}>
                        {post.User?.name || "مستخدم"}
                   </h3>
                   {pinned && <span className="pinned-badge">{pinScopeState === 'global' ? 'مثبت (عالمي)' : 'مثبت'}</span>}
                   {postAuthorIsOwner && <span className="bg-gradient-to-r from-yellow-200 to-amber-300 text-amber-900 text-xs px-3 py-1 rounded-full font-extrabold shadow-lg owner-label flex items-center gap-2">OWNER</span>}
                   {postAuthorIsDoctor && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">دكتور</span>}
                </div>
                <span className="text-xs text-gray-500 block" dir="ltr">@{post.User?.universityId} • {timeAgo}</span>
             </div>
        </div>

        {(isOwner || isSystemAdmin || (post.userId === currentUser.id)) && (
          <div className="flex items-center gap-1">
            {isOwner && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition">
                    <Edit2 size={18} />
                </button>
            )}

            {/* Pin button: allowed for system admin (global) or profile owner for profile-scope pin */}
            {(isSystemAdmin || (post.userId === currentUser.id && window.location.pathname.startsWith('/profile/'))) && (
              <button onClick={async () => {
                try {
                  // optimistic
                  const prev = pinned;
                  const prevScope = pinScopeState;
                  setPinned(!prev);
                  setPinScopeState(isSystemAdmin ? 'global' : 'profile');
                  const res = await axios.post(`${API}/api/posts/${post.id}/pin`, {}, config);
                  if (res.data && res.data.post) {
                    setPinned(!!res.data.post.pinned);
                    setPinScopeState(res.data.post.pinScope);
                    // notify others to refresh feed/profile
                    window.dispatchEvent(new CustomEvent('postsChanged', { detail: { postId: post.id } }));
                  }
                } catch (err) {
                  // revert
                  setPinned(prev);
                  setPinScopeState(prevScope);
                  console.error('Pin error', err);
                  alert(err.response?.data?.message || 'فشل تغيير حالة التثبيت');
                }
              }} className={`text-gray-400 hover:text-amber-600 p-2 rounded-full hover:bg-amber-50 transition ${pinned ? 'text-amber-500' : ''}`} title={pinned ? (pinScopeState === 'global' ? 'مثبت عالمياً — إلغاء' : 'مثبت داخل الصفحة — إلغاء') : 'تثبيت'}>
                <MapPin size={16} />
              </button>
            )}

            <button onClick={() => onDelete(post.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition">
                <Trash size={18} />
            </button>
          </div>
        )}
      </div>

      {/* المحتوى النصي */}
      <div className="mb-4 text-gray-700 leading-relaxed text-sm whitespace-pre-wrap" dir="auto">
        {isEditing ? (
            <div className="animate-fade-in space-y-2">
                <textarea 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full bg-gray-50 border border-blue-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-100 focus:outline-none min-h-[100px] text-sm"
                />
                <div className="flex gap-2 justify-end">
                    <button onClick={() => {setIsEditing(false); setEditedContent(postContent);}} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        <X size={14}/> إلغاء
                    </button>
                    <button onClick={handleUpdatePost} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-najah-primary rounded-lg hover:bg-green-700 transition shadow-sm">
                        <Check size={14}/> حفظ
                    </button>
                </div>
            </div>
        ) : (
            <>
                {isExpanded || postContent.length <= MAX_LENGTH ? postContent : `${postContent.substring(0, MAX_LENGTH)}...`}
                {postContent.length > MAX_LENGTH && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-najah-primary font-bold text-xs mr-1 hover:underline inline-flex items-center gap-1">
                    {isExpanded ? <>عرض أقل <ChevronUp size={14}/></> : <>قراءة المزيد <ChevronDown size={14}/></>}
                </button>
                )}
            </>
        )}
      </div>

      {/* المرفقات (صور) */}
      {images.length > 0 && (
        <div className={`grid gap-2 mb-4 overflow-hidden rounded-xl border border-gray-100 ${images.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2 grid-cols-1'}`}>
          {images.map((img, idx) => (
            <div key={idx} className={`relative group ${images.length === 3 && idx === 0 ? 'col-span-2' : ''}`}>
              <img src={img.url} alt="post-attachment" className="w-full h-full object-cover max-h-96 hover:scale-[1.01] transition duration-300 cursor-pointer shadow-inner" onClick={() => window.open(img.url, '_blank')} />
            </div>
          ))}
        </div>
      )}

      {/* المرفقات (ملفات) */}
      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          {files.map((file, idx) => (
            <div key={idx} onClick={() => handleForceDownload(file.url, file.url.split('/').pop())} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition group border-l-4 border-l-red-500">
                <div className="bg-red-100 p-2 rounded-lg text-red-600 shadow-sm"><FileText size={20} /></div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-700 truncate">ملف مرفق {idx + 1}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-mono">{file.fileType?.split('/')[1] || 'DOC'}</p>
                </div>
                <Download size={18} className="text-gray-400 group-hover:text-najah-primary" />
            </div>
          ))}
        </div>
      )}
        
      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-2 select-none">
          <button onClick={handleLike} className={`flex items-center gap-2 transition-all text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
             <Heart size={20} className={`transition-transform ${isLiked ? 'fill-red-500 scale-110' : 'group-hover:scale-110'}`} /> 
             <span>{likes.length}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-500 hover:text-najah-primary transition-all text-sm font-medium">
             <MessageCircle size={20} /> <span>{comments.length}</span>
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-all text-sm font-medium">
            <Share2 size={20} /> <span className="hidden sm:inline">مشاركة</span>
          </button>
      </div>
      
      {/* قسم التعليقات */}
      {showComments && (
         <div className="mt-4 pt-4 border-t border-gray-50 animate-fade-in space-y-4">
             <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="اكتب تعليقاً..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-najah-primary"
                />
                <button type="submit" className="bg-najah-primary text-white p-2 rounded-lg hover:bg-green-700 transition">
                  <Send size={16} />
                </button>
             </form>
             
             {comments.map((comment, index) => (
                <div key={index} className="flex gap-3 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-najah-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {comment.User?.avatar ? <img src={comment.User.avatar} className="w-full h-full rounded-full object-cover" /> : comment.User?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 text-xs">{comment.User?.name}</p>
                        <p className="text-gray-600 leading-relaxed mt-1">{comment.content}</p>
                    </div>
                </div>
             ))}
         </div>
      )}
    </div>
  );
};

export default PostCard;