import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, User as UserIcon, Sparkles, Check, Settings } from 'lucide-react';
import { User } from '../types';

interface ProfileEditModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateProfile: (updates: { name: string; bio: string; avatar: string; isVerified: boolean }) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  currentUser,
  onClose,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);

  // Check if special zanta mod account (phone 0760264995)
  const isSpecialAccount =
    currentUser.phone === '0760264995' || currentUser.name.toLowerCase() === 'zanta mod';

  const [isVerified, setIsVerified] = useState(isSpecialAccount ? true : Boolean(currentUser.isVerified));
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onUpdateProfile({
      name: name.trim(),
      bio: bio.trim(),
      avatar,
      isVerified: isSpecialAccount ? true : isVerified,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#111118] border-2 border-red-600/70 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#181822] border-b border-red-900/40">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Profile & Settings (පැතිකඩ සැකසුම්)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 bg-[#0d0d12] border-b border-neutral-900">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            පැතිකඩ (Edit Profile)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>සැකසුම් & Verified</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {activeTab === 'profile' ? (
            <>
              {/* Avatar Preview & Selection */}
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={avatar}
                    alt="Current Avatar"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  />
                  {(isVerified || isSpecialAccount) && (
                    <span className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-bold text-neutral-400 block mb-2">
                    Avatar එකක් තෝරන්න (Select Avatar)
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    {AVATAR_OPTIONS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                          avatar === av
                            ? 'border-red-500 scale-110 shadow-[0_0_10px_#ef4444]'
                            : 'border-neutral-700 hover:scale-105'
                        }`}
                      >
                        <img src={av} alt="Option" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  නම (Display Name)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#14141c] border border-neutral-800 focus:border-red-500 rounded-xl text-sm text-white outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Bio / තත්ත්වය (Status Bio)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="ඔබ ගැන කෙටි හැඳින්වීමක්..."
                  className="w-full px-3.5 py-2.5 bg-[#14141c] border border-neutral-800 focus:border-red-500 rounded-xl text-sm text-white outline-none"
                />
              </div>

              {/* Phone display (read-only) */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  ලියාපදිංචි දුරකථන අංකය (Phone)
                </label>
                <div className="px-3.5 py-2.5 bg-[#0a0a0f] border border-neutral-800/80 rounded-xl text-xs text-neutral-400 font-mono">
                  {currentUser.phone}
                </div>
              </div>
            </>
          ) : (
            /* Settings & Verified Badge Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/80 via-[#1e0a12] to-black border-2 border-red-600/60 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Verified Badge සේවාව
                    </span>
                  </div>
                  {isSpecialAccount ? (
                    <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/60">
                      MOD VERIFIED 👑
                    </span>
                  ) : isVerified ? (
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-600/60">
                      ACTIVE ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 bg-black/60 px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {isSpecialAccount ? (
                    <span className="text-amber-300 font-semibold">
                      🌟 ඔබගේ ගිණුම (0760264995 • zanta mod) වෙත නිල VERIFIED MOD බැජ් එක ස්වයංක්‍රීයව හිමිවී ඇත!
                    </span>
                  ) : (
                    'මෙම Verified Badge එක සක්‍රිය කළ පසු අනෙකුත් සියලුම සාමාජිකයින්ට ඔබගේ නම ඉදිරියෙන් නිල Verified නිල් සහ රන්වන් ලාංඡනය (✓ VERIFIED) දිස්වනු ඇත.'
                  )}
                </p>

                {/* Verified Toggle */}
                {!isSpecialAccount && (
                  <div className="mt-4 pt-3 border-t border-red-900/40 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Verified Badge එක ලබාගන්න (Get Verified)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsVerified(!isVerified)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        isVerified ? 'bg-blue-600' : 'bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isVerified ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-[#0d0d12] rounded-xl border border-neutral-800 text-[11px] text-neutral-400 leading-normal">
                🛡️ Verified ලාංඡනය මඟින් ඔබ 100% තහවුරු කළ සැබෑ සාමාජිකයෙකු බව LK ONLINE ප්‍රජාවට තහවුරු කරයි.
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              අවලංගු කරන්න
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 active:scale-95 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {loading ? (
                <span>සේව් වෙමින්...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>වෙනස්කම් සේව් කරන්න (Save Changes)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
