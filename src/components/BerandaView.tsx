import React, { useState, useMemo } from 'react';
import {
  Plus,
  ScanLine,
  Mic,
  Camera,
  Search,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react';
import { useKocek, DEFAULT_CATEGORIES } from '../context/KocekContext';
import { formatRupiah, getMonthName, getTodayString, formatDateIndo, matchesTransactionQuery } from '../utils/formatters';
import { MochiCharacter } from './MochiCharacter';
import { Transaction } from '../types';

interface BerandaViewProps {
  onOpenAddModal: (mode?: 'manual' | 'receipt' | 'voice', date?: string, category?: string, note?: string, amount?: number) => void;
  onOpenAddIncome?: () => void;
  onOpenMochiModal: () => void;
  onOpenGoalsModal: () => void;
  onOpenNabungModal: (goalId?: string) => void;
  onNavigateToAnalysis: () => void;
  onNavigateToCalendar: (date?: string) => void;
  onOpenNotifications: () => void;
  onSearch: (query: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({
  onOpenAddModal,
  onOpenAddIncome,
  onOpenMochiModal,
  onOpenGoalsModal,
  onOpenNabungModal,
  onOpenNotifications,
  onNavigateToCalendar,
  onSearch,
  onSelectTransaction,
}) => {
  const {
    summary,
    savingGoals,
    mochiState,
    currentMonth,
    transactions,
    theme,
    toggleTheme,
    unreadNotificationsCount,
    markNotificationsAsRead,
  } = useKocek();

  const [searchQuery, setSearchQuery] = useState('');
  const primaryGoal = savingGoals[0];
  const year = (currentMonth || '').split('-')[0] || '2026';
  const monthName = getMonthName(currentMonth);
  const today = getTodayString();
  const budgetPercentage = summary.budgetPercentage || 0;
  const goalPercentage = primaryGoal && primaryGoal.targetAmount > 0
    ? Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)
    : 0;

  const isDark = theme === 'dark';

  const recentTransactions = [...transactions]
    .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))
    .slice(0, 5);

  const formatShortDate = (d: string) => {
    const [, m, day] = d.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1] || ''}`;
  };

  return (
    <div className={`space-y-3.5 pb-6 select-none -mx-4 transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
      {/* Search & Top Action Row */}
      <section className={`relative px-4 pt-3 pb-2 transition-colors duration-200 ${isDark ? 'bg-[#0E1116]' : 'bg-white border-b border-slate-100'}`}>
        <div className="flex items-center justify-between gap-2.5">
          {/* Mochi Profile Trigger */}
          <button
            onClick={onOpenMochiModal}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-all border ${
              isDark ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0]' : 'bg-slate-100 border-slate-200'
            }`}
            title="Profil Dasai Mochi"
          >
            <MochiCharacter mood="happy" size={24} interactive={false} />
          </button>

          {/* Search Input */}
          <div
            className={`flex-1 h-9 rounded-full flex items-center px-3 gap-2 border transition-all ${
              isDark
                ? 'bg-[#181B24] border-[#252A36] focus-within:border-[#00F0D0]'
                : 'bg-slate-100 border-slate-200 focus-within:border-[#00F0D0]'
            }`}
          >
            <Search className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onSearch(searchQuery.trim());
                }
              }}
              enterKeyHint="search"
              placeholder="Cari transaksi atau rencana..."
              className={`w-full bg-transparent text-xs outline-none placeholder:text-xs ${
                isDark ? 'text-white placeholder-[#8E97A6]' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Instant Dropdown Search Results */}
          {searchQuery.trim() && (() => {
            const matchedTxs = transactions
              .filter(t => matchesTransactionQuery(t, searchQuery))
              .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
            const matchedGoals = savingGoals.filter(g =>
              g.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
            );
            const itemClass = `w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer border-b ${
              isDark ? 'border-[#202532] hover:bg-[#181B24]' : 'border-slate-100 hover:bg-slate-50'
            }`;

            return (
              <div
                className={`rounded-2xl border shadow-2xl overflow-hidden ${
                  isDark ? 'bg-[#12151C] border-[#252A36]' : 'bg-white border-slate-200'
                }`}
                style={{
                  position: 'absolute',
                  top: '52px',
                  left: '16px',
                  right: '16px',
                  zIndex: 60,
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}
              >
                {matchedGoals.slice(0, 2).map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => {
                      onOpenGoalsModal();
                      setSearchQuery('');
                    }}
                    className={itemClass}
                  >
                    <div className="min-w-0">
                      <span className={`text-xs font-semibold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {goal.icon} {goal.name}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                        Target tabungan
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#00F0D0] tabular-nums flex-shrink-0">
                      {Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))}%
                    </span>
                  </button>
                ))}

                {matchedTxs.length === 0 && matchedGoals.length === 0 && (
                  <p className={`p-4 text-xs text-center ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                    Tidak ada transaksi yang cocok.
                  </p>
                )}

                {matchedTxs.slice(0, 5).map(tx => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      onSelectTransaction(tx);
                      setSearchQuery('');
                    }}
                    className={itemClass}
                  >
                    <div className="min-w-0">
                      <span className={`text-xs font-semibold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {tx.note || tx.category}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                        {tx.category} • {formatShortDate(tx.date)} {tx.date.slice(0, 4)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold font-mono tabular-nums flex-shrink-0 ${
                        tx.type === 'income'
                          ? 'text-[#00F0D0]'
                          : tx.type === 'saving'
                          ? 'text-blue-400'
                          : 'text-[#FF4B72]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'saving' ? '' : '-'}
                      {formatRupiah(tx.amount)}
                    </span>
                  </button>
                ))}

                {matchedTxs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSearch(searchQuery.trim())}
                    className={`w-full px-3 py-2.5 text-xs font-bold text-center cursor-pointer ${
                      isDark ? 'text-[#00F0D0] hover:bg-[#181B24]' : 'text-teal-700 hover:bg-slate-50'
                    }`}
                  >
                    Lihat semua {matchedTxs.length} hasil
                  </button>
                )}
              </div>
            );
          })()}

          {/* Quick Right Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onOpenAddModal('receipt')}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all border ${
                isDark ? 'bg-[#181B24] text-[#8E97A6] hover:text-white border-[#252A36]' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
              title="Pindai Struk"
            >
              <ScanLine className="w-4 h-4 stroke-[2]" />
            </button>
            <button
              onClick={() => {
                markNotificationsAsRead();
                onOpenNotifications();
              }}
              className={`relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all border ${
                isDark ? 'bg-[#181B24] text-[#8E97A6] hover:text-white border-[#252A36]' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
              title="Notifikasi"
            >
              <Bell className="w-4 h-4 stroke-[2]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF4B72] rounded-full ring-1 ring-[#0E1116] animate-pulse" />
              )}
            </button>
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all border ${
                isDark ? 'bg-[#181B24] text-amber-300 hover:text-white border-[#252A36]' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
              }`}
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 stroke-[2]" /> : <Moon className="w-3.5 h-3.5 stroke-[2]" />}
            </button>
          </div>
        </div>
      </section>

      {/* Sisa Alokasi Section */}
      <section className="px-4 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-bold tracking-tight ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Rp</span>
              <h1 className={`text-3xl font-extrabold tracking-tight font-mono ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
                {formatRupiah(summary.remaining, { withPrefix: false })}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] font-semibold ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Sisa Alokasi
              </span>
            </div>
          </div>

          {/* Tambah Saldo Button */}
          <button
            onClick={() => onOpenAddIncome ? onOpenAddIncome() : onOpenAddModal('manual', undefined, 'Gaji / Pemasukan', 'Saldo Awal')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-[#00F0D0] text-[#0E1116] hover:brightness-110 active:scale-95 shadow-md shadow-[#00F0D0]/20 transition-all cursor-pointer"
            title="Tambah Saldo / Pemasukan"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Tambah Saldo</span>
          </button>
        </div>
      </section>

      {/* Quick Action Chips */}
      <section className="px-4">
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => onOpenAddModal('manual', today, 'Makanan', 'Makan siang', 25000)}
            className={`py-2 px-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0]/50 text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-800'
            }`}
          >
            <span className="text-base">🍜</span>
            <span className="text-[10px] font-semibold text-[#8E97A6] truncate max-w-full">Makan</span>
          </button>

          <button
            onClick={() => onOpenAddModal('manual', today, 'Makanan', 'Kopi / cemilan', 18000)}
            className={`py-2 px-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0]/50 text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-800'
            }`}
          >
            <span className="text-base">☕</span>
            <span className="text-[10px] font-semibold text-[#8E97A6] truncate max-w-full">Jajan</span>
          </button>

          {/* Dedicated Nabung Action */}
          <button
            onClick={() => onOpenNabungModal(primaryGoal?.id)}
            className={`py-2 px-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer active:scale-95 ${
              isDark ? 'bg-blue-950/40 border-blue-800/80 hover:border-blue-500 text-blue-300' : 'bg-blue-50 border-blue-200 shadow-xs text-blue-700'
            }`}
            title="Nabung ke Target Impian"
          >
            <span className="text-base">💰</span>
            <span className="text-[10px] font-extrabold truncate max-w-full text-blue-400">Nabung</span>
          </button>

          <button
            onClick={() => onOpenAddModal('receipt')}
            className={`py-2 px-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0]/50 text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-800'
            }`}
          >
            <Camera className={`w-4 h-4 ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`} />
            <span className="text-[10px] font-semibold text-[#8E97A6] truncate max-w-full">Struk</span>
          </button>

          <button
            onClick={() => onOpenAddModal('voice')}
            className={`py-2 px-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer active:scale-95 ${
              isDark ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0]/50 text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-800'
            }`}
          >
            <Mic className={`w-4 h-4 ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`} />
            <span className="text-[10px] font-semibold text-[#8E97A6] truncate max-w-full">Suara</span>
          </button>
        </div>
      </section>

      {/* Featured Saving Goal Card */}
      <section className="px-4">
        <div
          className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-all relative overflow-hidden ${
            isDark
              ? 'bg-[#181B24] border-[#252A36]'
              : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00F0D0]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1.5 z-10 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
                Program Tabungan Impian
              </span>
              {primaryGoal && (
                <span className="text-xs">{primaryGoal.icon}</span>
              )}
            </div>
            <h3 className={`text-sm font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
              {primaryGoal ? `${primaryGoal.name}: ${goalPercentage}% Tercapai` : 'Belum ada target tabungan'}
            </h3>
            <p className={`text-[11px] font-medium leading-snug ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
              {primaryGoal
                ? `Terkumpul ${formatRupiah(primaryGoal.currentAmount)} dari target ${formatRupiah(primaryGoal.targetAmount)}.`
                : 'Buat target tabungan pertamamu lewat tombol di bawah.'}
            </p>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenNabungModal(primaryGoal?.id)}
                className="btn-cyan-pill py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <span>💰 Nabung Sekarang</span>
              </button>
              <button
                type="button"
                onClick={onOpenGoalsModal}
                className={`py-1.5 px-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                  isDark
                    ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Target Lainnya</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-shrink-0 z-10 w-16 h-16 rounded-2xl flex items-center justify-center bg-[#222632] border border-[#2D3342] overflow-hidden self-end sm:self-auto">
            <MochiCharacter mood={mochiState.mood} size={56} interactive={true} onPoke={onOpenMochiModal} />
          </div>
        </div>
      </section>

      {/* Ringkasan Anggaran Card */}
      <section className="px-4 space-y-2.5">
        <div className={`rounded-2xl p-4 border space-y-3 transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
              Ringkasan {monthName} {year}
            </h3>
            <span className={`text-[10px] font-bold ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
              Budget Terpakai: {budgetPercentage}%
            </span>
          </div>

          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#222632]' : 'bg-slate-100'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDark ? 'bg-[#00F0D0] shadow-sm shadow-[#00F0D0]/50' : 'bg-teal-600 shadow-sm shadow-teal-600/30'
              }`}
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className={`rounded-xl p-2 border ${isDark ? 'bg-[#222632] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] block ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Pemasukan</span>
              <span className={`font-bold font-mono text-[11px] ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
                {formatRupiah(summary.income)}
              </span>
            </div>
            <div className={`rounded-xl p-2 border ${isDark ? 'bg-[#222632] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] block ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Pengeluaran</span>
              <span className="font-bold font-mono text-[11px] text-[#FF4B72]">
                {formatRupiah(summary.expense)}
              </span>
            </div>
            <div className={`rounded-xl p-2 border ${isDark ? 'bg-[#222632] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] block ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Ditabung</span>
              <span className="font-bold font-mono text-[11px] text-blue-400">
                {formatRupiah(summary.saved)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Transaksi Terakhir List or Empty State */}
      {recentTransactions.length > 0 ? (
        <section className="px-4">
          <div className={`rounded-2xl p-4 border space-y-3 transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
              Transaksi Terakhir
            </h3>
            <div className="space-y-2.5">
              {recentTransactions.map(tx => {
                const catInfo = DEFAULT_CATEGORIES.find(c => tx.category.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]));
                const isIncome = tx.type === 'income';
                const sign = isIncome ? '+' : '-';
                const colorClass = isIncome
                  ? isDark ? 'text-[#00F0D0]' : 'text-teal-700'
                  : tx.type === 'saving'
                  ? 'text-blue-400'
                  : 'text-[#FF4B72]';

                return (
                  <div key={tx.id} className="flex items-center gap-3 text-xs">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${isDark ? 'bg-[#222632]' : 'bg-slate-100'}`}>
                      {catInfo?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`block font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {tx.merchant || tx.note || tx.category}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                        {tx.category} · {formatShortDate(tx.date)}
                      </span>
                    </div>
                    <span className={`font-bold font-mono text-[11px] ${colorClass}`}>
                      {sign}{formatRupiah(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <section className="px-4">
          <div className={`rounded-2xl p-5 border text-center space-y-2.5 transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
            <div className={`w-11 h-11 rounded-full mx-auto flex items-center justify-center text-lg ${isDark ? 'bg-[#00F0D0]/10 text-[#00F0D0]' : 'bg-teal-50 text-teal-600'}`}>
              📝
            </div>
            <div>
              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Belum ada transaksi di bulan ini
              </h4>
              <p className={`text-[11px] mt-1 max-w-xs mx-auto leading-relaxed ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                Catat pengeluaran harianmu agar Dasai Mochi bisa menganalisis keuanganmu.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
