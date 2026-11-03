import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioBase64: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch {
        //
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err: any) {
      alert(`මයික්‍රෆෝනය ලබාගත නොහැකි විය: ${err.message}`);
      onCancel();
    }
  };

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    const recordedDuration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        onSendVoice(base64Audio, recordedDuration);
      };
      reader.readAsDataURL(audioBlob);

      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCancelRecording = () => {
    cleanup();
    onCancel();
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center justify-between w-full p-2 bg-gradient-to-r from-red-950 via-[#180a0f] to-black rounded-xl border border-red-600/70 shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-scale-up">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute" />
          <span className="w-3 h-3 rounded-full bg-red-600 relative" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
            හඬ පණිවිඩය රෙකෝඩ් වෙමින්... (Recording Voice)
          </span>
          <span className="text-xs font-mono font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-red-900/50">
            {formatSeconds(duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancelRecording}
          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition cursor-pointer"
          title="අවලංගු කරන්න (Cancel)"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>යවන්න (Send)</span>
        </button>
      </div>
    </div>
  );
};
