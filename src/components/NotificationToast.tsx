import React from 'react';
import { X, Bell, ChevronRight } from 'lucide-react';
import { useKocek } from '../context/KocekContext';

interface NotificationToastProps {
  onOpenNotifications: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ onOpenNotifications }) => {
  const { activeToast, dismissToast, theme } = useKocek();

  if (!activeToast) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed top-3 left-0 right-0 z-50 px-3 flex justify-center pointer-events-none animate-in slide-in-from-top-4 fade-in duration-200">
      <div
        onClick={() => {
          dismissToast();
          onOpenNotifications();
        }}
        className={`w-full max-w-sm rounded-2xl p-3 border shadow-2xl flex items-start gap-3 pointer-events-auto cursor-pointer transition-all active:scale-[0.98] ${
          isDark
            ? 'bg-[#181B24] border-[#00F0D0]/50 text-white shadow-[#00F0D0]/10'
            : 'bg-white border-teal-300 text-slate-900 shadow-teal-500/10'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5 ${
            isDark ? 'bg-[#00F0D0]/20 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'
          }`}
        >
          {activeToast.icon || '🔔'}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-xs font-bold truncate ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
              {activeToast.title}
            </span>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">{activeToast.time}</span>
          </div>
          <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
            {activeToast.message}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#00F0D0]">
            <span>Lihat notifikasi</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            dismissToast();
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
          }`}
          title="Tutup Notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
