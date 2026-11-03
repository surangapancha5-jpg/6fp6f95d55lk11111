import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerBubbleProps {
  audioUrl: string;
  duration?: number;
  isMine?: boolean;
}

export const AudioPlayerBubble: React.FC<AudioPlayerBubbleProps> = ({ audioUrl, duration, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalDuration = duration || Math.max(1, Math.floor(audioRef.current?.duration || 0));

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-xl border min-w-[200px] sm:min-w-[240px] ${
        isMine
          ? 'bg-red-950/60 border-red-700/50 text-white'
          : 'bg-[#0f0f15] border-neutral-800 text-neutral-100'
      }`}
    >
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 hover:brightness-110 active:scale-95 flex items-center justify-center text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] transition shrink-0 cursor-pointer"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
        {/* Waveform bars simulation */}
        <div className="flex items-center gap-0.5 h-6 mb-1">
          {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70, 85, 40, 60].map((height, i) => {
            const playedRatio = (currentTime / (totalDuration || 1)) * 15;
            const isPlayed = i <= playedRatio;
            return (
              <span
                key={i}
                style={{ height: `${height}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? 'bg-red-500 shadow-[0_0_4px_#ef4444]'
                    : isMine
                    ? 'bg-red-900/40'
                    : 'bg-neutral-700'
                } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-neutral-400">
          <span>{isPlaying ? formatSecs(currentTime) : 'Voice Message'}</span>
          <span>{formatSecs(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
};
