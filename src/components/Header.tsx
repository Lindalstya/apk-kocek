import React from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useKocek } from '../context/KocekContext';
import { MochiCharacter } from './MochiCharacter';

interface HeaderProps {
  onOpenMochiModal: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMochiModal,
  onOpenNotifications,
}) => {
  const { theme, toggleTheme, unreadNotificationsCount, markNotificationsAsRead } = useKocek();
  const isDark = theme === 'dark';

  return (
    <div
      className={`w-full sticky top-0 z-30 px-3.5 py-2.5 select-none transition-colors duration-200 ${
        isDark
          ? 'bg-[#0E1116] border-b border-[#202532] text-white'
          : 'bg-white border-b border-slate-200/80 text-slate-900'
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 cursor-pointer"
            onClick={onOpenMochiModal}
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Kocek
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border leading-none ${
                  isDark
                    ? 'bg-[#00F0D0]/15 text-[#00F0D0] border-[#00F0D0]/30'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}
              >
                Fintech
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
              isDark
                ? 'bg-[#181B24] text-amber-300 hover:bg-[#222632] border border-[#252A36]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
            title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle Dark/Light Mode"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 stroke-[2.2]" /> : <Moon className="w-3.5 h-3.5 stroke-[2.2]" />}
          </button>

          {/* Mochi Profile Button */}
          <button
            onClick={onOpenMochiModal}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 overflow-hidden border ${
              isDark
                ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0]/50'
                : 'bg-slate-100 border-slate-200'
            }`}
            title="Dasai Mochi Companion"
          >
            <MochiCharacter mood="happy" size={24} interactive={false} />
          </button>

          {/* Notification Bell Button */}
          <button
            onClick={() => {
              markNotificationsAsRead();
              onOpenNotifications();
            }}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 border ${
              isDark
                ? 'bg-[#181B24] text-slate-200 hover:bg-[#222632] border-[#252A36]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
            title="Notifikasi"
          >
            <Bell className="w-3.5 h-3.5 stroke-[2]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#FF4B72] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-[#0E1116] animate-in zoom-in-50">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </header>
    </div>
  );
};
