import React from 'react';
import MessageBubble from './MessageBubble';

const ChatLayout = () => {
  return (
    <div className="flex h-screen">
      {/* Chat Window */}
      <div className="flex flex-col flex-1 bg-gray-100 dark:bg-[#111b21]">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#202c33] shadow-md">
          <div className="flex items-center gap-4">
            <img
              src="/path-to-community-avatar.jpg"
              alt="Community Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Community Name</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active now</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-[url('/path-to-pattern.png')] bg-cover">
          <MessageBubble
            isOwner={true}
            avatar="/path-to-avatar.jpg"
            name="Eng. Yazan Saadeh"
            role="Owner"
            message="Hi there!"
            timestamp="10:32 AM"
          />
          <MessageBubble
            isOwner={false}
            avatar="/path-to-avatar.jpg"
            name="Ahmed Taleb"
            role="Member"
            message="Hello!"
            timestamp="10:35 AM"
          />
        </div>

        {/* Chat Footer */}
        <div className="flex items-center p-4 bg-white dark:bg-[#202c33]">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2a3942] text-gray-800 dark:text-white focus:outline-none"
          />
          <button className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;