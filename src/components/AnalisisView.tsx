import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ArrowDown,
  ArrowUp,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';
import { useKocek } from '../context/KocekContext';
import { formatRupiah, getMonthName, getPreviousMonthString, getCurrentMonthString } from '../utils/formatters';

const MONTHS_LIST = [
  { id: 1, name: 'Januari', short: 'Jan' },
  { id: 2, name: 'Februari', short: 'Feb' },
  { id: 3, name: 'Maret', short: 'Mar' },
  { id: 4, name: 'April', short: 'Apr' },
  { id: 5, name: 'Mei', short: 'Mei' },
  { id: 6, name: 'Juni', short: 'Jun' },
  { id: 7, name: 'Juli', short: 'Jul' },
  { id: 8, name: 'Agustus', short: 'Agu' },
  { id: 9, name: 'September', short: 'Sep' },
  { id: 10, name: 'Oktober', short: 'Okt' },
  { id: 11, name: 'November', short: 'Nov' },
  { id: 12, name: 'Desember', short: 'Des' },
];

export const AnalisisView: React.FC = () => {
  const { summary, theme, currentMonth, setCurrentMonth, categoryBreakdown, transactions } = useKocek();
  const isDark = theme === 'dark';

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const monthParts = (currentMonth || getCurrentMonthString()).split('-').map(Number);
  const activeYear = monthParts[0] || 2026;
  const activeMonthNum = monthParts[1] || 10;

  const [pickerYear, setPickerYear] = useState<number>(activeYear);

  const monthName = getMonthName(currentMonth);
  const prevMonthKey = getPreviousMonthString(currentMonth);
  const prevMonthName = getMonthName(prevMonthKey);
  const year = String(activeYear);

  // Month-over-month calculation from real user transactions
  const prevMonthTxs = transactions.filter(t => t.date.startsWith(prevMonthKey));
  const currentMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth));

  const hasCurrentMonthData = currentMonthTxs.length > 0;
  const hasPrevMonthData = prevMonthTxs.length > 0;

  // Real non-zero categories
  const nonZeroCategories = categoryBreakdown.filter(c => c.spent > 0);
  const totalExpense = nonZeroCategories.reduce((acc, c) => acc + c.spent, 0);
  const circumference = 2 * Math.PI * 52; // r = 52

  let accumulatedLength = 0;
  const donutSlices = nonZeroCategories.map(c => {
    const sliceLen = (c.spent / totalExpense) * circumference;
    const slice = {
      ...c,
      len: sliceLen,
      offset: accumulatedLength,
    };
    accumulatedLength += sliceLen;
    return slice;
  });

  const handleSelectMonth = (mNum: number) => {
    const mStr = String(mNum).padStart(2, '0');
    setCurrentMonth(`${pickerYear}-${mStr}`);
    setIsMonthPickerOpen(false);
  };

  const handleJumpToCurrentMonth = () => {
    const now = getCurrentMonthString();
    const parts = now.split('-').map(Number);
    setPickerYear(parts[0] || 2026);
    setCurrentMonth(now);
    setIsMonthPickerOpen(false);
  };

  return (
    <div className={`space-y-4 pb-24 select-none pt-2 transition-colors duration-200 relative ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
      {/* Header with Month Selector Button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
            Analisis Keuangan
          </h1>
          <p className={`text-xs ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
            Evaluasi pengeluaran & tabungan {monthName} {year}
          </p>
        </div>

        {/* Clickable Calendar Icon / Month Selector Badge */}
        <button
          type="button"
          onClick={() => {
            setPickerYear(activeYear);
            setIsMonthPickerOpen(prev => !prev);
          }}
          className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border shadow-xs ${
            isDark
              ? 'bg-[#181B24] text-[#00F0D0] hover:bg-[#222632] border-[#252A36]'
              : 'bg-white text-teal-700 hover:bg-teal-50 border-slate-200'
          }`}
          title="Klik untuk memilih bulan"
        >
          <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
          <span className="text-xs font-bold font-mono">
            {MONTHS_LIST[activeMonthNum - 1]?.short || monthName} {year}
          </span>
        </button>
      </div>

      {/* Month Selection Modal / Popover */}
      {isMonthPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 transition-colors ${
              isDark ? 'bg-[#12151C] border-[#252A36] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header of Picker */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#00F0D0]" />
                <h3 className="text-sm font-extrabold">Pilih Bulan Analisis</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(false)}
                className={`p-1 rounded-full cursor-pointer transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Year Selector */}
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setPickerYear(prev => prev - 1)}
                className={`p-1.5 rounded-xl border cursor-pointer transition-colors ${
                  isDark ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="Tahun Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm font-extrabold font-mono text-[#00F0D0]">
                {pickerYear}
              </span>

              <button
                type="button"
                onClick={() => setPickerYear(prev => prev + 1)}
                className={`p-1.5 rounded-xl border cursor-pointer transition-colors ${
                  isDark ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="Tahun Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of 12 Months */}
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_LIST.map(m => {
                const isSelected = pickerYear === activeYear && m.id === activeMonthNum;
                const isCurrentMonthNow = getCurrentMonthString() === `${pickerYear}-${String(m.id).padStart(2, '0')}`;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMonth(m.id)}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#00F0D0] text-[#0E1116] shadow-sm shadow-[#00F0D0]/30 font-black scale-102 border-[#00F0D0]'
                        : isCurrentMonthNow
                        ? isDark
                          ? 'bg-[#00F0D0]/10 border-[#00F0D0] text-[#00F0D0]'
                          : 'bg-teal-50 border-teal-500 text-teal-800'
                        : isDark
                        ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:bg-[#202532]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m.name}</span>
                    {isCurrentMonthNow && (
                      <span className="text-[9px] font-normal opacity-80 block mt-0.5">Bulan Ini</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={handleJumpToCurrentMonth}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                  isDark ? 'border-[#252A36] text-slate-300 hover:text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Bulan Sekarang
              </button>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(false)}
                className="flex-1 py-2 rounded-xl btn-cyan-pill text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Blocks */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className={`rounded-2xl p-3 text-center flex flex-col items-center justify-between transition-colors border ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 shadow-xs'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-600'}`}>
            <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className={`text-[10px] font-medium block ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Pemasukan</span>
          <span className={`text-xs font-bold font-mono tracking-tight mt-0.5 block truncate w-full ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
            {formatRupiah(summary.income)}
          </span>
        </div>

        <div className={`rounded-2xl p-3 text-center flex flex-col items-center justify-between transition-colors border ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 shadow-xs'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${isDark ? 'bg-[#FF4B72]/15 text-[#FF4B72]' : 'bg-rose-50 text-rose-500'}`}>
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className={`text-[10px] font-medium block ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Pengeluaran</span>
          <span className="text-xs font-bold text-[#FF4B72] font-mono tracking-tight mt-0.5 block truncate w-full">
            {formatRupiah(summary.expense)}
          </span>
        </div>

        <div className={`rounded-2xl p-3 text-center flex flex-col items-center justify-between transition-colors border ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 shadow-xs'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <PiggyBank className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className={`text-[10px] font-medium block ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Tabungan</span>
          <span className="text-xs font-bold text-blue-400 font-mono tracking-tight mt-0.5 block truncate w-full">
            {formatRupiah(summary.saved)}
          </span>
        </div>
      </div>

      {/* Donut Chart Recap Card */}
      <section className={`rounded-2xl p-4 space-y-4 transition-colors border ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-900'}`}>
        <h3 className="text-sm font-extrabold tracking-tight">Recap Pengeluaran ({monthName} {year})</h3>

        {totalExpense === 0 ? (
          <div className="py-8 text-center space-y-2">
            <span className="text-2xl block">📊</span>
            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Belum ada riwayat pengeluaran di {monthName} {year}
            </p>
            <p className={`text-[11px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'} max-w-xs mx-auto`}>
              Catat transaksi baru untuk melihat visualisasi alokasi pengeluaranmu.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={52}
                  fill="none"
                  strokeWidth="14"
                  stroke={isDark ? '#222632' : '#F1F5F9'}
                />
                {/* Slices */}
                {donutSlices.map(slice => (
                  <circle
                    key={slice.category}
                    cx="60"
                    cy="60"
                    r={52}
                    fill="none"
                    strokeWidth="14"
                    stroke={slice.color}
                    strokeDasharray={`${Math.max(slice.len - 1.5, 0.5)} ${circumference}`}
                    strokeDashoffset={-slice.offset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-[10px] font-semibold ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>Total</span>
                <span className="text-xs font-extrabold font-mono">{formatRupiah(totalExpense)}</span>
              </div>
            </div>

            {/* Category legend */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {donutSlices.slice(0, 6).map(slice => (
                <div key={slice.category} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className={`flex-1 truncate font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {slice.category}
                  </span>
                  <span className={`font-bold ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                    {Math.round((slice.spent / totalExpense) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Rincian Pengeluaran Progress Bars */}
      <section className={`rounded-2xl p-4 space-y-3.5 transition-colors border ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-900'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
            Rincian Pengeluaran
          </h3>
          <span className={`text-xs font-bold flex items-center gap-0.5 ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
            <span>Alokasi Kategori</span>
          </span>
        </div>

        {nonZeroCategories.length === 0 ? (
          <div className="py-6 text-center space-y-1">
            <p className={`text-xs ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
              Belum ada data pengeluaran tercatat untuk {monthName} {year}.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {nonZeroCategories.map(cat => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 ${isDark ? 'bg-[#222632]' : 'bg-slate-100'}`}>
                      {cat.icon}
                    </div>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {cat.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold font-mono text-xs ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
                      {formatRupiah(cat.spent)}
                    </span>
                  </div>
                </div>

                <div className="pl-10.5 flex items-center gap-2">
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#222632]' : 'bg-slate-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDark ? 'bg-[#00F0D0] shadow-sm shadow-[#00F0D0]/40' : 'bg-teal-600 shadow-sm shadow-teal-600/30'
                      }`}
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold w-10 text-right ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Comparisons & Mochi AI Evaluation */}
      <div className="grid grid-cols-2 gap-3">
        {/* Month-over-Month Comparison */}
        <div className={`rounded-2xl p-3.5 flex flex-col justify-between space-y-3 transition-colors border ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-900'}`}>
          <div>
            <h4 className={`text-xs font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
              Dibanding {prevMonthName}
            </h4>
            {!hasCurrentMonthData && !hasPrevMonthData ? (
              <p className={`text-[10px] leading-relaxed py-4 text-center ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Belum ada data transaksi untuk membandingkan kedua bulan.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Bulan Ini:</span>
                  <span className="font-bold font-mono text-[11px] text-[#FF4B72]">
                    {formatRupiah(summary.expense)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>Bulan Lalu:</span>
                  <span className="font-bold font-mono text-[11px] text-slate-400">
                    {formatRupiah(prevMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mochi Financial Evaluator */}
        <div className={`rounded-2xl p-3.5 flex flex-col justify-between space-y-3 transition-colors border ${isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-white border-slate-200/80 shadow-xs text-slate-900'}`}>
          <div>
            <h4 className={`text-xs font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
              Evaluasi Mochi
            </h4>
            <div className={`p-2.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#222632] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-base">✨</span>
                <span className={`text-xs font-bold ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
                  Kondisi Finansial
                </span>
              </div>
              <p className={`text-[10px] leading-relaxed ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                {summary.expense === 0
                  ? 'Aplikasi baru dimulai. Catat pengeluaran dan pemasukan pertamamu agar Dasai Mochi bisa mengevaluasi!'
                  : 'Pengeluaranmu tercatat rapi. Terus pertahankan kedisiplinan mencatat keuanganmu.'}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <span className={`text-[10px] font-bold block text-center ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
              Status: {summary.expense === 0 ? 'Mulai Baru 🚀' : 'Tercatat Rapi ✨'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
