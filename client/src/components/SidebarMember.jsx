import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';

const DEFAULT_AVATAR = '/images/default-avatar.png';

export default function SidebarMember({ user = {}, onSettings, onRemove, onAdd, defaultAvatar = DEFAULT_AVATAR }) {
  const navigate = useNavigate();
  const avatarHidden = user.settings && user.settings.hideAvatar === true;
  const avatarSrc = (!avatarHidden && (user.profilePic || user.avatar)) ? (user.profilePic || user.avatar) : defaultAvatar;
  const isOwner = String(user.id) === '#0000' || ((user.role || '').toString().toLowerCase() === 'owner');

  return (
    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-[#253335] transition-colors">
      <img
        src={avatarSrc}
        alt={user?.name || 'avatar'}
        onClick={() => navigate(`/profile/${user?.id}`)}
        className={`w-12 h-12 rounded-full object-cover cursor-pointer ${isOwner ? 'ring-2 ring-yellow-400' : ''}`}
        onError={(e) => { e.currentTarget.src = defaultAvatar; }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`font-semibold truncate ${isOwner ? 'text-yellow-400' : 'text-black dark:text-white'}`}>{user?.name || 'No Name'}</p>
            {isOwner && <Crown size={14} className="text-yellow-400" />}
            <span className="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-transparent text-gray-700 dark:text-gray-300">
              {user?.role || 'Member'}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => onAdd && onAdd(user?.id)}
              className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              aria-label="add"
            >
              أضف
            </button>

            <button
              onClick={() => onSettings && onSettings(user?.id)}
              className="text-sm px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              aria-label="settings"
            >
              إعدادات
            </button>

            <button
              onClick={() => onRemove && onRemove(user?.id)}
              className="text-sm px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
              aria-label="remove"
            >
              إزالة
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">عضو في المجموعة</div>
      </div>
    </div>
  );
}
