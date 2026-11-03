import React, { useState } from 'react';
import { X, Sparkles, Send, Palette, Image as ImageIcon } from 'lucide-react';
import { User } from '../types';

interface CreateStatusModalProps {
  currentUser: User;
  onClose: () => void;
  onSubmit: (data: { text?: string; bgGradient?: string; mediaUrl?: string }) => void;
}

const GRADIENTS = [
  { name: 'Crimson Glow', value: 'from-red-600 via-rose-700 to-black' },
  { name: 'Dark Obsidian', value: 'from-[#1c080e] via-black to-[#2d0f16]' },
  { name: 'Blood Ruby', value: 'from-red-900 via-red-950 to-neutral-950' },
  { name: 'Midnight Neon', value: 'from-blue-900 via-purple-950 to-black' },
  { name: 'Emerald Fire', value: 'from-emerald-800 via-teal-950 to-black' },
  { name: 'Gold Luxury', value: 'from-amber-700 via-stone-900 to-black' },
];

export const CreateStatusModal: React.FC<CreateStatusModalProps> = ({
  currentUser,
  onClose,
  onSubmit,
}) => {
  const [text, setText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].value);
  const [mediaUrl, setMediaUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !mediaUrl.trim()) return;

    onSubmit({
      text: text.trim(),
      bgGradient: selectedGradient,
      mediaUrl: mediaUrl.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#111118] border-2 border-red-600/70 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#181822] border-b border-red-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              අලුත් Status එකක් දමන්න (24h Disappearing)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div
          className={`relative h-64 p-6 flex items-center justify-center text-center bg-gradient-to-br ${selectedGradient} transition-colors duration-300`}
        >
          {mediaUrl && (
            <img
              src={mediaUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          )}
          <div className="relative z-10 w-full">
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ඔබේ සිතුවිල්ල හෝ පණිවිඩය මෙතැන ලියන්න..."
              maxLength={200}
              className="w-full bg-transparent text-white placeholder-white/60 text-lg sm:text-xl font-black text-center resize-none outline-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-['Noto_Sans_Sinhala',sans-serif]"
            />
            <div className="text-[10px] text-white/50 text-right mt-2">
              {text.length}/200
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Gradient Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-red-500" />
              වර්ණ තේමාව (Background Gradient)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {GRADIENTS.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedGradient(g.value)}
                  className={`h-8 rounded-xl bg-gradient-to-br ${g.value} border-2 transition cursor-pointer ${
                    selectedGradient === g.value
                      ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={g.name}
                />
              ))}
            </div>
          </div>

          {/* Optional Image URL Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{showImageInput ? 'පින්තූරය ඉවත් කරන්න' : '+ පින්තූර URL එකක් එක් කරන්න (Image URL)'}</span>
            </button>
            {showImageInput && (
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-2 w-full px-3 py-2 bg-[#14141c] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
              />
            )}
          </div>

          <div className="text-[11px] text-neutral-400 bg-red-950/40 p-2.5 rounded-xl border border-red-900/30">
            ⏳ මෙම ස්ටේටස් එක පැය 24කින් ස්වයංක්‍රීයව මැකී යනු ලැබේ (24h Expiry).
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              අවලංගු කරන්න
            </button>
            <button
              type="submit"
              disabled={!text.trim() && !mediaUrl.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 active:scale-95 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Status එක පළ කරන්න (Share Status)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
