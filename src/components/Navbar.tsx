import React from 'react';
import {
  Sparkles,
  LogOut,
  ShieldCheck,
  CheckCircle,
  Settings,
  Users,
} from 'lucide-react';
import { User, CallSession } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeCall: CallSession | null;
  mongoConnected: boolean;
  onLogout: () => void;
  onOpenMyOtpModal: () => void;
  onOpenProfileEdit: () => void;
  onOpenUsersDirectory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeCall,
  mongoConnected,
  onLogout,
  onOpenMyOtpModal,
  onOpenProfileEdit,
  onOpenUsersDirectory,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#0c0c10]/95 backdrop-blur-md border-b border-red-950/60 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-black border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <span className="font-['Cinzel',serif] font-black text-white text-base tracking-tighter">
              LK
            </span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Cinzel',serif] text-lg sm:text-xl font-black tracking-wider text-white">
                <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">LK</span> ONLINE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700/50">
                PRO 🇱🇰
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${mongoConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                MongoDB: {mongoConnected ? 'Connected' : 'Active'}
              </span>
              <span>•</span>
              <span className="text-neutral-500">100% Real Users</span>
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <>
              {/* Users directory shortcut */}
              <button
                onClick={onOpenUsersDirectory}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-[#14141c] hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
                title="Users Directory (සාමාජිකයින්)"
              >
                <Users className="w-3.5 h-3.5 text-red-400" />
                <span>Users</span>
              </button>

              {/* Authenticator Quick View Button */}
              <button
                onClick={onOpenMyOtpModal}
                className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-red-950/80 to-[#1d0b10] hover:from-red-900/80 hover:to-red-950 border border-red-700/60 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition cursor-pointer"
                title="ඔබගේ Authenticator OTP පරීක්ෂා කරන්න"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">YOU OTP</span>
                <span className="sm:hidden">OTP</span>
              </button>

              {/* User Profile Button -> Opens Profile & Verified Settings */}
              <button
                onClick={onOpenProfileEdit}
                className="flex items-center gap-2 px-2.5 py-1 bg-[#14141c] hover:bg-[#1a1a24] border border-neutral-800 hover:border-red-900/60 rounded-xl transition cursor-pointer"
                title="Profile & Settings"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover border border-red-500/40"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-black" />
                </div>
                <div className="hidden md:flex items-center gap-1 text-left">
                  <span className="text-xs font-bold text-white max-w-[100px] truncate leading-tight">
                    {currentUser.name}
                  </span>
                  {currentUser.isVerified && (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                </div>
                <Settings className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {/* Log out */}
              <button
                onClick={onLogout}
                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl border border-transparent hover:border-red-900/40 transition cursor-pointer"
                title="ඉවත් වන්න (Log Out)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
