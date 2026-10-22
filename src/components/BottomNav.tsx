import React from 'react';
import { House, Calendar as CalendarIcon, ChartPie, User, Plus } from 'lucide-react';
import { useKocek } from '../context/KocekContext';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  const { theme } = useKocek();
  const isDark = theme === 'dark';

  return (
    <nav
      className={`sticky bottom-0 z-40 w-full transition-colors duration-200 ${
        isDark
          ? 'bg-[#11141B]/95 backdrop-blur-md border-t border-[#202532]'
          : 'bg-white/95 backdrop-blur-md border-t border-slate-200/80'
      }`}
    >
      <div className="max-w-md mx-auto px-2 h-13 flex items-center justify-around relative">
        {/* Beranda */}
        <button
          onClick={() => onTabChange('beranda')}
          className={`flex-1 py-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${
            activeTab === 'beranda'
              ? isDark ? 'text-[#00F0D0]' : 'text-teal-700'
              : isDark ? 'text-[#848E9C] hover:text-white' : 'text-slate-400 hover:text-slate-800'
          }`}
          title="Beranda"
        >
          <House
            className={`w-4.5 h-4.5 ${
              activeTab === 'beranda'
                ? isDark
                  ? 'stroke-[2.5] fill-[#00F0D0]/20'
                  : 'stroke-[2.5] fill-teal-700/20'
                : 'stroke-[1.7]'
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-1 leading-none ${
              activeTab === 'beranda'
                ? isDark
                  ? 'font-bold text-[#00F0D0]'
                  : 'font-bold text-teal-700'
                : 'font-medium'
            }`}
          >
            Beranda
          </span>
          {activeTab === 'beranda' && (
            <span
              className={`w-1 h-1 rounded-full mt-0.5 shadow-sm ${
                isDark ? 'bg-[#00F0D0] shadow-[#00F0D0]' : 'bg-teal-600 shadow-teal-600/50'
              }`}
            />
          )}
        </button>

        {/* Transaksi & Kalender */}
        <button
          onClick={() => onTabChange('transaksi')}
          className={`flex-1 py-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${
            activeTab === 'transaksi'
              ? isDark ? 'text-[#00F0D0]' : 'text-teal-700'
              : isDark ? 'text-[#848E9C] hover:text-white' : 'text-slate-400 hover:text-slate-800'
          }`}
          title="Transaksi & Kalender"
        >
          <CalendarIcon
            className={`w-4.5 h-4.5 ${
              activeTab === 'transaksi'
                ? isDark
                  ? 'stroke-[2.5] fill-[#00F0D0]/20'
                  : 'stroke-[2.5] fill-teal-700/20'
                : 'stroke-[1.7]'
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-1 leading-none ${
              activeTab === 'transaksi'
                ? isDark
                  ? 'font-bold text-[#00F0D0]'
                  : 'font-bold text-teal-700'
                : 'font-medium'
            }`}
          >
            Kalender
          </span>
          {activeTab === 'transaksi' && (
            <span
              className={`w-1 h-1 rounded-full mt-0.5 shadow-sm ${
                isDark ? 'bg-[#00F0D0] shadow-[#00F0D0]' : 'bg-teal-600 shadow-teal-600/50'
              }`}
            />
          )}
        </button>

        {/* Center Floating Plus Action */}
        <div className="flex-1 flex items-center justify-center -translate-y-2.5">
          <button
            onClick={onOpenAddModal}
            className={`w-10 h-10 rounded-full bg-[#00F0D0] hover:bg-[#00DBBE] text-[#0E1116] flex items-center justify-center shadow-lg shadow-[#00F0D0]/30 active:scale-90 transition-all cursor-pointer border-2 ${
              isDark ? 'border-[#11141B]' : 'border-white'
            }`}
            title="Catat Cepat Transaksi"
            aria-label="Catat Cepat Transaksi"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Analisis */}
        <button
          onClick={() => onTabChange('analisis')}
          className={`flex-1 py-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${
            activeTab === 'analisis'
              ? isDark ? 'text-[#00F0D0]' : 'text-teal-700'
              : isDark ? 'text-[#848E9C] hover:text-white' : 'text-slate-400 hover:text-slate-800'
          }`}
          title="Analisis"
        >
          <ChartPie
            className={`w-4.5 h-4.5 ${
              activeTab === 'analisis'
                ? isDark
                  ? 'stroke-[2.5] fill-[#00F0D0]/20'
                  : 'stroke-[2.5] fill-teal-700/20'
                : 'stroke-[1.7]'
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-1 leading-none ${
              activeTab === 'analisis'
                ? isDark
                  ? 'font-bold text-[#00F0D0]'
                  : 'font-bold text-teal-700'
                : 'font-medium'
            }`}
          >
            Analisis
          </span>
          {activeTab === 'analisis' && (
            <span
              className={`w-1 h-1 rounded-full mt-0.5 shadow-sm ${
                isDark ? 'bg-[#00F0D0] shadow-[#00F0D0]' : 'bg-teal-600 shadow-teal-600/50'
              }`}
            />
          )}
        </button>

        {/* Akun */}
        <button
          onClick={() => onTabChange('akun')}
          className={`flex-1 py-1 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${
            activeTab === 'akun'
              ? isDark ? 'text-[#00F0D0]' : 'text-teal-700'
              : isDark ? 'text-[#848E9C] hover:text-white' : 'text-slate-400 hover:text-slate-800'
          }`}
          title="Akun & Mochi"
        >
          <User
            className={`w-4.5 h-4.5 ${
              activeTab === 'akun'
                ? isDark
                  ? 'stroke-[2.5] fill-[#00F0D0]/20'
                  : 'stroke-[2.5] fill-teal-700/20'
                : 'stroke-[1.7]'
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-1 leading-none ${
              activeTab === 'akun'
                ? isDark
                  ? 'font-bold text-[#00F0D0]'
                  : 'font-bold text-teal-700'
                : 'font-medium'
            }`}
          >
            Akun
          </span>
          {activeTab === 'akun' && (
            <span
              className={`w-1 h-1 rounded-full mt-0.5 shadow-sm ${
                isDark ? 'bg-[#00F0D0] shadow-[#00F0D0]' : 'bg-teal-600 shadow-teal-600/50'
              }`}
            />
          )}
        </button>
      </div>
    </nav>
  );
};
