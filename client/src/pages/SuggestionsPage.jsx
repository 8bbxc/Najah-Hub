import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

export default function SuggestionsPage() {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});

  const [form, setForm] = useState({ title: '', category: 'suggestion', description: '' });

  // dummy posts for now
  const [posts, setPosts] = useState([
    { id: 1, title: 'تحديث واجهة المحادثة', category: 'suggestion', description: 'اقتراح تحسين تجربة الدردشة وتثبيت الرسائل المهمة.', upvotes: 12, downvotes: 2, userVote: 0, author: 'مستخدم1', createdAt: Date.now() - 1000 * 60 * 60 },
    { id: 2, title: 'عطل في تحميل الصور', category: 'bug', description: 'الصورة لا تظهر بعد الرفع أحياناً.', upvotes: 5, downvotes: 7, userVote: 0, author: 'مستخدم2', createdAt: Date.now() - 1000 * 60 * 30 },
    { id: 3, title: 'اقتراح إضافة وسم جديد', category: 'suggestion', description: 'أن نضيف تصنيف للمواضيع التعليمية.', upvotes: 8, downvotes: 1, userVote: 0, author: 'مستخدم3', createdAt: Date.now() - 1000 * 60 * 10 },
  ]);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  }, [posts]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    const next = {
      id: Date.now(),
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      upvotes: 0,
      downvotes: 0,
      userVote: 0,
      author: user?.name || 'مجهول',
      createdAt: Date.now(),
    };
    setPosts([next, ...posts]);
    setForm({ title: '', category: 'suggestion', description: '' });
  };

  const toggleUpvote = (id) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      if (p.userVote === 1) {
        return { ...p, userVote: 0, upvotes: Math.max(0, p.upvotes - 1) };
      }
      if (p.userVote === -1) {
        return { ...p, userVote: 1, upvotes: p.upvotes + 1, downvotes: Math.max(0, p.downvotes - 1) };
      }
      return { ...p, userVote: 1, upvotes: p.upvotes + 1 };
    }));
  };

  const toggleDownvote = (id) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      if (p.userVote === -1) {
        return { ...p, userVote: 0, downvotes: Math.max(0, p.downvotes - 1) };
      }
      if (p.userVote === 1) {
        return { ...p, userVote: -1, downvotes: p.downvotes + 1, upvotes: Math.max(0, p.upvotes - 1) };
      }
      return { ...p, userVote: -1, downvotes: p.downvotes + 1 };
    }));
  };

  const handleDelete = (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاقتراح؟')) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
              <h2 className="font-bold text-lg mb-2">الاقتراحات وإبلاغ عن الأخطاء</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">أرسل أفكارًا لتحسين التطبيق أو أبلغ عن الأخطاء التي تجدها.</p>

              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">العنوان</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">التصنيف</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 text-sm">
                    <option value="suggestion">اقتراح</option>
                    <option value="bug">خطأ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 text-sm min-h-[120px]" />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white dark:bg-blue-600 hover:opacity-90">إرسال</button>
                </div>
              </form>
            </div>

            <div className="space-y-3">
              {sortedPosts.map((post) => (
                <div key={post.id} className="flex gap-4 items-start bg-white dark:bg-gray-800 border rounded-lg p-3 hover:shadow-md transition">
                  <div className="flex flex-col items-center w-12 text-center">
                    <button onClick={() => toggleUpvote(post.id)} className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition ${post.userVote === 1 ? 'text-green-500' : 'text-gray-400 dark:text-gray-300'}`}>
                      <ArrowUp />
                    </button>
                    <div className="text-sm font-bold mt-1">{post.upvotes - post.downvotes}</div>
                    <button onClick={() => toggleDownvote(post.id)} className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition ${post.userVote === -1 ? 'text-red-500' : 'text-gray-400 dark:text-gray-300'}`}>
                      <ArrowDown />
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold hover:text-blue-800 dark:hover:text-blue-400 cursor-pointer">{post.title}</h3>
                        <div className="text-xs mt-1 text-gray-500 dark:text-gray-300">{post.author} • {new Date(post.createdAt).toLocaleString()}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{post.category === 'bug' ? 'خطأ' : 'اقتراح'}</span>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDelete(post.id)} className="text-gray-400 hover:text-red-500 transition">
                            <Trash2 />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{post.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
              <h4 className="font-bold">كيف يعمل</h4>
              <p className="text-sm text-gray-500 dark:text-gray-300">يمكن للجميع إرسال أفكار أو الإبلاغ عن مشكلات. تساعد الأصوات في تحديد الأولويات.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
              <h4 className="font-bold">نصائح</h4>
              <ul className="text-sm text-gray-500 dark:text-gray-300 list-disc list-inside space-y-2">
                <li>كن محددًا في الوصف.</li>
                <li>أضف خطوات إعادة الإنتاج عند الإبلاغ عن الأخطاء.</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 text-center">
              <Link to="/home" className="text-sm text-najah-primary hover:underline">العودة إلى الصفحة الرئيسية</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
