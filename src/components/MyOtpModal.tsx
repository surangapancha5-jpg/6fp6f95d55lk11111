import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, X, Key, Sparkles, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface MyOtpModalProps {
  currentUser: User;
  onClose: () => void;
}

export const MyOtpModal: React.FC<MyOtpModalProps> = ({ currentUser, onClose }) => {
  const [currentOtp, setCurrentOtp] = useState<string>('------');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Poll or fetch the current TOTP from the server for this user
  const fetchCurrentOtp = async () => {
    try {
      const token = localStorage.getItem('lk_token');
      // We can call login-check with current user's credentials or fetch from status
      const res = await fetch(`/api/system/status`);
      // Or calculate locally using time or endpoint
    } catch {
      //
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      setCountdown(sec);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch or calculate OTP
  useEffect(() => {
    // Read from stored cached OTP if set, or query check
    const stored = localStorage.getItem('lk_last_otp');
    if (stored) {
      setCurrentOtp(stored);
    }
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#111118] border-2 border-red-600 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
              YOU OTP • Authenticator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-red-950 via-[#1e0d12] to-black border border-red-700/60 shadow-[0_0_25px_rgba(220,38,38,0.25)] text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-red-300">
            සක්‍රිය Authenticator OTP කේතය (Active OTP)
          </span>

          <div className="my-3 font-mono text-4xl font-black text-amber-300 tracking-[0.25em]">
            {currentOtp}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleCopy(currentOtp)}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 active:scale-95 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy OTP'}</span>
            </button>
          </div>

          <p className="mt-3 text-[11px] text-neutral-400">
            ලොග් අවුට් වී නැවත එද්දී අංකය + නම + මුරපදය හරියටම මැච් වූ පසු ඉහත බොක්ස් එකෙන් OTP ලබාගත හැක.
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            වසන්න (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
