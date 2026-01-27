import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import SidebarMember from './SidebarMember';

const Sidebar = ({ members = null, onRemove, onSettings, showMembers = false }) => {
  const [showAd, setShowAd] = useState(() => {
    const hidden = localStorage.getItem('najah_hide_ad') === '1';
    return !hidden;
  });

  const dismissAd = () => {
    setShowAd(false);
    localStorage.setItem('najah_hide_ad', '1');
  };

  // fallback sample members when none passed
  const sample = [
    { id: 1, name: 'Eng. Yazan Saadeh', role: 'Owner', profilePic: '/path-to-avatar.jpg' },
    { id: 2, name: 'Ahmed Taleb', role: 'Member', profilePic: '/path-to-avatar.jpg' },
    { id: 3, name: 'John Doe', role: 'Member', profilePic: '' },
  ];

  const list = members || sample;

  return (
    <div className="w-64 bg-white dark:bg-[#202c33] text-black dark:text-white overflow-hidden hidden lg:flex flex-col max-h-[70vh] lg:fixed lg:right-10 lg:top-36 z-40 space-y-4 sidebar rounded-xl shadow-lg p-4">
      {/* إعلان جانبي قابل للإغلاق */}
      {showAd && (
        <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm p-3 relative ad-card">
          <button onClick={dismissAd} className="absolute top-2 left-2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
          <Link to="/subscribe" className="block text-right">
            <div className="rounded-lg overflow-hidden mb-2">
              <img src="/ad-placeholder.svg" alt="إعلان" className="w-full h-32 object-cover" />
            </div>
            <h4 className="font-bold text-gray-800 dark:text-white mb-1">عرض اشتراك مميز</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">احصل على ميزات إضافية للمجتمعات والدعم المباشر.</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-najah-primary font-bold">تعرف أكثر</span>
              <span className="text-xs text-gray-400">إعلان</span>
            </div>
          </Link>
        </div>
      )}

      {/* Members block: render only when explicitly requested by the page */}
      {showMembers ? (
        <div>
          <h2 className="text-lg font-bold mb-4">أعضاء المجتمع</h2>
          <ul className="space-y-2">
            {list.map((member) => (
              <li key={member.id}>
                <SidebarMember user={member} onRemove={onRemove} onSettings={onSettings} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Default helpful sidebar content when members are not shown */
        <div>
          <h2 className="text-lg font-bold mb-3">التصنيفات الشائعة</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {['البرمجة', 'الهندسة', 'التعليم', 'الذكاء-الاصطناعي', 'الدعم', 'الفعاليات'].map(tag => (
              <Link key={tag} to={`/search?tag=${encodeURIComponent(tag)}`} className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">#{tag}</Link>
            ))}
          </div>

          <h2 className="text-lg font-bold mb-3">روابط سريعة</h2>
          <ul className="space-y-2 mb-4">
            <li><Link to="/communities" className="text-sm text-najah-primary">جميع المجتمعات</Link></li>
            <li><Link to="/subscriptions" className="text-sm">الاشتراكات</Link></li>
            <li><Link to="/settings" className="text-sm">إعدادات الحساب</Link></li>
            <li><Link to="/help" className="text-sm">مساعدة/دليل الاستخدام</Link></li>
          </ul>

          <h2 className="text-lg font-bold mb-3">مجموعات رائجة</h2>
          <ul className="space-y-2">
            <li><Link to="/communities/1" className="block text-sm">مجتمع البرمجة</Link></li>
            <li><Link to="/communities/2" className="block text-sm">مجتمع المشاريع</Link></li>
            <li><Link to="/communities/3" className="block text-sm">مجتمع المناقشات</Link></li>
          </ul>
        </div>
      )}

      {/* 🆕 الفوتر بحقوقك */}
      <div className="mt-auto text-center border-t border-gray-200 dark:border-gray-700 pt-4 pb-2">
        <p className="text-xs text-gray-400">&copy; 2026 Najah Hub</p>
        <p className="text-xs font-bold text-najah-primary mt-1 font-mono dir-ltr">By: Eng. Yazan Saadeh</p>
      </div>
    </div>
  );
};

export default Sidebar;