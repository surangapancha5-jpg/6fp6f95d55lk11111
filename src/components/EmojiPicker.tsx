import React, { useState } from 'react';
import { EMOJI_CATEGORIES } from '../data/stickersAndEmojis';
import { Smile, X, Search } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].name);
  const [search, setSearch] = useState('');

  const currentCat = EMOJI_CATEGORIES.find((c) => c.name === activeCategory) || EMOJI_CATEGORIES[0];

  const displayedEmojis = search
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((_, idx, arr) => arr.indexOf(_) === idx)
    : currentCat.emojis;

  return (
    <div className="absolute bottom-16 left-0 right-0 sm:left-auto sm:right-4 sm:w-80 max-h-96 bg-[#121218] border border-red-900/60 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-40 flex flex-col overflow-hidden backdrop-blur-xl animate-scale-up">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#181822] border-b border-red-900/30">
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            ඉමෝජි (Emojis)
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category selector */}
      <div className="flex gap-1 p-2 bg-[#0d0d12] border-b border-neutral-800/80 overflow-x-auto no-scrollbar">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => {
              setActiveCategory(cat.name);
              setSearch('');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat.name && !search
                ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {cat.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 grid grid-cols-7 gap-1.5 overflow-y-auto max-h-60 no-scrollbar">
        {displayedEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelectEmoji(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-red-900/30 hover:scale-125 transition-transform duration-150 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
