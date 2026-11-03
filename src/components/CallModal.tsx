import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  Volume2,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { CallSession } from '../types';
import { soundEngine } from '../utils/audio';

interface CallModalProps {
  session: CallSession;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onDecline: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  session,
  localStream,
  remoteStream,
  onAccept,
  onDecline,
  onHangup,
  onToggleMute,
  onToggleVideo,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Hook up media streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, session.status, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, session.status, isMinimized]);

  // Duration timer
  useEffect(() => {
    let timer: any = null;
    if (session.status === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session.status]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Minimized floating bubble
  if (isMinimized && session.status === 'connected') {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-[#121218] border-2 border-red-600 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.5)] p-3 flex items-center gap-3 animate-bounce-subtle">
        <div className="relative">
          <img
            src={session.peerUser.avatar}
            alt={session.peerUser.name}
            className="w-12 h-12 rounded-xl object-cover border border-red-500"
          />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
        </div>
        <div>
          <div className="text-xs font-bold text-white">{session.peerUser.name}</div>
          <div className="text-[11px] text-amber-400 font-mono font-bold">
            {formatDuration(callDuration)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition cursor-pointer"
            title="විශාල කරන්න (Maximize)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onHangup}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.6)]"
            title="කෝල් එක නවත්වන්න (Hang Up)"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[750px] bg-[#0c0c10] border-2 border-red-600/60 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.3)] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#140b0e] via-[#10080a] to-[#0c0c10] border-b border-red-900/40 z-10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div>
              <span className="text-xs md:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                LK ONLINE WEBRTC CALL • {session.callType.toUpperCase()}
              </span>
              <div className="text-[11px] text-neutral-400">
                P2P Encrypted • Real Connection
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session.status === 'connected' && (
              <div className="px-3 py-1 bg-red-950/80 border border-red-700/60 rounded-full font-mono text-sm text-amber-300 font-bold tracking-wider">
                {formatDuration(callDuration)}
              </div>
            )}
            {session.status === 'connected' && (
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition cursor-pointer"
                title="කුඩා කරන්න (Minimize)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main call video / audio stage */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {session.status === 'connected' ? (
            session.callType === 'video' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Remote Video Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Local Video Stream in Picture-in-Picture window */}
                <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video bg-neutral-900 border-2 border-red-500/80 rounded-2xl overflow-hidden shadow-2xl z-20">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                  {session.isVideoOff && (
                    <div className="absolute inset-0 bg-neutral-950/90 flex items-center justify-center text-xs text-neutral-400 font-bold">
                      කැමරාව අක්‍රියයි
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                    You
                  </span>
                </div>
              </div>
            ) : (
              /* Audio call connected UI */
              <div className="text-center p-8 flex flex-col items-center">
                <div className="relative mb-6">
                  <img
                    src={session.peerUser.avatar}
                    alt={session.peerUser.name}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse"
                  />
                  <span className="absolute bottom-2 right-2 p-2 bg-emerald-500 text-black rounded-full shadow-lg">
                    <Volume2 className="w-5 h-5" />
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  {session.peerUser.name}
                </h2>
                <p className="text-sm text-neutral-400 mt-1">{session.peerUser.phone}</p>
                <div className="mt-4 px-4 py-1.5 rounded-full bg-red-950 border border-red-700/60 text-amber-300 font-mono text-base font-bold">
                  {formatDuration(callDuration)}
                </div>
              </div>
            )
          ) : (
            /* Ringing or Calling state UI */
            <div className="text-center p-8 flex flex-col items-center animate-fade-in">
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-full bg-red-600/20 animate-ping" />
                <img
                  src={session.peerUser.avatar}
                  alt={session.peerUser.name}
                  className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]"
                />
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                {session.peerUser.name}
              </h2>
              <p className="text-sm text-neutral-400 mt-1">{session.peerUser.phone}</p>

              <div className="mt-6 flex items-center gap-2 text-sm md:text-base font-semibold text-amber-300 bg-black/60 px-5 py-2 rounded-full border border-red-900/40">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                {session.isIncoming
                  ? 'සජීවී ඇමතුමක් ලැබෙමින් පවතී... (Incoming Call)'
                  : 'ඇමතුම සම්බන්ධ කරමින් පවතී... (Calling...)'}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Actions */}
        <div className="px-6 py-6 bg-gradient-to-t from-black via-[#0d0709] to-[#0c0c10] border-t border-red-900/40 flex items-center justify-center gap-4 md:gap-6 z-10">
          {session.isIncoming && session.status !== 'connected' ? (
            /* Incoming Call: Accept / Decline */
            <div className="flex items-center gap-6">
              <button
                onClick={onDecline}
                className="px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-2xl text-neutral-200 font-bold text-sm flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-lg"
              >
                <PhoneOff className="w-5 h-5 text-red-400" />
                <span>ප්‍රතික්ෂේප කරන්න (Decline)</span>
              </button>

              <button
                onClick={onAccept}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-2xl text-white font-bold text-sm flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-bounce-subtle"
              >
                <Phone className="w-5 h-5" />
                <span>පිළිගන්න (Answer)</span>
              </button>
            </div>
          ) : (
            /* Connected or Outgoing Call Controls */
            <div className="flex items-center gap-4">
              {session.status === 'connected' && (
                <>
                  {/* Mute button */}
                  <button
                    onClick={onToggleMute}
                    className={`p-4 rounded-2xl transition cursor-pointer active:scale-95 ${
                      session.isMuted
                        ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.5)]'
                        : 'bg-[#181822] text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-700'
                    }`}
                    title={session.isMuted ? 'Unmute' : 'Mute'}
                  >
                    {session.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>

                  {/* Video toggle button */}
                  {session.callType === 'video' && (
                    <button
                      onClick={onToggleVideo}
                      className={`p-4 rounded-2xl transition cursor-pointer active:scale-95 ${
                        session.isVideoOff
                          ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.5)]'
                          : 'bg-[#181822] text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-700'
                      }`}
                      title={session.isVideoOff ? 'Enable Video' : 'Disable Video'}
                    >
                      {session.isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>
                  )}
                </>
              )}

              {/* End / Cancel Call */}
              <button
                onClick={onHangup}
                className="px-8 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:brightness-110 active:scale-95 text-white font-extrabold rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center gap-2.5 transition cursor-pointer text-sm md:text-base"
              >
                <PhoneOff className="w-5 h-5" />
                <span>{session.status === 'connected' ? 'කෝල් එක නවත්වන්න' : 'අවලංගු කරන්න'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
