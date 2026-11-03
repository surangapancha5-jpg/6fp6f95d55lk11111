import React, { useState } from 'react';
import { STICKER_PACKS } from '../data/stickersAndEmojis';
import { StickerItem } from '../types';
import { Sparkles, X } from 'lucide-react';

interface StickerPickerProps {
  onSelectSticker: (sticker: StickerItem) => void;
  onClose: () => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ onSelectSticker, onClose }) => {
  const [activePackId, setActivePackId] = useState(STICKER_PACKS[0].id);

  const currentPack = STICKER_PACKS.find((p) => p.id === activePackId) || STICKER_PACKS[0];

  return (
    <div className="absolute bottom-16 left-0 right-0 sm:left-auto sm:right-4 sm:w-96 max-h-96 bg-[#121218] border border-red-900/60 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-40 flex flex-col overflow-hidden backdrop-blur-xl animate-scale-up">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#181822] border-b border-red-900/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            LK ONLINE ස්ටිකර් මිටිය (Stickers)
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pack Tabs */}
      <div className="flex gap-1 p-2 bg-[#0d0d12] border-b border-neutral-800/80 overflow-x-auto no-scrollbar">
        {STICKER_PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => setActivePackId(pack.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activePackId === pack.id
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <span>{pack.icon}</span>
            <span>{pack.title}</span>
          </button>
        ))}
      </div>

      {/* Sticker Grid */}
      <div className="p-3 grid grid-cols-2 gap-2.5 overflow-y-auto max-h-64 no-scrollbar">
        {currentPack.stickers.map((st) => (
          <button
            key={st.id}
            onClick={() => onSelectSticker(st)}
            className={`group relative p-3 rounded-xl bg-gradient-to-br ${
              st.bgGradient || 'from-neutral-900 to-black'
            } border border-red-900/40 hover:border-red-500 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 text-left flex flex-col justify-between shadow-md cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{st.icon}</span>
              <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40">
                {st.name}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-['Noto_Sans_Sinhala',sans-serif]">
                {st.sinhalaText}
              </div>
              {st.subText && (
                <div className="text-[10px] text-neutral-300/80 font-medium">{st.subText}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
