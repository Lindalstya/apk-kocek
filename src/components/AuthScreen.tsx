import React, { useState } from 'react';
import { MochiCharacter } from './MochiCharacter';

interface AuthScreenProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
  onShowSplash?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onShowSplash }) => {
  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hashPassword = async (text: string): Promise<string> => {
    try {
      const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return `p:${text}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    const pass = password;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Format email belum benar.');
      return;
    }

    if (mode === 'daftar' && !name.trim()) {
      setErrorMsg('Nama belum diisi.');
      return;
    }

    if (pass.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    const hashed = await hashPassword(`${trimmedEmail}|${pass}`);

    let accounts: Array<{ name: string; email: string; pass: string }> = [];
    try {
      const stored = localStorage.getItem('kocek_accounts_v1');
      if (stored) accounts = JSON.parse(stored);
      if (!Array.isArray(accounts)) accounts = [];
    } catch {
      accounts = [];
    }

    const existing = accounts.find(a => a.email === trimmedEmail);

    if (mode === 'daftar') {
      if (existing) {
        setErrorMsg('Email sudah terdaftar, silakan masuk.');
        setIsSubmitting(false);
        return;
      }
      accounts.push({ name: name.trim(), email: trimmedEmail, pass: hashed });
      try {
        localStorage.setItem('kocek_accounts_v1', JSON.stringify(accounts));
      } catch (err) {
        console.warn(err);
      }
      setIsSubmitting(false);
      onLoginSuccess({ name: name.trim(), email: trimmedEmail });
      return;
    }

    // mode === 'masuk'
    if (!existing) {
      setErrorMsg('Akun belum terdaftar. Silakan daftar terlebih dahulu atau gunakan Akun Demo.');
      setIsSubmitting(false);
      return;
    }

    if (existing.pass !== hashed) {
      setErrorMsg('Kata sandi salah.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onLoginSuccess({ name: existing.name, email: trimmedEmail });
  };

  const handleDemoLogin = () => {
    onLoginSuccess({ name: 'Andi', email: 'andi@student.ac.id' });
  };

  const handleFreshStart = () => {
    try {
      localStorage.removeItem('kocek_transactions_v1');
      localStorage.removeItem('kocek_saving_goals_v1');
      localStorage.removeItem('kocek_budget_v1');
      localStorage.removeItem('kocek_notifications_v1');
    } catch {}
    onLoginSuccess({ name: 'Saya', email: 'saya@kocek.app' });
  };

  return (
    <div className="min-h-screen bg-[#080B0F] flex justify-center font-sans sm:py-4 select-none">
      <div className="w-full max-w-md min-h-screen sm:min-h-[900px] flex flex-col bg-[#0E1116] text-white relative shadow-2xl sm:rounded-[36px] sm:border border-[#252A36] overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-[#00F0D0] via-[#00D2B3] to-[#00998A] text-[#06231F] text-center px-5 pt-8 pb-7 rounded-b-[40px] relative overflow-hidden">
          <div className="absolute w-56 h-56 rounded-full bg-white/15 -top-24 -right-16 pointer-events-none" />
          <div className="absolute w-40 h-40 rounded-full bg-white/10 -bottom-16 -left-10 pointer-events-none" />

          {onShowSplash && (
            <button
              type="button"
              onClick={onShowSplash}
              className="absolute top-4 left-4 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#06231F]/15 hover:bg-[#06231F]/25 text-[#06231F] transition-all cursor-pointer"
            >
              ‹ Splash
            </button>
          )}

          <div className="relative flex flex-col items-center">
            <MochiCharacter mood="happy" size={110} interactive={false} />
            <h1 className="text-3xl font-black tracking-tight mt-1 text-[#06231F]">
              Kocek
            </h1>
            <p className="text-xs font-semibold opacity-90 mt-0.5">
              {mode === 'masuk' ? 'Senang ketemu lagi! Yuk lanjut nabung.' : 'Mulai kebiasaan menabungmu hari ini.'}
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3.5 flex-1 animate-in fade-in duration-200">
          {/* Tabs */}
          <div className="flex p-1 rounded-full bg-[#181B24] border border-[#252A36]">
            <button
              type="button"
              onClick={() => {
                setMode('masuk');
                setErrorMsg('');
              }}
              className={`flex-1 h-9 rounded-full font-extrabold text-xs cursor-pointer transition-all ${
                mode === 'masuk' ? 'bg-[#00F0D0] text-[#06231F] shadow-xs' : 'text-[#8E97A6] hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('daftar');
                setErrorMsg('');
              }}
              className={`flex-1 h-9 rounded-full font-extrabold text-xs cursor-pointer transition-all ${
                mode === 'daftar' ? 'bg-[#00F0D0] text-[#06231F] shadow-xs' : 'text-[#8E97A6] hover:text-white'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Name Field (Sign up only) */}
          {mode === 'daftar' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nama kamu"
                autoComplete="name"
                className="w-full h-11 rounded-xl border border-[#252A36] bg-[#181B24] text-white px-3.5 text-sm outline-none focus:border-[#00F0D0]"
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              className="w-full h-11 rounded-xl border border-[#252A36] bg-[#181B24] text-white px-3.5 text-sm outline-none focus:border-[#00F0D0]"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'}
                className="w-full h-11 rounded-xl border border-[#252A36] bg-[#181B24] text-white pl-3.5 pr-18 text-sm outline-none focus:border-[#00F0D0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 h-7 px-2 rounded-lg text-xs font-bold text-[#00F0D0] hover:bg-slate-800 cursor-pointer"
              >
                {showPassword ? 'Sembunyi' : 'Lihat'}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <p role="alert" className="text-xs font-bold text-[#FF4B72] mt-0.5">
              {errorMsg}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-1 rounded-xl bg-[#00F0D0] text-[#06231F] font-extrabold text-sm cursor-pointer shadow-lg shadow-[#00F0D0]/25 active:scale-98 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Tunggu sebentar...' : mode === 'masuk' ? 'Masuk ke Kocek' : 'Buat Akun Sekarang'}
          </button>

          {/* Quick Start Buttons */}
          <div className="mt-2 p-3 rounded-2xl border border-[#252A36] bg-[#141824] text-center space-y-2">
            <span className="text-[11px] text-slate-400 block font-medium">Mau coba langsung tanpa daftar?</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFreshStart}
                className="py-2 px-2.5 rounded-xl bg-[#00F0D0] text-[#06231F] text-xs font-extrabold transition-all cursor-pointer active:scale-95 shadow-sm text-center"
                title="Mulai dengan data kosong Rp 0"
              >
                Mulai Baru (Rp 0) ✨
              </button>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="py-2 px-2.5 rounded-xl border border-[#00F0D0]/40 text-[#00F0D0] hover:bg-[#00F0D0]/10 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                title="Coba simulasi dengan data contoh Andi"
              >
                Akun Demo Andi 🚀
              </button>
            </div>
          </div>

          <p className="text-[10px] text-[#6B7482] text-center mt-auto">
            Akun dan data tersimpan di perangkat ini. Sekali masuk, kamu tidak perlu login lagi.
          </p>
        </form>
      </div>
    </div>
  );
};
