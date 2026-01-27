import React from 'react';
import { Crown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_AVATAR = '/images/default-avatar.png';

export default function MessageItem({ m, currentUser = {}, communityCreatorId, GENERIC_AVATAR = DEFAULT_AVATAR, onDelete }) {
  const navigate = useNavigate();
  const senderId = m.userId ?? m.senderId ?? (m.sender && (m.sender.id || m.sender._id)) ?? null;
  const user = m.user || m.sender || {};
  const isMe = String(senderId) === String(currentUser?.id);

  // Owner detection: explicit id #0000, role Owner, or communityCreatorId match
  const isOwner = String(user.id) === '#0000' || ((user.role || '').toString().toLowerCase() === 'owner') || (String(senderId) === String(communityCreatorId));

  const resolvedName = m.name || user.name || `User ${senderId}`;
  // Always show user's profile picture when available; fallback to GENERIC_AVATAR
  const resolvedAvatar = (user && (user.profilePic || user.avatar)) ? (user.profilePic || user.avatar) : GENERIC_AVATAR;

  // delete permission
  const role = (currentUser.role || '').toString().toLowerCase();
  // Allow message author, admins/owners, or system owner (universityId === '0000') to delete
  const canDelete = currentUser && (
    String(currentUser.id) === String(senderId) ||
    ['admin', 'owner'].includes(role) ||
    String(currentUser.universityId) === '0000'
  );

  // Bubble classes
  const baseBubble = 'rounded-lg px-4 py-2 max-w-[72%] shadow break-words';
  const bubbleMe = 'bg-[#005c4b] text-white dark:bg-[#005c4b]';
  const bubbleMeLight = 'bg-[#d9fdd3] text-black';
  const bubbleOther = 'bg-[#202c33] text-white dark:bg-[#202c33]';
  const bubbleOtherLight = 'bg-white text-black';

  const bubbleClass = isMe
    ? `${baseBubble} ${bubbleMeLight} dark:${bubbleMe}`
    : `${baseBubble} ${bubbleOtherLight} dark:${bubbleOther}`;

  // Owner special styling
  const ownerBubbleExtra = isOwner ? 'border-2 border-yellow-400 dark:from-yellow-800 dark:to-yellow-600' : '';

  return (
    <div className={`group relative flex items-end gap-2 mb-4 ${isMe ? 'justify-end' : 'justify-start'}`} dir="rtl">
      {!isMe && (
        <img
          src={resolvedAvatar || GENERIC_AVATAR}
          alt={resolvedName}
          onClick={() => navigate(`/profile/${senderId}`)}
          className={`w-10 h-10 rounded-full object-cover cursor-pointer ${isOwner ? 'ring-2 ring-yellow-400' : ''}`}
          onError={(e) => { e.currentTarget.src = GENERIC_AVATAR; }}
        />
      )}

      <div className="flex flex-col">
        <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <div className="text-[12px] leading-none" style={{ backgroundColor: 'transparent' }}>
            <span className={`${isOwner ? 'text-yellow-400 font-bold' : 'text-gray-300 font-semibold'}`} style={{ backgroundColor: 'transparent' }}>{resolvedName}</span>
            {isOwner && <Crown size={14} className="inline-block mr-1 text-yellow-400" />}
          </div>
        </div>

        <div className={`${bubbleClass} ${ownerBubbleExtra} ${isMe ? 'self-end' : 'self-start'}`} style={{ backgroundClip: 'padding-box' }}>
          <p className="msg-text leading-relaxed" style={{ backgroundColor: 'transparent' }}>{m.text}</p>

          {m.attachments && m.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {m.attachments.map((a, idx) => (
                <img key={idx} src={a} alt={`att-${idx}`} className="w-28 h-20 object-cover rounded cursor-pointer" onClick={() => { /* preview handled by parent */ }} onError={(e) => { e.currentTarget.src = GENERIC_AVATAR; }} />
              ))}
            </div>
          )}

          <div className="mt-2 text-xs text-gray-400" style={{ backgroundColor: 'transparent' }}>{new Date(m.createdAt).toLocaleString()}</div>
        </div>
      </div>

      {isMe && (
        <img
          src={resolvedAvatar || GENERIC_AVATAR}
          alt={resolvedName}
          onClick={() => navigate(`/profile/${senderId}`)}
          className={`w-10 h-10 rounded-full object-cover cursor-pointer ${isOwner ? 'ring-2 ring-yellow-400' : ''}`}
          onError={(e) => { e.currentTarget.src = GENERIC_AVATAR; }}
        />
      )}

      {/* Delete action (hover) */}
      {canDelete && (
        <button
          onClick={() => onDelete && onDelete(m.id)}
          className="absolute -top-2 z-30 hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white hover:bg-red-700"
          title="حذف الرسالة"
          style={{ left: isMe ? 'auto' : '-36px', right: isMe ? '-36px' : 'auto' }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
