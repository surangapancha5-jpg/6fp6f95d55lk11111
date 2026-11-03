import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Lock, Phone, User as UserIcon, Copy, Check, ArrowRight, AlertCircle, RefreshCw, Smartphone, Sparkles } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('register');

  // Register state
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSecret, setRegSecret] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regStep, setRegStep] = useState<'form' | 'verify'>('form');

  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [generatedLoginOtp, setGeneratedLoginOtp] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [totpCountdown, setTotpCountdown] = useState(30);

  // Timer for TOTP 30s countdown
  useEffect(() => {
    const updateCountdown = () => {
      const seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTotpCountdown(seconds);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Copy helper
  const handleCopy = (text: string, type: 'key' | 'otp') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  // Step 1: Register Init
  const handleRegisterInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regPhone.trim() || !regName.trim() || !regPassword.trim()) {
      setErrorMessage('කරුණාකර සියලු විස්තර සම්පූර්ණ කරන්න (Fill all fields)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: regPhone.trim(),
          name: regName.trim(),
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ලියාපදිංචි කිරීම ආරම්භ කිරීමට නොහැකි විය.');
      }

      setRegSecret(data.secret);
      setRegStep('verify');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Register Complete & OTP Verification
  const handleRegisterVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regOtp || regOtp.trim().length !== 6) {
      setErrorMessage('කරුණාකර ඉලක්කම් 6ක OTP අංකය ලබා දෙන්න (Enter valid 6-digit OTP)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: regPhone.trim(),
          name: regName.trim(),
          password: regPassword,
          secret: regSecret,
          otp: regOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OTP සත්‍යාපනය අසාර්ථකයි.');
      }

      localStorage.setItem('lk_token', data.token);
      localStorage.setItem('lk_user', JSON.stringify(data.user));
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Login Step 1 - Check Number + Name + Password
  // If matched accurately, receives the accurate generated TOTP code
  const handleLoginCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginPhone.trim() || !loginName.trim() || !loginPassword.trim()) {
      setErrorMessage('කරුණාකර දුරකථන අංකය, නම සහ මුරපදය සියල්ල ඇතුළත් කරන්න.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone.trim(),
          name: loginName.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'දත්ත වැරදියි. නැවත පරීක්ෂා කරන්න.');
      }

      // ACCURATE MATCH! Show the generated OTP in the prompt's required "YOU OTP" copy box!
      setGeneratedLoginOtp(data.currentOtp);
      setLoginOtp(data.currentOtp); // Pre-fill or make ready
      setLoginStep('otp');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Login Step 2 - Verify OTP
  const handleLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginOtp || loginOtp.trim().length !== 6) {
      setErrorMessage('කරුණාකර ඉලක්කම් 6ක OTP කේතය ඇතුළත් කරන්න.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone.trim(),
          otp: loginOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OTP කේතය වැරදියි. ෆේක් ඒවා ප්‍රතික්ෂේප කරනු ලැබේ.');
      }

      localStorage.setItem('lk_token', data.token);
      localStorage.setItem('lk_user', JSON.stringify(data.user));
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-[#0f0f13] border border-red-900/60 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.25)] overflow-hidden">
        {/* Top ambient luxury glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_15px_#ef4444]" />
        
        {/* Header */}
        <div className="p-6 md:p-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 mb-3 rounded-full bg-red-950/80 border border-red-700/50 text-red-400 text-xs font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            100% REAL USERS • SRI LANKA
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2 font-['Cinzel',serif]">
            <span className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">LK</span>
            <span>ONLINE</span>
          </h1>
          <p className="mt-2 text-xs md:text-sm text-neutral-400">
            සජීවී Chat & Call සේවාව • Authenticator 2FA ආරක්ෂාව • MongoDB Real-time
          </p>

          {/* Tab Selector */}
          <div className="mt-6 grid grid-cols-2 p-1 bg-[#18181f] border border-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMessage(null);
              }}
              className={`py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all duration-200 ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ලියාපදිංචිය (Register)
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
              }}
              className={`py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all duration-200 ${
                tab === 'login'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ඇතුල්වීම (Log In)
            </button>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mx-6 md:mx-8 mb-4 p-3.5 rounded-xl bg-red-950/90 border border-red-600/70 flex items-start gap-3 text-red-200 text-xs md:text-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        <div className="px-6 md:px-8 pb-8">
          {/* ================= REGISTER VIEW ================= */}
          {tab === 'register' && (
            <div>
              {regStep === 'form' ? (
                <form onSubmit={handleRegisterInit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      දුරකථන අංකය (Phone Number)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="උදා: 0771234567 හෝ +94771234567"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#14141a] border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-neutral-600 text-sm outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      නම (Your Name)
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="උදා: Kasun Perera"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#14141a] border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-neutral-600 text-sm outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      මුරපදය (Password)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#14141a] border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-neutral-600 text-sm outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.99] font-bold text-white rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.4)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Authenticator Key එක ලබාගන්න</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2 of Register: Show Authenticator Key & Verify 6-digit OTP */
                <form onSubmit={handleRegisterVerify} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1c1215] to-[#120d0f] border border-red-700/60 shadow-[0_0_20px_rgba(220,38,38,0.15)]">
                    <div className="flex items-center justify-between text-xs text-red-400 font-bold mb-2">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        ඔබගේ Authenticator Secret Key එක:
                      </span>
                      <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        RFC 6238 Standard
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-xl border border-red-900/40">
                      <code className="text-xs md:text-sm font-mono text-amber-300 font-bold tracking-wider select-all break-all flex-1">
                        {regSecret}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(regSecret, 'key')}
                        className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 rounded-lg text-xs font-semibold text-white flex items-center gap-1 transition shrink-0 cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey ? 'Copied' : 'Copy Key'}
                      </button>
                    </div>

                    <p className="mt-3 text-[11px] text-neutral-400 leading-relaxed">
                      💡 මෙම Secret Key එක ඔබගේ <strong className="text-white">Google Authenticator</strong> හෝ <strong className="text-white">Microsoft Authenticator</strong> ඇප් එකේ "Enter a setup key" තෝරා ඇතුළත් කරන්න. ඉන් ලැබෙන අංක 6ක OTP කේතය පහතින් ඇතුළත් කරන්න.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      Authenticator 6-Digit OTP කේතය
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-red-500" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={regOtp}
                        onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-3 bg-[#14141a] border border-red-600/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 rounded-xl text-amber-300 placeholder-neutral-600 text-lg font-mono tracking-widest text-center outline-none transition"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-neutral-500 text-center">
                      * ෆේක් OTP කේත සෘජුවම ප්‍රතික්ෂේප කරනු ලැබේ.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRegStep('form')}
                      className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      පසුපසට
                    </button>
                    <button
                      type="submit"
                      disabled={loading || regOtp.length !== 6}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:brightness-110 active:scale-[0.99] font-bold text-white rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.5)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>තහවුරු කර ලියාපදිංචි වන්න</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= LOGIN VIEW ================= */}
          {tab === 'login' && (
            <div>
              {/* ACCURATE MATCH PROMPT REQUIREMENT:
                  "එයා ලොග් අවුට් වෙලා ආයෙ එද්දින් number + name + password හරියටම මැච් උනොත් Authenticator එකෙන් හරි කෝඩ් එක ජෙන රෙට් වෙලා උඩින් කොපි කරන්න පුලුවන් බොක්ස් එකක එන්න ඔන you otp කියලා"
              */}
              {generatedLoginOtp && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-red-950 via-[#260f14] to-black border-2 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.35)] animate-pulse-glow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-extrabold uppercase tracking-widest text-red-300">
                        YOU OTP / YOUR OTP
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">
                      Expires in {totpCountdown}s
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-3 bg-black/70 p-3 rounded-xl border border-red-800/60">
                    <div className="font-mono text-2xl md:text-3xl font-black tracking-[0.25em] text-amber-300 select-all">
                      {generatedLoginOtp}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedLoginOtp, 'otp')}
                        className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border border-red-400/50 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition cursor-pointer active:scale-95"
                      >
                        {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedOtp ? 'Copied!' : 'Copy OTP'}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-red-200/80">
                    ✅ දුරකථන අංකය, නම සහ මුරපදය නිවැරදිව මැච් විය! ඉහත කේතය කොපි කර පහතින් තහවුරු කරන්න.
                  </p>
                </div>
              )}

              {loginStep === 'credentials' ? (
                <form onSubmit={handleLoginCheck} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      දුරකථන අංකය (Phone Number)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="උදා: 0771234567"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#14141a] border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-neutral-600 text-sm outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      නම (Name)
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        required
                        value={loginName}
                        onChange={(e) => setLoginName(e.target.value)}
                        placeholder="රෙජිස්ටර් වූ නම"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#14141a] border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-neutral-600 text-sm outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      මුරපදය (Password)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#14141a] border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-neutral-600 text-sm outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:brightness-110 active:scale-[0.99] font-bold text-white rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.4)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>පරීක්ෂා කර Authenticator OTP ලබාගන්න</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2 of Login: Enter/Verify 6-digit OTP */
                <form onSubmit={handleLoginVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      Authenticator 6-Digit OTP ඇතුළත් කරන්න
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-3.5 w-5 h-5 text-red-500" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#14141a] border border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30 rounded-xl text-amber-300 placeholder-neutral-600 text-2xl font-mono tracking-[0.2em] text-center outline-none transition shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('credentials');
                        setGeneratedLoginOtp(null);
                      }}
                      className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      නැවත මාරු වන්න
                    </button>
                    <button
                      type="submit"
                      disabled={loading || loginOtp.length !== 6}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 active:scale-[0.99] font-bold text-white rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.5)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>LK ONLINE වෙත ඇතුල් වන්න</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
