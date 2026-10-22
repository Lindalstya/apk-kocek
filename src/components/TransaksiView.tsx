import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  Trash2,
  X,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Filter,
  ChevronLeft,
  ChevronRight,
  List,
  Wallet,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { useKocek, DEFAULT_CATEGORIES } from '../context/KocekContext';
import { formatRupiah, formatDateIndo, matchesTransactionQuery, getTodayString } from '../utils/formatters';
import { Transaction } from '../types';

const MONTH_NAMES_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_INDO = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

interface TransaksiViewProps {
  onOpenAddModal: (mode?: 'manual' | 'receipt' | 'voice', date?: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
  initialQuery?: string;
  initialView?: 'calendar' | 'list';
  initialDate?: string;
}

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  onOpenAddModal,
  onSelectTransaction,
  initialQuery = '',
  initialView = 'calendar',
  initialDate,
}) => {
  const { transactions, theme, currentMonth, budget, updateBudgetLimit } = useKocek();
  const isDark = theme === 'dark';

  const todayStr = getTodayString();
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>(
    initialQuery.trim() ? 'list' : initialView
  );

  // When initialQuery changes, switch to list view
  useEffect(() => {
    if (initialQuery.trim()) {
      setActiveTab('list');
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Calendar states
  const todayParts = useMemo(() => {
    const parts = todayStr.split('-').map(Number);
    return { year: parts[0] || 2026, month: (parts[1] || 10) - 1, day: parts[2] || 21 };
  }, [todayStr]);

  const [calYear, setCalYear] = useState<number>(() => {
    if (initialDate) {
      const p = initialDate.split('-').map(Number);
      if (p[0]) return p[0];
    }
    return todayParts.year;
  });

  const [calMonth, setCalMonth] = useState<number>(() => {
    if (initialDate) {
      const p = initialDate.split('-').map(Number);
      if (p[1]) return p[1] - 1;
    }
    return todayParts.month;
  });

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);

  // List view states
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'saving'>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<'all' | 'current'>('current');
  const [deleteConfirmTxId, setDeleteConfirmTxId] = useState<string | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setCalYear(todayParts.year);
    setCalMonth(todayParts.month);
    setSelectedDate(todayStr);
  };

  // Calendar calculations
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Monday = 0
  const activeMonthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;

  // Pre-index transactions by date
  const txMapByDate = useMemo(() => {
    const map: Record<string, { txs: Transaction[]; expense: number; income: number; saving: number }> = {};
    transactions.forEach(tx => {
      if (!map[tx.date]) {
        map[tx.date] = { txs: [], expense: 0, income: 0, saving: 0 };
      }
      map[tx.date].txs.push(tx);
      if (tx.type === 'expense') map[tx.date].expense += tx.amount;
      else if (tx.type === 'income') map[tx.date].income += tx.amount;
      else if (tx.type === 'saving') map[tx.date].saving += tx.amount;
    });
    return map;
  }, [transactions]);

  // Selected date details
  const selectedDayData = txMapByDate[selectedDate] || { txs: [], expense: 0, income: 0, saving: 0 };
  const isSelectedDateToday = selectedDate === todayStr;

  // Monthly Budget calculations for the currently viewed calendar month
  const monthTxs = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(activeMonthKey));
  }, [transactions, activeMonthKey]);

  const monthExpense = useMemo(() => {
    return monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxs]);

  const monthIncome = useMemo(() => {
    return monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxs]);

  const monthBudgetLimit = budget?.limit || 3000000;
  const monthRemainingBudget = monthBudgetLimit - monthExpense;
  const monthBudgetPct = monthBudgetLimit > 0
    ? Math.min(100, Math.round((monthExpense / monthBudgetLimit) * 100))
    : 0;
  const isMonthOverBudget = monthExpense > monthBudgetLimit;

  const remainingDaysInMonth = useMemo(() => {
    if (calYear === todayParts.year && calMonth === todayParts.month) {
      return Math.max(1, daysInMonth - todayParts.day + 1);
    }
    return daysInMonth;
  }, [calYear, calMonth, todayParts, daysInMonth]);

  const dailyBudgetAllowance = useMemo(() => {
    if (monthRemainingBudget <= 0) return 0;
    return Math.round(monthRemainingBudget / remainingDaysInMonth);
  }, [monthRemainingBudget, remainingDaysInMonth]);

  // Edit Budget state
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState<number>(monthBudgetLimit);

  const handleOpenEditBudget = () => {
    setTempBudgetInput(monthBudgetLimit);
    setIsEditBudgetOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempBudgetInput > 0) {
      updateBudgetLimit(tempBudgetInput);
      setIsEditBudgetOpen(false);
    }
  };

  // List view filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (selectedMonthFilter === 'current' && !tx.date.startsWith(currentMonth)) {
        return false;
      }
      if (filterType === 'expense' && tx.type !== 'expense') return false;
      if (filterType === 'income' && tx.type !== 'income') return false;
      if (filterType === 'saving' && tx.type !== 'saving') return false;
      if (searchQuery.trim()) {
        return matchesTransactionQuery(tx, searchQuery);
      }
      return true;
    });
  }, [transactions, filterType, searchQuery, selectedMonthFilter, currentMonth]);

  // List view totals
  const stats = useMemo(() => {
    let expenseTotal = 0;
    let incomeTotal = 0;
    let savingTotal = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'expense') expenseTotal += tx.amount;
      else if (tx.type === 'income') incomeTotal += tx.amount;
      else if (tx.type === 'saving') savingTotal += tx.amount;
    });

    return {
      expense: expenseTotal,
      income: incomeTotal,
      saving: savingTotal,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Grouped by Date for list view
  const groupedByDate = useMemo(() => {
    const groups: Record<string, { txs: Transaction[]; dayExpense: number; dayIncome: number }> = {};
    filteredTransactions.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = { txs: [], dayExpense: 0, dayIncome: 0 };
      }
      groups[tx.date].txs.push(tx);
      if (tx.type === 'expense') groups[tx.date].dayExpense += tx.amount;
      else if (tx.type === 'income') groups[tx.date].dayIncome += tx.amount;
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const renderCategoryIcon = (category: string, type: string) => {
    const lower = category.toLowerCase();
    if (type === 'saving' || lower.includes('tabung')) {
      return (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
          💰
        </div>
      );
    }
    const cat = DEFAULT_CATEGORIES.find(c => lower.includes(c.name.toLowerCase().split(' ')[0]));
    return (
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${isDark ? 'bg-[#222632]' : 'bg-slate-100'}`}>
        {cat?.icon || '📦'}
      </div>
    );
  };

  return (
    <div className={`space-y-3.5 pb-24 select-none pt-2 transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
            Transaksi & Kalender
          </h1>
          <p className={`text-[11px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
            {activeTab === 'calendar' ? 'Pantau catatan pengeluaran per tanggal' : 'Riwayat lengkap pemasukan & pengeluaran'}
          </p>
        </div>

        <button
          onClick={() => onOpenAddModal('manual', activeTab === 'calendar' ? selectedDate : undefined)}
          className="btn-cyan-pill py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Catat</span>
        </button>
      </div>

      {/* View Switcher: Kalender vs Daftar */}
      <div className={`p-1 rounded-2xl flex items-center border transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-slate-100 border-slate-200/80'}`}>
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-[#00F0D0] text-[#0E1116] shadow-xs'
              : isDark
              ? 'text-[#8E97A6] hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Kalender</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'bg-[#00F0D0] text-[#0E1116] shadow-xs'
              : isDark
              ? 'text-[#8E97A6] hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Daftar Transaksi</span>
        </button>
      </div>

      {/* ================= CALENDAR VIEW ================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Month Navigation Strip */}
          <div className={`rounded-2xl p-3 border flex items-center justify-between gap-2 flex-wrap transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
                <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className={`text-xs font-extrabold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {MONTH_NAMES_INDO[calMonth]} {calYear}
                </span>
                <span className={`text-[10px] block ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                  Hari ini: {formatDateIndo(todayStr, { includeDayName: true })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? 'text-[#8E97A6] hover:text-white hover:bg-[#222632]' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleJumpToToday}
                className={`text-[10px] font-bold py-1 px-2.5 rounded-full transition-all cursor-pointer active:scale-95 ${
                  calYear === todayParts.year && calMonth === todayParts.month && selectedDate === todayStr
                    ? 'bg-[#00F0D0] text-[#0E1116] shadow-xs'
                    : isDark
                    ? 'bg-[#222632] text-[#00F0D0] hover:bg-[#2A303F]'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
                title="Pindah ke Hari Ini"
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? 'text-[#8E97A6] hover:text-white hover:bg-[#222632]' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Anggaran Bulan Ini Card */}
          <div className={`rounded-2xl p-3.5 border transition-all ${
            isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-[#252A36]">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'
                }`}>
                  <Wallet className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Anggaran Bulan Ini
                    </h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border leading-tight ${
                      isMonthOverBudget
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : monthBudgetPct >= 80
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-teal-500/10 text-[#00F0D0] border-[#00F0D0]/30'
                    }`}>
                      {MONTH_NAMES_INDO[calMonth]} {calYear}
                    </span>
                  </div>
                  <p className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                    {isMonthOverBudget
                      ? `Melebihi anggaran ${formatRupiah(monthExpense - monthBudgetLimit)}`
                      : `${monthBudgetPct}% terpakai dari batas bulanan`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenEditBudget}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs active:scale-95 ${
                  isDark
                    ? 'bg-[#222632] text-[#00F0D0] hover:bg-[#2A303F] border-[#2E3444]'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200'
                }`}
                title="Atur Batas Anggaran"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Atur Anggaran</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-100 dark:border-[#252A36]">
              <div className="text-left">
                <span className={`text-[10px] font-medium block ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                  Batas Anggaran
                </span>
                <span className={`text-xs font-extrabold font-mono block mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {formatRupiah(monthBudgetLimit)}
                </span>
              </div>

              <div className="text-center">
                <span className={`text-[10px] font-medium block ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                  Terpakai
                </span>
                <span className="text-xs font-extrabold font-mono block mt-0.5 text-[#FF4B72]">
                  {formatRupiah(monthExpense)}
                </span>
              </div>

              <div className="text-right">
                <span className={`text-[10px] font-medium block ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                  Sisa Anggaran
                </span>
                <span className={`text-xs font-extrabold font-mono block mt-0.5 ${
                  isMonthOverBudget ? 'text-rose-400' : isDark ? 'text-[#00F0D0]' : 'text-teal-700'
                }`}>
                  {isMonthOverBudget
                    ? `-${formatRupiah(monthExpense - monthBudgetLimit)}`
                    : formatRupiah(monthRemainingBudget)}
                </span>
              </div>
            </div>

            {/* Progress Bar & Recommendations */}
            <div className="pt-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Penggunaan Anggaran
                </span>
                <span className={`font-bold font-mono ${
                  isMonthOverBudget ? 'text-rose-400' : monthBudgetPct >= 80 ? 'text-amber-400' : 'text-[#00F0D0]'
                }`}>
                  {Math.round((monthExpense / (monthBudgetLimit || 1)) * 100)}%
                </span>
              </div>

              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isMonthOverBudget
                      ? 'bg-rose-500'
                      : monthBudgetPct >= 80
                      ? 'bg-amber-400'
                      : 'bg-[#00F0D0]'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((monthExpense / (monthBudgetLimit || 1)) * 100))}%` }}
                />
              </div>

              {/* Sisa Hari / Kuota Harian Tip */}
              <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                <span>
                  {calYear === todayParts.year && calMonth === todayParts.month
                    ? `Sisa ${remainingDaysInMonth} hari bulan ini`
                    : `Total ${daysInMonth} hari (${MONTH_NAMES_INDO[calMonth]})`}
                </span>
                {!isMonthOverBudget && monthRemainingBudget > 0 ? (
                  <span className={isDark ? 'text-[#00F0D0]' : 'text-teal-700'}>
                    Rekomendasi harian: ~<strong className="font-mono">{formatRupiah(dailyBudgetAllowance)}</strong>/hari
                  </span>
                ) : isMonthOverBudget ? (
                  <span className="text-rose-400 font-bold">
                    ⚠️ Anggaran bulan ini sudah terlampaui
                  </span>
                ) : (
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    Anggaran belum terpakai
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Interactive Grid */}
          <div className={`rounded-2xl p-3 border transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {DAY_NAMES_INDO.map((dayName, idx) => (
                <span
                  key={dayName}
                  className={`text-[10px] font-extrabold py-1 ${
                    idx >= 5 ? 'text-[#FF4B72]' : isDark ? 'text-[#8E97A6]' : 'text-slate-500'
                  }`}
                >
                  {dayName}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-11 rounded-xl bg-transparent" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${activeMonthKey}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDate === dateKey;
                const isToday = dateKey === todayStr;
                const dayInfo = txMapByDate[dateKey];
                const hasExpense = dayInfo && dayInfo.expense > 0;
                const hasIncome = dayInfo && dayInfo.income > 0;
                const hasSaving = dayInfo && dayInfo.saving > 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-between py-1 px-0.5 relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00F0D0] text-[#0E1116] shadow-md shadow-[#00F0D0]/30 scale-[1.03] z-10 font-extrabold ring-2 ring-[#00F0D0]'
                        : isToday
                        ? isDark
                          ? 'bg-[#00F0D0]/15 text-[#00F0D0] border-2 border-[#00F0D0] font-bold'
                          : 'bg-teal-50 text-teal-900 border-2 border-[#00F0D0] font-bold'
                        : isDark
                        ? 'bg-[#222632]/80 hover:bg-[#2A303F] text-slate-200 border border-[#2A303F]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-0.5">
                      <span className={`text-[11px] ${isSelected ? 'font-black text-[#0E1116]' : isToday ? 'font-black' : 'font-semibold'}`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#0E1116]' : isDark ? 'bg-[#00F0D0]' : 'bg-teal-700'}`}
                          title="Hari Ini"
                        />
                      )}
                    </div>

                    {/* Indicator dots */}
                    <div className="flex items-center gap-0.5 h-2">
                      {hasExpense && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#0E1116]' : 'bg-[#FF4B72]'}`}
                          title={`Pengeluaran: ${formatRupiah(dayInfo.expense)}`}
                        />
                      )}
                      {hasIncome && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#0E1116]' : isDark ? 'bg-[#00F0D0]' : 'bg-teal-600'}`}
                          title={`Pemasukan: ${formatRupiah(dayInfo.income)}`}
                        />
                      )}
                      {hasSaving && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#0E1116]' : 'bg-blue-400'}`}
                          title={`Tabungan: ${formatRupiah(dayInfo.saving)}`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className={`flex items-center justify-center gap-3.5 mt-3 pt-2.5 border-t text-[10px] ${isDark ? 'border-[#252A36] text-[#8E97A6]' : 'border-slate-100 text-slate-500'}`}>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B72]" />
                <span>Pengeluaran</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#00F0D0]' : 'bg-teal-600'}`} />
                <span>Pemasukan</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Tabungan</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full border ${isDark ? 'border-[#00F0D0] bg-[#00F0D0]/20' : 'border-teal-600 bg-teal-50'}`} />
                <span className={`font-semibold ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>Hari Ini</span>
              </div>
            </div>
          </div>

          {/* Selected Date Details Card */}
          <div className={`rounded-2xl p-4 border space-y-3 transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
            <div className={`flex items-center justify-between pb-2.5 border-b ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
                    Agenda & Catatan Tanggal
                  </span>
                  {isSelectedDateToday && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#00F0D0] text-[#0E1116] text-[9px] font-black uppercase">
                      Hari Ini
                    </span>
                  )}
                </div>
                <h3 className={`text-sm font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatDateIndo(selectedDate, { includeDayName: true })}
                </h3>
              </div>

              <div className="text-right">
                <span className={`text-[10px] block ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                  Total Pengeluaran
                </span>
                <span className={`text-xs font-bold font-mono ${selectedDayData.expense > 0 ? 'text-[#FF4B72]' : isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                  {selectedDayData.expense > 0 ? `-${formatRupiah(selectedDayData.expense)}` : 'Rp 0'}
                </span>
              </div>
            </div>

            {/* Daily Transactions Header with + Catat Button */}
            <div className="flex items-center justify-between pt-0.5">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Transaksi ({selectedDayData.txs.length})
              </span>
              <button
                type="button"
                onClick={() => onOpenAddModal('manual', selectedDate)}
                className="text-[11px] font-bold text-[#00F0D0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat di Tanggal Ini</span>
              </button>
            </div>

            {/* List of items on this date */}
            {selectedDayData.txs.length === 0 ? (
              <div className={`p-5 rounded-2xl border text-center space-y-2.5 ${isDark ? 'bg-[#222632]/40 border-[#2A303F]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-2xl block">📅</span>
                <p className={`text-xs ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                  Belum ada transaksi di tanggal ini.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAddModal('manual', selectedDate)}
                  className="btn-cyan-pill py-1.5 px-3.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Transaksi di Tanggal Ini</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedDayData.txs.map(tx => {
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all active:scale-[0.99] ${
                        isDark
                          ? 'bg-[#222632] border-[#2E3444] hover:border-[#00F0D0]/50'
                          : 'bg-slate-50/80 border-slate-200/80 hover:bg-white shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderCategoryIcon(tx.category, tx.type)}
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {tx.merchant || tx.note || tx.category}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-medium ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                              {tx.category}
                            </span>
                            {tx.time && (
                              <>
                                <span className="text-[10px] text-slate-500">•</span>
                                <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                                  {tx.time}
                                </span>
                              </>
                            )}
                            {tx.sourceFund && (
                              <>
                                <span className="text-[10px] text-slate-500">•</span>
                                <span className={`text-[10px] truncate max-w-[100px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                                  {tx.sourceFund}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`font-bold font-mono text-xs tabular-nums flex-shrink-0 ${
                            isIncome
                              ? isDark ? 'text-[#00F0D0]' : 'text-teal-700'
                              : tx.type === 'saving'
                              ? 'text-blue-400'
                              : 'text-[#FF4B72]'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatRupiah(tx.amount)}
                        </span>

                        <button
                          type="button"
                          title="Hapus"
                          onClick={e => {
                            e.stopPropagation();
                            onSelectTransaction({ ...tx, __del: true });
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-all"
                          style={{ background: 'rgba(255,75,114,0.12)', color: '#FF4B72' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= LIST VIEW ================= */}
      {activeTab === 'list' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Quick Summary Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`rounded-2xl p-2.5 border transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <div className="flex items-center gap-1 text-[10px] text-[#FF4B72] font-semibold mb-0.5">
                <TrendingDown className="w-3 h-3" />
                <span>Pengeluaran</span>
              </div>
              <span className="text-xs font-extrabold font-mono text-[#FF4B72] truncate block">
                {formatRupiah(stats.expense)}
              </span>
            </div>

            <div className={`rounded-2xl p-2.5 border transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <div className="flex items-center gap-1 text-[10px] text-[#00F0D0] font-semibold mb-0.5">
                <TrendingUp className="w-3 h-3 text-[#00F0D0]" />
                <span className={isDark ? 'text-[#00F0D0]' : 'text-teal-700'}>Pemasukan</span>
              </div>
              <span className={`text-xs font-extrabold font-mono truncate block ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
                {formatRupiah(stats.income)}
              </span>
            </div>

            <div className={`rounded-2xl p-2.5 border transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <div className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold mb-0.5">
                <PiggyBank className="w-3 h-3 text-blue-400" />
                <span>Ditabung</span>
              </div>
              <span className="text-xs font-extrabold font-mono text-blue-400 truncate block">
                {formatRupiah(stats.saving)}
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, toko, atau catatan..."
              className={`w-full pl-9 pr-9 py-2 text-xs rounded-full border outline-none transition-all ${
                isDark
                  ? 'bg-[#181B24] border-[#252A36] text-white placeholder-[#8E97A6] focus:border-[#00F0D0]'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#00F0D0]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1 px-3 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap text-center ${
                filterType === 'all'
                  ? 'bg-[#00F0D0] text-[#0E1116] shadow-xs'
                  : isDark
                  ? 'bg-[#181B24] text-[#8E97A6] hover:text-white border border-[#252A36]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs'
              }`}
            >
              Semua ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`py-1 px-3 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap text-center ${
                filterType === 'expense'
                  ? 'bg-[#FF4B72] text-white shadow-xs'
                  : isDark
                  ? 'bg-[#181B24] text-[#8E97A6] hover:text-white border border-[#252A36]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs'
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`py-1 px-3 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap text-center ${
                filterType === 'income'
                  ? 'bg-[#00F0D0] text-[#0E1116] shadow-xs'
                  : isDark
                  ? 'bg-[#181B24] text-[#8E97A6] hover:text-white border border-[#252A36]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setFilterType('saving')}
              className={`py-1 px-3 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap text-center ${
                filterType === 'saving'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : isDark
                  ? 'bg-[#181B24] text-[#8E97A6] hover:text-white border border-[#252A36]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs'
              }`}
            >
              Tabungan
            </button>

            <button
              onClick={() => setSelectedMonthFilter(prev => prev === 'current' ? 'all' : 'current')}
              className={`ml-auto py-1 px-2.5 text-[11px] font-semibold rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                selectedMonthFilter === 'all'
                  ? 'bg-[#222632] text-white border-white/20'
                  : isDark
                  ? 'bg-[#181B24] text-[#8E97A6] border-[#252A36]'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={selectedMonthFilter === 'current' ? 'Bulan Ini saja' : 'Semua Bulan'}
            >
              <Filter className="w-3 h-3" />
              <span>{selectedMonthFilter === 'current' ? 'Bulan Ini' : 'Semua Bulan'}</span>
            </button>
          </div>

          {/* Main Transactions List */}
          <div className="space-y-3 pt-1">
            {searchQuery.trim() && (
              <p className={`text-[11px] font-semibold px-1 ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                Ditemukan {filteredTransactions.length} transaksi untuk "{searchQuery.trim()}"
              </p>
            )}

            {groupedByDate.length === 0 ? (
              <div className={`rounded-2xl p-8 text-center space-y-3 border transition-colors ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-white border-slate-200/80 shadow-xs'}`}>
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-slate-100 dark:bg-[#222632] text-2xl">
                  📂
                </div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Belum ada transaksi di filter ini
                </p>
                <p className={`text-xs ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'} max-w-xs mx-auto`}>
                  {searchQuery ? 'Tidak ada transaksi yang cocok dengan kata kunci pencarian.' : 'Catat pengeluaran atau pemasukan baru agar keuanganmu tercatat rapi.'}
                </p>
                <button
                  onClick={() => onOpenAddModal('manual')}
                  className="btn-cyan-pill py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Transaksi Baru</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedByDate.map(([date, group]) => (
                  <div key={date} className="space-y-1.5">
                    {/* Date Group Header */}
                    <div className="flex items-center justify-between px-1.5">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className={`w-3.5 h-3.5 ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`} />
                        <span className={`text-[11px] font-extrabold tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {formatDateIndo(date, { includeDayName: true })}
                        </span>
                      </div>
                      {group.dayExpense > 0 && (
                        <span className="text-[10px] font-mono font-semibold text-[#FF4B72]">
                          -{formatRupiah(group.dayExpense)}
                        </span>
                      )}
                    </div>

                    {/* Date Group Items */}
                    <div className="space-y-1.5">
                      {group.txs.map(tx => {
                        const isExpense = tx.type === 'expense';
                        const isIncome = tx.type === 'income';

                        return (
                          <div
                            key={tx.id}
                            onClick={() => onSelectTransaction(tx)}
                            className={`rounded-2xl p-3 flex items-center justify-between gap-2.5 cursor-pointer transition-all active:scale-[0.99] border ${
                              isDark
                                ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0]/40'
                                : 'bg-white border-slate-200/80 hover:border-teal-200 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {renderCategoryIcon(tx.category, tx.type)}
                              <div className="min-w-0">
                                <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {tx.merchant || tx.note || tx.category}
                                </h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                                    {tx.category}
                                  </span>
                                  {tx.time && (
                                    <>
                                      <span className="text-[10px] text-[#555E6D]">•</span>
                                      <span className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                                        {tx.time}
                                      </span>
                                    </>
                                  )}
                                  {(tx.sourceFund || tx.merchant) && (
                                    <>
                                      <span className="text-[10px] text-[#555E6D]">•</span>
                                      <span className={`text-[10px] truncate max-w-[110px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                                        {tx.sourceFund || tx.merchant}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right flex-shrink-0">
                                <span
                                  className={`text-xs font-bold font-mono tabular-nums ${
                                    isExpense
                                      ? 'text-[#FF4B72]'
                                      : isIncome
                                      ? isDark ? 'text-[#00F0D0]' : 'text-teal-700'
                                      : 'text-blue-400'
                                  }`}
                                >
                                  {isIncome ? '+' : isExpense ? '-' : ''}
                                  {formatRupiah(tx.amount)}
                                </span>
                                <span
                                  className={`text-[9px] block font-semibold ${
                                    isExpense
                                      ? 'text-[#FF4B72]'
                                      : isIncome
                                      ? isDark ? 'text-[#00F0D0]' : 'text-teal-700'
                                      : 'text-blue-400'
                                  }`}
                                >
                                  {isExpense ? 'Pengeluaran' : isIncome ? 'Pemasukan' : 'Tabungan'}
                                </span>
                              </div>

                              <button
                                type="button"
                                title="Hapus Transaksi"
                                onClick={e => {
                                  e.stopPropagation();
                                  onSelectTransaction({ ...tx, __del: true });
                                }}
                                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-all"
                                style={{ background: 'rgba(255,75,114,0.12)', color: '#FF4B72' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {isEditBudgetOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#12151C] border-[#252A36] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#00F0D0]" />
                <h3 className="text-sm font-extrabold">Atur Anggaran Bulan Ini</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditBudgetOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-400">
                  Batas Maksimal Pengeluaran (Rupiah)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="100000"
                    step="50000"
                    value={tempBudgetInput || ''}
                    onChange={e => setTempBudgetInput(Number(e.target.value) || 0)}
                    required
                    className={`w-full pl-9 pr-3 py-2.5 text-base font-extrabold font-mono rounded-2xl border outline-none ${
                      isDark ? 'bg-[#181B24] border-[#252A36] text-white focus:border-[#00F0D0]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>
                <span className="text-xs font-bold font-mono text-[#00F0D0] block mt-1">
                  {formatRupiah(tempBudgetInput)}
                </span>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-bold block mb-1 text-slate-400">
                  Pilihan Nominal Cepat:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1500000, 2500000, 3500000, 5000000, 7500000, 10000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTempBudgetInput(val)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                        tempBudgetInput === val
                          ? 'bg-[#00F0D0]/20 border-[#00F0D0] text-[#00F0D0]'
                          : isDark
                          ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:bg-[#202532]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl btn-cyan-pill text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Batas Anggaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
