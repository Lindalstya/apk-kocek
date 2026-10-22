import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Check,
  TrendingDown,
  Info,
  RotateCcw,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react';
import { useKocek, DEFAULT_CATEGORIES } from '../context/KocekContext';
import { formatRupiah, getTodayString } from '../utils/formatters';
import { CategoryBudgetAllocation } from '../types';
import { MochiCharacter } from './MochiCharacter';

interface BudgetAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

const DAY_LABELS: Array<{ key: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'; name: string; isWeekend?: boolean }> = [
  { key: 'senin', name: 'Senin' },
  { key: 'selasa', name: 'Selasa' },
  { key: 'rabu', name: 'Rabu' },
  { key: 'kamis', name: 'Kamis' },
  { key: 'jumat', name: 'Jumat' },
  { key: 'sabtu', name: 'Sabtu', isWeekend: true },
  { key: 'minggu', name: 'Minggu', isWeekend: true },
];

export const BudgetAllocationModal: React.FC<BudgetAllocationModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Makanan',
}) => {
  const {
    budgetAllocations,
    updateBudgetAllocation,
    resetBudgetAllocation,
    transactions,
    theme,
  } = useKocek();

  const isDark = theme === 'dark';
  const todayStr = getTodayString();

  // Find day of week for today: 0 = Sun, 1 = Mon ...
  const currentDayIndex = new Date().getDay();
  const todayKey = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'][currentDayIndex] as 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Active allocation data from context or generate default
  const activeAllocation = useMemo(() => {
    const found = budgetAllocations.find(
      a => a.category.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (found) return found;

    // Default template for requested example (Makanan: 1.000.000 / bulan, 250.000 / minggu, Senin 20.000)
    return {
      id: `alloc-${selectedCategory.toLowerCase()}`,
      category: selectedCategory,
      icon: selectedCategory === 'Makanan' ? '🍜' : selectedCategory === 'Transportasi' ? '🚗' : '📦',
      monthlyBudget: 1000000,
      weeklyBudget: 250000,
      dailyAllocations: {
        senin: 20000,
        selasa: 25000,
        rabu: 25000,
        kamis: 25000,
        jumat: 35000,
        sabtu: 60000,
        minggu: 60000,
      },
      notes: 'Alokasi harian otomatis hemat awal pekan',
    };
  }, [budgetAllocations, selectedCategory]);

  const [monthlyInput, setMonthlyInput] = useState<number>(activeAllocation.monthlyBudget);
  const [weeklyInput, setWeeklyInput] = useState<number>(activeAllocation.weeklyBudget);
  const [dailyState, setDailyState] = useState(activeAllocation.dailyAllocations);
  const [hasSavedSuccess, setHasSavedSuccess] = useState<boolean>(false);

  // Sync state whenever selected category changes
  useEffect(() => {
    setMonthlyInput(activeAllocation.monthlyBudget);
    setWeeklyInput(activeAllocation.weeklyBudget);
    setDailyState({ ...activeAllocation.dailyAllocations });
  }, [selectedCategory, activeAllocation]);

  // Current daily total allocated
  const totalAllocatedWeek = useMemo(() => {
    return Object.values(dailyState).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [dailyState]);

  const diffFromWeekly = weeklyInput - totalAllocatedWeek;

  // Actual spending today for selected category
  const todayActualSpent = useMemo(() => {
    return transactions
      .filter(t => t.date === todayStr && t.type === 'expense' && t.category.toLowerCase().includes(selectedCategory.toLowerCase()))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, todayStr, selectedCategory]);

  // When monthly budget changes, auto-calculate weekly budget (divided by 4)
  const handleMonthlyChange = (val: number) => {
    const valid = Math.max(0, val);
    setMonthlyInput(valid);
    const newWeekly = Math.round(valid / 4);
    setWeeklyInput(newWeekly);

    // Also scale daily allocations proportionally
    applyPreset('senin-20k', newWeekly);
  };

  // Presets
  const applyPreset = (type: 'senin-20k' | 'equal' | 'weekday-save', targetWeekly = weeklyInput) => {
    if (type === 'senin-20k') {
      // Senin Rp 20.000 (user's exact example)
      // Remaining for 6 days
      const senin = Math.min(20000, targetWeekly);
      const remaining = Math.max(0, targetWeekly - senin);
      // Give Tuesday-Thursday equal, Friday more, Weekend most
      // Ratio: Selasa(1), Rabu(1), Kamis(1), Jumat(1.4), Sabtu(2.4), Minggu(2.4) = 9.2 parts
      const unit = Math.round(remaining / 9.2);
      const selasa = Math.round(unit / 1000) * 1000;
      const rabu = selasa;
      const kamis = selasa;
      const jumat = Math.round((unit * 1.4) / 1000) * 1000;
      const sabtu = Math.round((unit * 2.4) / 1000) * 1000;
      const minggu = targetWeekly - (senin + selasa + rabu + kamis + jumat + sabtu);

      setDailyState({
        senin,
        selasa: Math.max(0, selasa),
        rabu: Math.max(0, rabu),
        kamis: Math.max(0, kamis),
        jumat: Math.max(0, jumat),
        sabtu: Math.max(0, sabtu),
        minggu: Math.max(0, minggu),
      });
    } else if (type === 'equal') {
      const perDay = Math.round(targetWeekly / 7 / 500) * 500;
      const lastDay = targetWeekly - perDay * 6;
      setDailyState({
        senin: perDay,
        selasa: perDay,
        rabu: perDay,
        kamis: perDay,
        jumat: perDay,
        sabtu: perDay,
        minggu: Math.max(0, lastDay),
      });
    } else if (type === 'weekday-save') {
      // Weekdays: 60% of budget, Weekend: 40% of budget
      const weekdayTotal = targetWeekly * 0.55;
      const weekendTotal = targetWeekly * 0.45;
      const weekdayDay = Math.round(weekdayTotal / 5 / 1000) * 1000;
      const weekendDay = Math.round(weekendTotal / 2 / 1000) * 1000;
      const lastDay = targetWeekly - (weekdayDay * 5 + weekendDay);
      setDailyState({
        senin: weekdayDay,
        selasa: weekdayDay,
        rabu: weekdayDay,
        kamis: weekdayDay,
        jumat: weekdayDay,
        sabtu: weekendDay,
        minggu: Math.max(0, lastDay),
      });
    }
  };

  const handleAdjustDay = (key: keyof typeof dailyState, delta: number) => {
    setDailyState(prev => {
      const current = Number(prev[key]) || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [key]: updated };
    });
  };

  const handleDayInputChange = (key: keyof typeof dailyState, val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
    setDailyState(prev => ({ ...prev, [key]: num }));
  };

  const handleDistributeDiff = () => {
    if (diffFromWeekly === 0) return;
    // Distribute remaining diff across days
    const daysKeys = Object.keys(dailyState) as Array<keyof typeof dailyState>;
    const share = Math.round(diffFromWeekly / 7);
    const updated = { ...dailyState };
    daysKeys.forEach(k => {
      updated[k] = Math.max(0, updated[k] + share);
    });
    setDailyState(updated);
  };

  const handleSave = () => {
    const updated: CategoryBudgetAllocation = {
      id: activeAllocation.id,
      category: selectedCategory,
      icon: selectedCategory === 'Makanan' ? '🍜' : selectedCategory === 'Transportasi' ? '🚗' : '📦',
      monthlyBudget: monthlyInput,
      weeklyBudget: weeklyInput,
      dailyAllocations: dailyState,
      notes: `Alokasi mingguan Rp${weeklyInput.toLocaleString('id-ID')} dengan Senin Rp${(dailyState.senin || 0).toLocaleString('id-ID')}`,
    };

    updateBudgetAllocation(updated);
    setHasSavedSuccess(true);
    setTimeout(() => {
      setHasSavedSuccess(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full sm:max-w-md max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl transition-all overflow-hidden ${
          isDark ? 'bg-[#12151D] border-[#222736] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-[#202532] bg-[#161A24]' : 'border-slate-100 bg-slate-50/80'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-600'}`}>
              <Sliders className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0E1116]'}`}>
                Alokasi Anggaran & Harian
              </h2>
              <p className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                Atur budget mingguan & jatah belanja harian
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${
              isDark ? 'bg-[#222736] text-slate-400 hover:text-white' : 'bg-slate-200/60 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Category Selector Tabs */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
              Pilih Kategori Budget
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['Makanan', 'Transportasi', 'Hiburan', 'Belanja'].map(cat => {
                const isSelected = selectedCategory === cat;
                const icon = cat === 'Makanan' ? '🍜' : cat === 'Transportasi' ? '🚗' : cat === 'Hiburan' ? '🎮' : '🛍️';
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`py-1.5 px-3 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#00F0D0] text-[#0E1116] shadow-xs scale-102'
                        : isDark
                        ? 'bg-[#181B24] text-[#8E97A6] hover:text-white border border-[#252A36]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Budget Setup */}
          <div className={`p-3.5 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[10px] font-bold block ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                  Target Anggaran Bulanan {selectedCategory}
                </span>
                <span className={`text-base font-extrabold font-mono ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
                  {formatRupiah(monthlyInput)}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-[10px] block ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                  Otomatis Seminggu:
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  ~{formatRupiah(weeklyInput)}/minggu
                </span>
              </div>
            </div>

            {/* Quick chips for monthly budget */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {[500000, 1000000, 1500000, 2000000].map(amt => (
                <button
                  key={amt}
                  onClick={() => handleMonthlyChange(amt)}
                  className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                    monthlyInput === amt
                      ? 'bg-[#00F0D0]/20 text-[#00F0D0] border-[#00F0D0]'
                      : isDark
                      ? 'bg-[#222736] text-slate-300 border-white/5 hover:border-white/20'
                      : 'bg-white text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Allocation Strategy Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Preset Pembagian Harian
              </label>
              <span className="text-[10px] text-[#00F0D0] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-Pacing
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => applyPreset('senin-20k')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  dailyState.senin === 20000
                    ? 'border-[#00F0D0] bg-[#00F0D0]/10 text-white font-bold'
                    : isDark
                    ? 'border-[#252A36] bg-[#181B24] text-[#8E97A6] hover:text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <span className="text-[10px] block font-extrabold text-[#00F0D0]">Senin Rp20rb</span>
                <span className="text-[9px] text-[#8E97A6] block leading-tight mt-0.5">Hemat awal pekan</span>
              </button>

              <button
                onClick={() => applyPreset('equal')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'border-[#252A36] bg-[#181B24] text-[#8E97A6] hover:text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <span className="text-[10px] block font-extrabold">Bagi Rata</span>
                <span className="text-[9px] text-[#8E97A6] block leading-tight mt-0.5">Sama tiap hari</span>
              </button>

              <button
                onClick={() => applyPreset('weekday-save')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'border-[#252A36] bg-[#181B24] text-[#8E97A6] hover:text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <span className="text-[10px] block font-extrabold">Santai Weekend</span>
                <span className="text-[9px] text-[#8E97A6] block leading-tight mt-0.5">Jajan di Sabtu-Minggu</span>
              </button>
            </div>
          </div>

          {/* 7-Days Allocation Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Jatah Harian (Senin - Minggu)
              </span>
              <span className="text-[10px] text-[#8E97A6]">
                Target Seminggu: <strong className="font-mono text-white">{formatRupiah(weeklyInput)}</strong>
              </span>
            </div>

            <div className="space-y-1.5">
              {DAY_LABELS.map(day => {
                const amount = dailyState[day.key] || 0;
                const isToday = day.key === todayKey;

                return (
                  <div
                    key={day.key}
                    className={`rounded-xl p-2.5 border flex items-center justify-between gap-2 transition-all ${
                      isToday
                        ? isDark
                          ? 'bg-[#182329] border-[#00F0D0]/40 ring-1 ring-[#00F0D0]/30'
                          : 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-200'
                        : isDark
                        ? 'bg-[#181B24] border-[#252A36]'
                        : 'bg-white border-slate-200/80 shadow-xs'
                    }`}
                  >
                    {/* Day name & tag */}
                    <div className="flex items-center gap-2 min-w-[90px]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-xs ${isToday ? (isDark ? 'text-[#00F0D0]' : 'text-teal-700') : (isDark ? 'text-white' : 'text-slate-800')}`}>
                            {day.name}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#00F0D0] text-[#0E1116]">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <span className={`text-[9px] block ${day.isWeekend ? 'text-amber-400 font-semibold' : 'text-[#8E97A6]'}`}>
                          {day.isWeekend ? 'Akhir Pekan' : 'Hari Kerja'}
                        </span>
                      </div>
                    </div>

                    {/* Stepper & input controls */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleAdjustDay(day.key, -5000)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-all active:scale-90 ${
                          isDark ? 'bg-[#222736] text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="- Rp5.000"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <div className="relative">
                        <input
                          type="text"
                          value={amount > 0 ? amount.toLocaleString('id-ID') : '0'}
                          onChange={e => handleDayInputChange(day.key, e.target.value)}
                          className={`w-24 text-right py-1 px-2 rounded-lg text-xs font-mono font-bold outline-none border transition-all ${
                            isDark
                              ? 'bg-[#12151D] border-[#2B3140] text-white focus:border-[#00F0D0]'
                              : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#00F0D0]'
                          }`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdjustDay(day.key, 5000)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-all active:scale-90 ${
                          isDark ? 'bg-[#222736] text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="+ Rp5.000"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Allocation Balance Checker Card */}
          <div
            className={`p-3 rounded-2xl border space-y-2 transition-all ${
              diffFromWeekly === 0
                ? isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                : diffFromWeekly > 0
                ? isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                : isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Total Alokasi Mingguan:</span>
              <span className="font-mono font-bold text-sm">
                {formatRupiah(totalAllocatedWeek)} / {formatRupiah(weeklyInput)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              {diffFromWeekly === 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pas 100%! Alokasi 7 hari cocok dengan budget seminggu.</span>
                </div>
              ) : diffFromWeekly > 0 ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-blue-400 font-semibold">
                    Masih sisa {formatRupiah(diffFromWeekly)} belum dialokasikan.
                  </span>
                  <button
                    onClick={handleDistributeDiff}
                    className="py-0.5 px-2 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold text-[10px] cursor-pointer"
                  >
                    Ratakan Sisa
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-rose-400 font-semibold">
                    Kelebihan {formatRupiah(Math.abs(diffFromWeekly))} dari budget mingguan.
                  </span>
                  <button
                    onClick={handleDistributeDiff}
                    className="py-0.5 px-2 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-[10px] cursor-pointer"
                  >
                    Sesuaikan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mochi Companion Insight */}
          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="w-10 h-10 flex-shrink-0">
              <MochiCharacter mood="happy" size={40} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#00F0D0] block">Tips Dasai Mochi 👾</span>
              <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {dailyState.senin <= 20000
                  ? `Keren! Target hari Senin ${formatRupiah(dailyState.senin)} sangat hemat di awal pekan. Sisanya bisa kamu nikmati pas akhir pekan!`
                  : `Total seminggu ${formatRupiah(weeklyInput)} siap dipantau. Catat setiap makan siang dan ngopi biar jatah harianmu selalu aman.`}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className={`p-3.5 border-t flex items-center gap-2.5 flex-shrink-0 ${isDark ? 'border-[#202532] bg-[#161A24]' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={() => resetBudgetAllocation(activeAllocation.id)}
            className={`py-2 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'bg-[#222736] text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
              hasSavedSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-[#00F0D0] hover:bg-[#00DBBE] text-[#0E1116] shadow-[#00F0D0]/20'
            }`}
          >
            {hasSavedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Alokasi Tersimpan!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Terapkan Alokasi Anggaran</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
