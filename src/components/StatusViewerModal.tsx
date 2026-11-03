import React, { useState, useEffect } from 'react';
import { X, Heart, Flame, Send, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { StatusItem, User } from '../types';

interface StatusViewerModalProps {
  status: StatusItem;
  currentUser: User;
  onClose: () => void;
  onReact: (statusId: string, emoji: string) => void;
  onReply: (statusId: string, text: string) => void;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  status,
  currentUser,
  onClose,
  onReact,
  onReply,
}) => {
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);

  // Auto-progress bar (8 seconds)
  useEffect(() => {
    const duration = 8000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose();
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    onReply(status.id, replyText.trim());
    setReplyText('');
    onClose();
  };

  const hoursRemaining = Math.max(
    1,
    Math.round((status.expiresAt - Date.now()) / (1000 * 60 * 60))
  );

  const quickReactions = ['❤️', '🔥', '😂', '😮', '👏', '🇱🇰'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-md h-[92vh] max-h-[780px] rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.3)] border border-red-900/60 flex flex-col justify-between">
        {/* Background Canvas */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            status.bgGradient || 'from-red-900 via-rose-950 to-black'
          }`}
        >
          {status.mediaUrl && (
            <img
              src={status.mediaUrl}
              alt="Status"
              className="w-full h-full object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none" />
        </div>

        {/* Top Header & Progress Bar */}
        <div className="relative z-10 p-4 space-y-3">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 shadow-[0_0_10px_#ef4444] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* User info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={status.userAvatar}
                alt={status.userName}
                className="w-10 h-10 rounded-full object-cover border-2 border-red-500 shadow-md"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white drop-shadow">
                    {status.userName}
                  </span>
                  {status.userVerified && (
                    <span className="flex items-center gap-0.5 text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold shadow-[0_0_8px_rgba(37,99,235,0.7)]">
                      <CheckCircle className="w-2.5 h-2.5" />
                      VERIFIED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-300">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>තව පැය {hoursRemaining}කින් ඉවත් වේ (24h Expiry)</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Content (Status text) */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6 text-center">
          {status.text && (
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] font-['Noto_Sans_Sinhala',sans-serif] max-w-sm">
              {status.text}
            </p>
          )}
        </div>

        {/* Bottom Reaction & Reply Bar */}
        <div className="relative z-10 p-4 space-y-3 bg-gradient-to-t from-black via-black/80 to-transparent">
          {/* Quick Reaction buttons */}
          <div className="flex items-center justify-center gap-2">
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact(status.id, emoji)}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-red-950/80 hover:scale-125 border border-white/20 transition-transform duration-150 flex items-center justify-center text-xl cursor-pointer shadow-lg"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Form */}
          {status.userId !== currentUser.id && (
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`${status.userName} ගේ ස්ටේටස් එකට රිප්ලයි කරන්න...`}
                className="flex-1 py-2.5 px-4 bg-black/70 border border-white/20 focus:border-red-500 rounded-full text-white placeholder-white/60 text-xs sm:text-sm outline-none backdrop-blur-md font-['Noto_Sans_Sinhala',sans-serif]"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 active:scale-95 disabled:opacity-40 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
