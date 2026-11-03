import React, { useState } from 'react';
import {
  X,
  Search,
  Users,
  MessageSquare,
  Phone,
  Video,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';

interface UsersDirectoryModalProps {
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onStartChat: (user: User) => void;
  onStartCall: (user: User, callType: 'video' | 'audio') => void;
}

export const UsersDirectoryModal: React.FC<UsersDirectoryModalProps> = ({
  users,
  currentUserId,
  onClose,
  onStartChat,
  onStartCall,
}) => {
  const [search, setSearch] = useState('');

  const otherUsers = users.filter((u) => u.id !== currentUserId);

  const filteredUsers = otherUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#111118] border-2 border-red-600/70 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#181822] border-b border-red-900/40">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              සාමාජික නාමාවලිය (Users Directory)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#0d0d12] border-b border-neutral-900">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="යූසර් නම හෝ දුරකථන අංකයෙන් සොයන්න..."
              className="w-full pl-9 pr-4 py-2 bg-[#14141c] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              {search ? 'සොයන සාමාජිකයා හමු නොවීය.' : 'තවමත් සාමාජිකයින් ලියාපදිංචි වී නැත.'}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isOnline = user.status === 'online' || user.status === 'in-call';
              return (
                <div
                  key={user.id}
                  className="p-3 rounded-2xl bg-[#14141c] border border-neutral-800/80 hover:border-red-900/60 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover border border-neutral-700"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${
                          isOnline ? 'bg-emerald-500' : 'bg-neutral-600'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {user.name}
                        </span>
                        {user.isVerified && (
                          <span className="flex items-center gap-0.5 text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold shadow-[0_0_8px_rgba(37,99,235,0.7)]">
                            <CheckCircle className="w-2.5 h-2.5" />
                            VERIFIED
                          </span>
                        )}
                        {user.customBadge && (
                          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-600/50 px-1.5 py-0.2 rounded font-bold">
                            {user.customBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {user.phone}
                      </div>
                      {user.bio && (
                        <div className="text-[10px] text-neutral-500 truncate max-w-[200px]">
                          {user.bio}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        onStartChat(user);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition cursor-pointer"
                      title="චැට් කරන්න"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Message</span>
                    </button>
                    <button
                      onClick={() => {
                        onStartCall(user, 'audio');
                        onClose();
                      }}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition cursor-pointer"
                      title="Audio Call"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => {
                        onStartCall(user, 'video');
                        onClose();
                      }}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition cursor-pointer"
                      title="Video Call"
                    >
                      <Video className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
