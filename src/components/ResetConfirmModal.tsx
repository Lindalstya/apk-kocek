import React from 'react';
import { RotateCcw, Sparkles, Trash2, ArrowRight, X, Play } from 'lucide-react';
import { useKocek } from '../context/KocekContext';
import { MochiCharacter } from './MochiCharacter';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ isOpen, onClose }) => {
  const { theme, resetToCleanSlate, resetToDefault, restartAppTotally } = useKocek();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleCleanStart = () => {
    resetToCleanSlate();
    onClose();
  };

  const handleResetToDemo = () => {
    resetToDefault();
    onClose();
  };

  const handleFullRestart = () => {
    onClose();
    restartAppTotally();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`rounded-t-3xl sm:rounded-3xl max-w-sm w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border transition-colors ${
          isDark ? 'bg-[#0E1116] border-[#252A36] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 pt-4 pb-3 flex items-center justify-between border-b ${
            isDark ? 'border-[#202532] bg-[#12151C]' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">Mulai dari Awal</h2>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Pilih cara memulai ulang aplikasi Kocek
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
              isDark
                ? 'bg-[#181B24] text-slate-300 hover:text-white border border-[#252A36]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Mochi Greeting Card */}
        <div className="p-4 overflow-y-auto space-y-3">
          <div
            className="p-3.5 rounded-2xl flex items-center gap-3"
            style={{
              background: isDark ? 'rgba(0, 240, 208, 0.08)' : 'rgba(0, 240, 208, 0.15)',
              border: '1px solid rgba(0, 240, 208, 0.35)',
            }}
          >
            <MochiCharacter mood="happy" size={54} interactive={false} />
            <div className="flex-1 min-w-0 text-left">
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Siap mulai dari awal?
              </span>
              <p className={`text-[11px] leading-relaxed mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Kamu bisa mulai dengan data bersih kosong, kembali ke pembukaan awal (splash/onboarding), atau muat data demo.
              </p>
            </div>
          </div>

          {/* Option 1: Clean Slate (Data Kosong Rp 0) */}
          <button
            type="button"
            onClick={handleCleanStart}
            className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer active:scale-98 ${
              isDark
                ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0] hover:bg-[#1E2330]'
                : 'bg-slate-50 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-[#00F0D0] text-[#06231F] flex items-center justify-center flex-shrink-0 font-extrabold shadow-sm">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Mulai Baru Bersih (Data Kosong Rp 0)
                </span>
                <span className="text-[10px] font-extrabold text-[#00F0D0] bg-[#00F0D0]/15 px-2 py-0.5 rounded-full">
                  Rekomendasi
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Hapus transaksi demo Andi. Mulai mencatat pengeluaran & tabungan aslimu sendiri dari Rp 0.
              </p>
            </div>
          </button>

          {/* Option 2: Full Restart (Onboarding & Splash from scratch) */}
          <button
            type="button"
            onClick={handleFullRestart}
            className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer active:scale-98 ${
              isDark
                ? 'bg-[#181B24] border-[#252A36] hover:border-amber-400 hover:bg-[#1E2330]'
                : 'bg-slate-50 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-extrabold shadow-sm">
              <Play className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Ulangi dari Pembukaan (Splash & Masuk)
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Kembali ke intro pembuka Dasai Mochi dan layar Masuk / Daftar akun baru seperti baru pertama kali buka.
              </p>
            </div>
          </button>

          {/* Option 3: Reset to Demo Andi */}
          <button
            type="button"
            onClick={handleResetToDemo}
            className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer active:scale-98 ${
              isDark
                ? 'bg-[#181B24] border-[#252A36] hover:border-slate-500'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold ${
              isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}>
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Muat Ulang Data Contoh (Demo Andi)
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Isi kembali contoh transaksi kopi, nasi padang, dan target tabungan Laptop untuk melihat simulasi.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl border text-xs font-bold cursor-pointer mt-2 ${
              isDark ? 'border-[#252A36] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
