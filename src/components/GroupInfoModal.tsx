import React from 'react';
import { X, ShieldCheck, Crown, UserPlus, Users, Info } from 'lucide-react';
import { Group, User } from '../types';

interface GroupInfoModalProps {
  group: Group;
  currentUser: User;
  users: User[];
  onClose: () => void;
  onMakeAdmin: (groupId: string, memberId: string) => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  group,
  currentUser,
  users,
  onClose,
  onMakeAdmin,
}) => {
  const isOwner = group.ownerId === currentUser.id;
  const isAdmin = group.adminIds.includes(currentUser.id);

  const getMemberUser = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#111118] border-2 border-red-600/70 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#181822] border-b border-red-900/40">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Group තොරතුරු (Group Info)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Details */}
        <div className="p-5 text-center border-b border-neutral-900">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-red-600 via-rose-700 to-black flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-500">
            {group.icon || '👥'}
          </div>
          <h2 className="text-lg font-black text-white">{group.name}</h2>
          {group.description && (
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              {group.description}
            </p>
          )}
          <div className="mt-2 text-[10px] text-neutral-500 font-mono">
            සාමාජිකයින් {group.memberIds.length} දෙනෙක්
          </div>
        </div>

        {/* Members List */}
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto no-scrollbar">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-red-500" />
            සාමාජිකයින් (Members & Admins)
          </div>

          {group.memberIds.map((memberId) => {
            const member = getMemberUser(memberId);
            const isMemberOwner = group.ownerId === memberId;
            const isMemberAdmin = group.adminIds.includes(memberId);

            return (
              <div
                key={memberId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#14141c] border border-neutral-800/80"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={
                      member?.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${memberId}&backgroundColor=09090b`
                    }
                    alt={member?.name || 'Member'}
                    className="w-8 h-8 rounded-lg object-cover border border-neutral-700"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {member?.name || (memberId === currentUser.id ? currentUser.name : 'User')}
                      </span>
                      {memberId === currentUser.id && (
                        <span className="text-[9px] text-neutral-400">(You)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {member?.phone || ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Roles */}
                  {isMemberOwner ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-950 border border-amber-600/60 text-amber-300 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      OWNER
                    </span>
                  ) : isMemberAdmin ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-950 border border-red-600/60 text-red-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-red-400" />
                      ADMIN
                    </span>
                  ) : null}

                  {/* Make Admin Button (Only Owner or Admin can give admin, and rule says CANNOT remove) */}
                  {(isOwner || isAdmin) && !isMemberAdmin && !isMemberOwner && (
                    <button
                      onClick={() => onMakeAdmin(group.id, memberId)}
                      className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-[10px] font-bold text-red-300 transition cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Make Admin
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-[#0d0d12] border-t border-neutral-900 text-center text-[10px] text-neutral-500">
          ⚠️ නීතිය: ගෘප් එකේ Owner හට වෙනත් අයට Admin ලබාදිය හැකි නමුත්, Admin වරප්‍රසාද ඉවත් කළ නොහැක.
        </div>
      </div>
    </div>
  );
};
