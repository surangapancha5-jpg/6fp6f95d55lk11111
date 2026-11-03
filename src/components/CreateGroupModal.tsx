import React, { useState } from 'react';
import { X, Users, Sparkles, Check, Plus } from 'lucide-react';
import { User } from '../types';

interface CreateGroupModalProps {
  currentUser: User;
  users: User[];
  onClose: () => void;
  onCreateGroup: (data: { name: string; description?: string; icon?: string; memberIds: string[] }) => void;
}

const GROUP_ICONS = ['👥', '🇱🇰', '🔥', '👑', '⚡', '☕', '💎', '🚀', '🎉', '🦁'];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  currentUser,
  users,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('👥');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const otherUsers = users.filter((u) => u.id !== currentUser.id);

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(selectedMemberIds.filter((m) => m !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      memberIds: [currentUser.id, ...selectedMemberIds],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#111118] border-2 border-red-600/70 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#181822] border-b border-red-900/40">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              අලුත් Group එකක් සාදන්න (New Group)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          {/* Icon selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              Group අයිකනය (Icon)
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {GROUP_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition cursor-pointer shrink-0 ${
                    icon === ic
                      ? 'bg-red-600 text-white scale-110 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : 'bg-[#181824] hover:bg-neutral-800'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
              Group නම (Group Name) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="උදා: Colombo Chillers, LK Gamers..."
              className="w-full px-3.5 py-2.5 bg-[#14141c] border border-neutral-800 focus:border-red-500 rounded-xl text-sm text-white outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
              විස්තරය (Description)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ගෘප් එක පිළිබඳ කෙටි හැඳින්වීමක්..."
              className="w-full px-3.5 py-2.5 bg-[#14141c] border border-neutral-800 focus:border-red-500 rounded-xl text-sm text-white outline-none"
            />
          </div>

          {/* Select Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                සාමාජිකයින් එක් කරන්න (Add Members)
              </label>
              <span className="text-[11px] text-amber-400 font-mono font-bold">
                {selectedMemberIds.length} Selected
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar border border-neutral-800 rounded-xl p-2 bg-[#0c0c12]">
              {otherUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'bg-red-950/80 border border-red-700/60'
                        : 'hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {user.phone}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isSelected
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'border-neutral-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-red-950/40 rounded-xl border border-red-900/40 text-[11px] text-neutral-300">
            👑 <strong>නීති (Rules):</strong> ඔබ මෙම ගෘප් එකේ <strong>Owner</strong> වේ. ඔබට වෙනත් අයට Admin ලබාදිය හැක. (නමුත් Admin වරප්‍රසාද ඉවත් කළ නොහැක).
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              අවලංගු කරන්න
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 active:scale-95 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Group එක සාදන්න (Create Group)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
