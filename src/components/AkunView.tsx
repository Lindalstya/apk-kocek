import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Volume2,
  Bell,
  Cpu,
  Download,
  FileText,
  ChevronRight,
  Send,
  RotateCcw,
} from 'lucide-react';
import { useKocek } from '../context/KocekContext';

interface AkunViewProps {
  onOpenMochiModal: () => void;
  onOpenResetModal: () => void;
}

export const AkunView: React.FC<AkunViewProps> = ({
  onOpenMochiModal,
  onOpenResetModal,
}) => {
  const {
    user,
    mochiDevice,
    toggleMochiSound,
    exportJSON,
    exportCSV,
    sendNotification,
    theme,
    toggleTheme,
  } = useKocek();

  const [savingReminder, setSavingReminder] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isDark = theme === 'dark';

  return (
    <div className={`space-y-4 pb-24 select-none pt-2 transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
      {/* Profile Card */}
      <section className={`rounded-2xl p-4 border flex items-center gap-3.5 transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-900'}`}>
        <div className="w-12 h-12 rounded-full bg-[#00F0D0] text-[#0E1116] flex items-center justify-center text-xl font-black shadow-md shadow-[#00F0D0]/20 flex-shrink-0">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={`text-base font-extrabold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {user.name}
          </h2>
          <p className={`text-xs truncate ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
            {user.email}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'text-[#00F0D0] bg-[#00F0D0]/10 border-[#00F0D0]/30'
                  : 'text-teal-700 bg-teal-50 border-teal-200'
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>
      </section>

      {/* Settings List */}
      <section className={`rounded-2xl p-4.5 border divide-y transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36] divide-[#252A36] text-white' : 'bg-white border-slate-200/80 divide-slate-100 text-slate-900'}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider pb-3 ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
          Pengaturan Aplikasi
        </h3>

        {/* Dark/Light Mode */}
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#222632] text-amber-300' : 'bg-slate-100 text-slate-700'}`}>
              {isDark ? <Moon className="w-4 h-4 stroke-[2]" /> : <Sun className="w-4 h-4 stroke-[2]" />}
            </div>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isDark ? 'Mode Gelap (Aktif)' : 'Mode Terang (Aktif)'}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                {isDark ? 'Tema Bitget Wallet matte obsidian & cyan' : 'Tampilan bersih terang'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              isDark ? 'bg-[#00F0D0]' : 'bg-slate-300'
            }`}
            title="Ganti Mode Tema"
          >
            <span
              className={`w-4 h-4 rounded-full bg-[#0E1116] absolute top-1 transition-transform ${
                isDark ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#222632] text-[#00F0D0]' : 'bg-teal-50 text-teal-600'}`}>
              <Volume2 className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Efek Suara Dasai Mochi
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Audio feedback 8-bit saat menabung
              </span>
            </div>
          </div>
          <button
            onClick={toggleMochiSound}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              mochiDevice.soundEnabled ? 'bg-[#00F0D0]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-[#0E1116] absolute top-1 transition-transform ${
                mochiDevice.soundEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Reminder Toggle */}
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#222632] text-[#00F0D0]' : 'bg-teal-50 text-teal-600'}`}>
              <Bell className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Pengingat Menabung
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Evaluasi rutin mingguan
              </span>
            </div>
          </div>
          <button
            onClick={() => setSavingReminder(!savingReminder)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              savingReminder ? 'bg-[#00F0D0]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-[#0E1116] absolute top-1 transition-transform ${
                savingReminder ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Kirim Notifikasi Simulasi */}
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
              <Send className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Kirim Notifikasi Simulasi
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Tes pengingat Mochi & pop-up banner
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sendNotification({
                title: 'Pengingat dari Dasai Mochi 👾',
                message: 'Halo Andi! Ini adalah simulasi notifikasi. Jangan lupa catat pengeluaran dan sisihkan tabungan hari ini ya!',
                icon: '✨',
                type: 'mochi',
              });
            }}
            className="py-1 px-3 text-[11px] font-bold rounded-lg cursor-pointer transition-all active:scale-95 bg-[#00F0D0] text-[#06231F]"
          >
            Kirim Sekarang
          </button>
        </div>

        {/* Mochi Hardware Device */}
        <div
          onClick={onOpenMochiModal}
          className={`py-3 flex items-center justify-between cursor-pointer rounded-xl px-1 transition-colors ${
            isDark ? 'hover:bg-[#222632]/60' : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#222632] text-[#00F0D0]' : 'bg-teal-50 text-teal-600'}`}>
              <Cpu className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Dasai Mochi Hardware
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Status: {mochiDevice.connected ? 'Terhubung (BLE)' : 'Terputus'} · Bat: {mochiDevice.battery}%
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </section>

      {/* Data & Backup */}
      <section className={`rounded-2xl p-4.5 border space-y-3 transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 text-slate-900'}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
          Data & Cadangan
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={exportJSON}
            className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left cursor-pointer transition-colors active:scale-95 ${
              isDark
                ? 'bg-[#222632] hover:bg-[#2A303F] border-[#2A303F] text-white'
                : 'bg-[#F8FAF8] hover:bg-slate-100 border-slate-200/80 text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-[#00F0D0]" />
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Backup JSON
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Cadangan data
              </span>
            </div>
          </button>

          <button
            onClick={exportCSV}
            className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left cursor-pointer transition-colors active:scale-95 ${
              isDark
                ? 'bg-[#222632] hover:bg-[#2A303F] border-[#2A303F] text-white'
                : 'bg-[#F8FAF8] hover:bg-slate-100 border-slate-200/80 text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-[#00F0D0]" />
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Export CSV
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Format Excel
              </span>
            </div>
          </button>
        </div>

        {/* Mulai dari Awal */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenResetModal}
            className="w-full py-3 px-3 rounded-xl btn-cyan-pill flex items-center justify-center gap-2 text-xs font-extrabold cursor-pointer shadow-md active:scale-98 transition-all"
            title="Mulai Ulang dari Awal (Reset & Buka)"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Mulai dari Awal</span>
          </button>
          <p className={`text-[10px] text-center mt-1.5 ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
            Mulai baru dengan data bersih Rp 0, ulangi intro pembukaan, atau muat data demo
          </p>
        </div>

        {/* Logout */}
        <div className="pt-2">
          {showLogoutConfirm ? (
            <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-[#222632] border-[#2A303F]' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                Yakin mau keluar? Kamu perlu masuk lagi saat membuka Kocek berikutnya.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.dispatchEvent(new Event('kocek-logout'));
                  }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  style={{ background: '#00F0D0', color: '#06231F' }}
                >
                  Ya, Keluar
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                    isDark ? 'border-[#2A303F] text-slate-300' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer"
              style={{
                borderColor: 'rgba(0, 240, 208, 0.5)',
                background: 'rgba(0, 240, 208, 0.08)',
                color: isDark ? '#00F0D0' : '#0F766E'
              }}
            >
              Keluar dari Akun
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
