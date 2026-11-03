import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Sparkles,
  Info,
  ArrowLeft,
  Reply,
  X,
  Mic,
  CheckCircle,
} from 'lucide-react';
import { Message, User, Group, StickerItem } from '../types';
import { StickerPicker } from './StickerPicker';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { AudioPlayerBubble } from './AudioPlayerBubble';
import { STICKER_PACKS } from '../data/stickersAndEmojis';

interface GroupChatViewProps {
  group: Group;
  currentUser: User;
  messages: Message[];
  onSendMessage: (payload: {
    text?: string;
    sticker?: string;
    emoji?: string;
    voiceAudio?: string;
    voiceDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
  }) => void;
  onOpenInfo: () => void;
  onBack: () => void;
}

export const GroupChatView: React.FC<GroupChatViewProps> = ({
  group,
  currentUser,
  messages,
  onSendMessage,
  onOpenInfo,
  onBack,
}) => {
  const [inputText, setInputText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [activeReply, setActiveReply] = useState<{ id: string; senderName: string; text: string } | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage({
      text: inputText.trim(),
      replyTo: activeReply || undefined,
    });
    setInputText('');
    setActiveReply(null);
    setShowStickers(false);
    setShowEmojis(false);
  };

  const handleSelectSticker = (sticker: StickerItem) => {
    onSendMessage({
      sticker: sticker.id,
      text: sticker.sinhalaText,
      replyTo: activeReply || undefined,
    });
    setActiveReply(null);
    setShowStickers(false);
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const handleSendVoice = (audioBase64: string, durationSeconds: number) => {
    onSendMessage({
      voiceAudio: audioBase64,
      voiceDuration: durationSeconds,
      replyTo: activeReply || undefined,
    });
    setActiveReply(null);
    setIsRecordingVoice(false);
  };

  const getStickerDetail = (stickerId?: string) => {
    if (!stickerId) return null;
    for (const pack of STICKER_PACKS) {
      const match = pack.stickers.find((s) => s.id === stickerId);
      if (match) return match;
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0e] relative overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 bg-[#111118] border-b border-red-950/60 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-black flex items-center justify-center text-lg border border-red-500 shadow">
            {group.icon || '👥'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-extrabold text-white">
                {group.name}
              </h2>
            </div>
            <div className="text-[11px] text-neutral-400">
              {group.memberIds.length} members • Tap info to view members & admins
            </div>
          </div>
        </div>

        <button
          onClick={onOpenInfo}
          className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <Info className="w-4 h-4 text-red-400" />
          <span className="hidden sm:inline">Group Info</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-900/30 flex items-center justify-center text-2xl mb-2">
              {group.icon || '👥'}
            </div>
            <h3 className="text-sm font-bold text-neutral-300">
              සාදරයෙන් පිළිගන්නවා {group.name} සමූහයට!
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              පළමු පණිවිඩය යවා කතාබහ ආරම්භ කරන්න.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUser.id;
            const stickerDetail = getStickerDetail(msg.sticker);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 group ${isMine ? 'flex-row-reverse' : ''}`}
              >
                <div className={`max-w-[85%] sm:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${isMine ? 'flex-row-reverse' : ''}`}>
                    <span className="font-bold text-white/90">{msg.senderName}</span>
                    {msg.senderVerified && (
                      <CheckCircle className="w-3 h-3 text-blue-400" />
                    )}
                    <span className="text-neutral-500 font-mono text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`relative p-3.5 rounded-2xl border transition-all duration-200 ${
                      isMine
                        ? 'bg-gradient-to-br from-red-900 to-red-950 border-red-700/70 text-white rounded-tr-none shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                        : 'bg-[#151520] border-neutral-800 text-neutral-100 rounded-tl-none shadow-md'
                    }`}
                  >
                    {/* Reply quote */}
                    {msg.replyTo && (
                      <div className="mb-2 p-2 rounded-lg bg-black/40 border-l-4 border-red-500 text-left">
                        <div className="text-[10px] font-bold text-red-400">
                          {msg.replyTo.senderName}
                        </div>
                        <div className="text-xs text-neutral-300 truncate">
                          {msg.replyTo.text}
                        </div>
                      </div>
                    )}

                    {/* Sticker */}
                    {stickerDetail && (
                      <div className="mb-2 p-3 rounded-xl bg-gradient-to-br from-black/80 to-neutral-900/90 border border-red-600/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <div className="text-3xl mb-1">{stickerDetail.icon}</div>
                        <div className="text-sm font-black text-amber-300 font-['Noto_Sans_Sinhala',sans-serif]">
                          {stickerDetail.sinhalaText}
                        </div>
                        {stickerDetail.subText && (
                          <div className="text-[10px] text-neutral-400">{stickerDetail.subText}</div>
                        )}
                      </div>
                    )}

                    {/* Voice audio */}
                    {msg.voiceAudio && (
                      <AudioPlayerBubble
                        audioUrl={msg.voiceAudio}
                        duration={msg.voiceDuration}
                        isMine={isMine}
                      />
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words font-['Noto_Sans_Sinhala',sans-serif]">
                        {msg.text}
                      </p>
                    )}

                    <div className="mt-1 text-[10px] text-right text-neutral-400 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Reply button on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-1 px-1">
                    <button
                      onClick={() =>
                        setActiveReply({
                          id: msg.id,
                          senderName: isMine ? 'You' : msg.senderName,
                          text: msg.text || (msg.voiceAudio ? 'Voice Message' : 'Sticker'),
                        })
                      }
                      className="text-[10px] text-neutral-400 hover:text-red-400 flex items-center gap-1 cursor-pointer bg-neutral-900/60 px-2 py-0.5 rounded-full"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Active Reply Banner */}
      {activeReply && (
        <div className="px-4 py-2 bg-[#191924] border-t border-red-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 border-l-2 border-red-500 pl-2">
            <Reply className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-[10px] font-bold text-red-400">
                Replying to {activeReply.senderName}
              </div>
              <div className="text-xs text-neutral-300 truncate max-w-sm">
                {activeReply.text}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveReply(null)}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 md:p-4 bg-[#0f0f16] border-t border-red-950/60 relative">
        {showStickers && (
          <StickerPicker
            onSelectSticker={handleSelectSticker}
            onClose={() => setShowStickers(false)}
          />
        )}
        {showEmojis && (
          <EmojiPicker
            onSelectEmoji={handleSelectEmoji}
            onClose={() => setShowEmojis(false)}
          />
        )}

        {isRecordingVoice ? (
          <VoiceRecorder
            onSendVoice={handleSendVoice}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowStickers(!showStickers);
                setShowEmojis(false);
              }}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                showStickers
                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-[#181824] hover:bg-neutral-800 text-neutral-300 border-neutral-800'
              }`}
              title="ස්ටිකර් තෝරන්න (Stickers)"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowEmojis(!showEmojis);
                setShowStickers(false);
              }}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                showEmojis
                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-[#181824] hover:bg-neutral-800 text-neutral-300 border-neutral-800'
              }`}
              title="ඉමෝජි තෝරන්න (Emojis)"
            >
              <Smile className="w-5 h-5 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2.5 rounded-xl bg-[#181824] hover:bg-red-950/60 text-neutral-300 hover:text-red-400 border border-neutral-800 transition cursor-pointer"
              title="හඬ පණිවිඩයක් එවන්න (Voice Message)"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`${group.name} වෙත පණිවිඩයක් යවන්න...`}
              className="flex-1 py-2.5 px-4 bg-[#14141c] border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-neutral-500 text-sm outline-none transition font-['Noto_Sans_Sinhala',sans-serif]"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:brightness-110 active:scale-95 disabled:opacity-40 text-white rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition cursor-pointer flex items-center justify-center shrink-0"
              title="යවන්න (Send)"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
