import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users, Heart } from 'lucide-react';

const CommunityCard = ({ community, membersCount = 0, isMember, memberRole = null, onJoin, onLeave }) => {
  return (
    <div className="card-bg rounded-3xl overflow-hidden transform hover:scale-101 transition duration-300 border border-transparent">
      <div className="h-40 bg-black/5 overflow-hidden relative border-b border-orange-300/10">
        {community.coverUrl ? (
          <img src={community.coverUrl} alt={community.name} className="w-full h-full object-cover opacity-95" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-black opacity-40">🔥</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
      </div>

      <div className="p-4 text-right">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Link to={`/communities/${community.id}`} className="block">
              <h3 className="text-xl font-extrabold tracking-tight text-gray-800 hover:underline">{community.name}</h3>
            </Link>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {community.batch ? <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-mono text-gray-700 border border-gray-100">دفعة {community.batch}</span> : null}
              <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-mono text-gray-700 border border-gray-100">{community.privacy}</span>
              <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-mono text-gray-700 border border-gray-100 flex items-center gap-2"><Users size={12}/> {membersCount}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mt-3">{community.description || 'مجتمع نابض بالنشاط — انضم وشارك مواردك!'}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {memberRole === 'admin' && <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-black border border-amber-200">أدمن</span>}
            <Link to={`/communities/${community.id}`} className="text-sm card-bg border px-3 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700">فتح</Link>
            <div>
              {isMember ? (
                <button onClick={onLeave} className="mt-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold shadow-sm hover:bg-gray-200 transition flex items-center gap-2"><Heart size={14}/> مغادرة</button>
              ) : (
                <button onClick={onJoin} className="mt-2 bg-najah-primary text-white px-3 py-1 rounded-full font-semibold shadow-sm hover:opacity-95 transition flex items-center gap-2"><UserPlus size={14}/> انضم</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;
