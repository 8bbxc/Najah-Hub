import React from 'react';
import { Crown } from 'lucide-react';

const MessageBubble = ({ isOwner, avatar, name, role, message, timestamp }) => {
  return (
    <div className={`flex items-end gap-4 mb-4 ${isOwner ? 'justify-end' : 'justify-start'}`}>
      {!isOwner && (
        <img
          src={avatar || '/path-to-placeholder-avatar.jpg'}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border-2 border-transparent"
        />
      )}
      <div
        className={`p-4 rounded-lg max-w-xs text-sm shadow-md ${
          isOwner
            ? 'bg-[#005c4b] text-white self-end'
            : 'bg-[#202c33] text-white self-start'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <p className="font-bold">
            {name} {role === 'Owner' && <Crown size={14} className="text-yellow-500 inline" />}
          </p>
          <span className="text-xs text-gray-300">{timestamp}</span>
        </div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default MessageBubble;