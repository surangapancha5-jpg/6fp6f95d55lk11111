import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Phone,
  Circle,
  Plus,
  Radio,
  Search,
  CheckCircle,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';
import { User, Group, StatusItem, CallLog } from '../types';

interface UserListSidebarProps {
  currentUser: User;
  users: User[];
  groups: Group[];
  statuses: StatusItem[];
  callLogs: CallLog[];
  activeConversations: User[];
  selectedTarget: { type: 'open' | 'direct' | 'group'; data?: any } | null;
  onSelectOpenChannel: () => void;
  onSelectDirectChat: (user: User) => void;
  onSelectGroupChat: (group: Group) => void;
  onOpenUsersDirectory: () => void;
  onOpenCreateGroup: () => void;
  onOpenCreateStatus: () => void;
  onViewStatus: (status: StatusItem) => void;
  onStartCall: (targetUser: User, callType: 'video' | 'audio') => void;
}

export const UserListSidebar: React.FC<UserListSidebarProps> = ({
  currentUser,
  users,
  groups,
  statuses,
  callLogs,
  activeConversations,
  selectedTarget,
  onSelectOpenChannel,
  onSelectDirectChat,
  onSelectGroupChat,
  onOpenUsersDirectory,
  onOpenCreateGroup,
  onOpenCreateStatus,
  onViewStatus,
  onStartCall,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'status' | 'calls'>('chats');
  const [search, setSearch] = useState('');

  // User's own status
  const myStatus = statuses.find((s) => s.userId === currentUser.id);
  const otherStatuses = statuses.filter((s) => s.userId !== currentUser.id);

  const getOtherUser = (id: string) => users.find((u) => u.id === id);

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col bg-[#0f0f15] border-r border-red-950/60 h-full select-none">
      {/* Top Bar with Users Button & Quick Actions */}
      <div className="p-3 bg-[#13131c] border-b border-red-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-wider text-red-500 uppercase">
            LK ONLINE
          </span>
          <span className="text-[10px] text-neutral-400">• WHATSAPP STYLE</span>
        </div>

        {/* Dedicated "Users" Button - Solves requirement: "අලුතෙන් එන යූසර්ලව මේන් ස්ක්රීන් එකේ පෙන්නන එපා. යූසර්ස් කියලා බොක්ස් එකක් හදලා ඒකෙනුයි දාන්න ඕන" */}
        <button
          onClick={onOpenUsersDirectory}
          className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 active:scale-95 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.4)] transition cursor-pointer"
          title="සියලු සාමාජිකයින් (Users Box)"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users බොක්ස් එක</span>
        </button>
      </div>

      {/* WhatsApp Style Navigation Tabs */}
      <div className="grid grid-cols-4 bg-[#0a0a0f] border-b border-neutral-900 text-center">
        <button
          onClick={() => setActiveTab('chats')}
          className={`py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer flex flex-col items-center gap-1 ${
            activeTab === 'chats'
              ? 'text-red-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>CHATS</span>
          {activeTab === 'chats' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_8px_#ef4444]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer flex flex-col items-center gap-1 ${
            activeTab === 'groups'
              ? 'text-red-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>GROUPS</span>
          {activeTab === 'groups' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_8px_#ef4444]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer flex flex-col items-center gap-1 ${
            activeTab === 'status'
              ? 'text-red-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className="relative">
            <Circle className="w-4 h-4" />
            {statuses.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </div>
          <span>STATUS</span>
          {activeTab === 'status' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_8px_#ef4444]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer flex flex-col items-center gap-1 ${
            activeTab === 'calls'
              ? 'text-red-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>CALLS</span>
          {activeTab === 'calls' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_8px_#ef4444]" />
          )}
        </button>
      </div>

      {/* Tab 1: CHATS (Only active/started conversations, not all random new users) */}
      {activeTab === 'chats' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Open Channel pinned card */}
          <div className="p-3 border-b border-neutral-900 bg-[#12121a]">
            <button
              onClick={onSelectOpenChannel}
              className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                selectedTarget?.type === 'open'
                  ? 'bg-gradient-to-r from-red-950 via-[#260f14] to-[#160b0f] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : 'bg-[#151520] hover:bg-[#1a1a28] border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-black flex items-center justify-center text-white border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                  <Radio className="w-5 h-5 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black animate-ping" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-white font-['Noto_Sans_Sinhala',sans-serif]">
                    Open Channel (විවෘත සජීවී)
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    සියලු සාමාජිකයින්ගේ පොදු කතාබහ
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-600 text-white shadow">
                LIVE
              </span>
            </button>
          </div>

          {/* Active 1-on-1 chats */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
            {activeConversations.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs flex flex-col items-center">
                <MessageSquare className="w-8 h-8 text-neutral-600 mb-2 opacity-50" />
                <p>තවමත් පෞද්ගලික කතාබහක් නැත.</p>
                <button
                  onClick={onOpenUsersDirectory}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-red-950 border border-red-700/60 text-red-300 text-xs font-bold hover:bg-red-900/60 transition cursor-pointer"
                >
                  + Users බොක්ස් එකෙන් චැට් ආරම්භ කරන්න
                </button>
              </div>
            ) : (
              activeConversations.map((user) => {
                const isSelected =
                  selectedTarget?.type === 'direct' && selectedTarget?.data?.id === user.id;
                const isOnline = user.status === 'online' || user.status === 'in-call';

                return (
                  <div
                    key={user.id}
                    onClick={() => onSelectDirectChat(user)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-950 to-[#1f0d14] border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                        : 'bg-[#12121a]/70 hover:bg-[#181824] border-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover border border-neutral-700"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${
                            isOnline ? 'bg-emerald-500' : 'bg-neutral-600'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {user.name}
                          </span>
                          {user.isVerified && (
                            <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate">
                          {user.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartCall(user, 'audio');
                        }}
                        className="p-1.5 bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white rounded-lg transition cursor-pointer"
                        title="Audio Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: GROUPS (Group chats + Create group button) */}
      {activeTab === 'groups' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-neutral-900 bg-[#12121a] flex items-center justify-between">
            <span className="text-xs font-extrabold text-neutral-300 uppercase tracking-wider">
              සමූහ (Groups)
            </span>
            <button
              onClick={onOpenCreateGroup}
              className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 active:scale-95 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Group</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
            {groups.map((group) => {
              const isSelected =
                selectedTarget?.type === 'group' && selectedTarget?.data?.id === group.id;
              const isOwner = group.ownerId === currentUser.id;

              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroupChat(group)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-red-950 to-[#1f0d14] border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                      : 'bg-[#12121a]/70 hover:bg-[#181824] border-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-black flex items-center justify-center text-lg border border-red-500/60 shadow">
                      {group.icon || '👥'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {group.name}
                        </span>
                        {isOwner && (
                          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-600/50 px-1 rounded font-bold">
                            OWNER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {group.description || `${group.memberIds.length} members`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: STATUS (24h Disappearing Status / Stories) */}
      {activeTab === 'status' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* My Status Section */}
          <div className="p-3 border-b border-neutral-900 bg-[#12121a]">
            <div className="flex items-center justify-between">
              <div
                onClick={() => {
                  if (myStatus) onViewStatus(myStatus);
                  else onOpenCreateStatus();
                }}
                className="flex items-center gap-3 cursor-pointer group flex-1"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className={`w-11 h-11 rounded-full object-cover border-2 ${
                      myStatus ? 'border-red-500 p-0.5' : 'border-neutral-700'
                    }`}
                  />
                  {!myStatus && (
                    <span className="absolute bottom-0 right-0 p-0.5 bg-red-600 text-white rounded-full">
                      <Plus className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-red-400 transition">
                    මගේ Status (My Status)
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {myStatus
                      ? 'ඔබගේ ස්ටේටස් එක බලන්න'
                      : 'ස්ටේටස් එකක් එක් කරන්න (පැය 24කින් මැකේ)'}
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenCreateStatus}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-[0_0_10px_rgba(239,68,68,0.5)] transition cursor-pointer"
                title="අලුත් Status එකක් දමන්න"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recent Status Updates */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              මෑත යාවත්කාලීන (Recent Updates)
            </div>

            {otherStatuses.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                තවමත් වෙනත් කිසිදු Status එකක් නොමැත.
              </div>
            ) : (
              otherStatuses.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onViewStatus(st)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#14141c] hover:bg-[#1a1a24] border border-neutral-900 hover:border-red-900/60 transition cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={st.userAvatar}
                      alt={st.userName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-red-500 p-0.5 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {st.userName}
                      </span>
                      {st.userVerified && (
                        <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {new Date(st.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: CALLS (Call logs, Missed calls, Callbacks) */}
      {activeTab === 'calls' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-red-500" />
            ඇමතුම් ඉතිහාසය (Call Logs)
          </div>

          {callLogs.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              තවමත් ඇමතුම් ඉතිහාසයක් නැත.
            </div>
          ) : (
            callLogs.map((log) => {
              const isOutgoing = log.callerId === currentUser.id;
              const peerName = isOutgoing ? log.receiverName : log.callerName;
              const peerAvatar = isOutgoing ? log.receiverAvatar : log.callerAvatar;
              const peerId = isOutgoing ? log.receiverId : log.callerId;
              const peerUser = getOtherUser(peerId);

              const isMissed = log.status === 'missed';

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#14141c] border border-neutral-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={peerAvatar}
                      alt={peerName}
                      className="w-10 h-10 rounded-xl object-cover border border-neutral-700"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {peerName}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold">
                        {isMissed ? (
                          <span className="text-red-400 flex items-center gap-0.5">
                            <PhoneMissed className="w-3 h-3 text-red-500" />
                            Missed Call
                          </span>
                        ) : isOutgoing ? (
                          <span className="text-neutral-400 flex items-center gap-0.5">
                            <PhoneOutgoing className="w-3 h-3 text-emerald-400" />
                            Outgoing
                          </span>
                        ) : (
                          <span className="text-neutral-400 flex items-center gap-0.5">
                            <PhoneIncoming className="w-3 h-3 text-blue-400" />
                            Incoming
                          </span>
                        )}
                        <span className="text-neutral-500">•</span>
                        <span className="text-neutral-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {peerUser && (
                    <button
                      onClick={() => onStartCall(peerUser, log.callType)}
                      className="p-2 bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white rounded-lg transition cursor-pointer"
                      title="නැවත කෝල් කරන්න (Call Back)"
                    >
                      {log.callType === 'video' ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
};
