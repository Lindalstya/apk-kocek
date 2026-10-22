import React, { useState } from 'react';
import { X, PiggyBank, Sparkles, Check, ChevronDown, Wallet, Calendar, Plus, AlertCircle } from 'lucide-react';
import { useKocek } from '../context/KocekContext';
import { formatRupiah, getTodayString, getCurrentTimeString } from '../utils/formatters';
import { MochiCharacter } from './MochiCharacter';

interface NabungModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoalId?: string | null;
  onOpenCreateGoal: () => void;
  onOpenAddIncome?: () => void;
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 250000, 500000];

const WALLET_SOURCES = [
  'Kas / Dompet Tunai',
  'Bank BCA',
  'Bank Mandiri',
  'GoPay',
  'OVO',
  'ShopeePay',
  'Lainnya',
];

export const NabungModal: React.FC<NabungModalProps> = ({
  isOpen,
  onClose,
  initialGoalId,
  onOpenCreateGoal,
  onOpenAddIncome,
}) => {
  const { savingGoals, addTransaction, theme, triggerMochiReaction, summary } = useKocek();
  const isDark = theme === 'dark';

  const availableBalance = summary.totalBalance;
  const isSaldoZero = availableBalance <= 0;

  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    initialGoalId || savingGoals[0]?.id || ''
  );
  const [amount, setAmount] = useState<number>(() => (availableBalance > 50000 ? 50000 : Math.max(0, availableBalance)));
  const [sourceFund, setSourceFund] = useState<string>('Kas / Dompet Tunai');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Sync selected goal if initialGoalId changes when modal opens
  React.useEffect(() => {
    if (initialGoalId && savingGoals.some(g => g.id === initialGoalId)) {
      setSelectedGoalId(initialGoalId);
    } else if (savingGoals.length > 0 && !savingGoals.some(g => g.id === selectedGoalId)) {
      setSelectedGoalId(savingGoals[0].id);
    }
  }, [initialGoalId, savingGoals]);

  if (!isOpen) return null;

  const currentGoal = savingGoals.find(g => g.id === selectedGoalId) || savingGoals[0];
  const isExceedingBalance = amount > availableBalance;

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !currentGoal || isSaldoZero || isExceedingBalance) return;

    addTransaction({
      type: 'saving',
      savingGoalId: currentGoal.id,
      amount,
      category: 'Tabungan',
      note: note.trim() || `Nabung untuk ${currentGoal.name}`,
      date: date || getTodayString(),
      time: getCurrentTimeString(),
      sourceFund,
      merchant: sourceFund,
      source: 'manual',
    });

    triggerMochiReaction('happy');
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-sm rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isDark ? 'bg-[#12151C] border-[#252A36] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <PiggyBank className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">Nabung ke Target</h2>
              <p className={`text-[10px] ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                Sisihkan uang khusus untuk target impianmu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full cursor-pointer transition-colors ${
              isDark ? 'text-[#8E97A6] hover:text-white hover:bg-[#181B24]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#00F0D0]/20 flex items-center justify-center text-[#00F0D0]">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-base font-extrabold">Tabungan Berhasil Disimpan!</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              +{formatRupiah(amount)} masuk ke {currentGoal?.name}. Targetmu makin dekat! 🎉
            </p>
            <MochiCharacter mood="happy" size={56} />
          </div>
        ) : savingGoals.length === 0 ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-2xl">
              🎯
            </div>
            <div>
              <h3 className="text-sm font-bold">Belum Ada Target Tabungan</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Buat target tabungan terlebih dahulu (misal: Sepatu Baru, Laptop, Liburan) untuk mulai menyisihkan uang.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenCreateGoal();
              }}
              className="btn-cyan-pill w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Target Sekarang</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveDeposit} className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
            {/* Saldo Awal / Tersedia Check Banner */}
            {isSaldoZero ? (
              <div className="p-3.5 rounded-2xl border bg-rose-500/10 border-rose-500/40 text-rose-300 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="font-bold block text-rose-200">Saldo Awal Belum Tersedia (Rp 0)</span>
                    <span className="text-[11px] text-rose-300/90 leading-relaxed block mt-0.5">
                      Menabung belum bisa dilakukan karena belum ada saldo awal atau pemasukan yang dicatat di akun Anda.
                    </span>
                  </div>
                </div>
                {onOpenAddIncome && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddIncome();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#00F0D0] text-[#06231F] font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Catat Saldo Awal / Pemasukan Sekarang</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#00F0D0]" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Saldo Kas Tersedia:</span>
                </div>
                <span className="font-mono font-bold text-[#00F0D0]">{formatRupiah(availableBalance)}</span>
              </div>
            )}

            {/* Target Goal Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Target yang Ingin Ditabung
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateGoal();
                  }}
                  className={`text-[10px] font-bold flex items-center gap-0.5 cursor-pointer ${
                    isDark ? 'text-[#00F0D0] hover:underline' : 'text-teal-700 hover:underline'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Target Baru</span>
                </button>
              </div>

              {/* Goal Selection Cards */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {savingGoals.map(goal => {
                  const isSelected = goal.id === (currentGoal?.id || selectedGoalId);
                  const pct = goal.targetAmount > 0
                    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                    : 0;

                  return (
                    <div
                      key={goal.id}
                      onClick={() => setSelectedGoalId(goal.id)}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? isDark
                            ? 'bg-[#00F0D0]/10 border-[#00F0D0] shadow-sm'
                            : 'bg-teal-50 border-teal-500 shadow-sm'
                          : isDark
                          ? 'bg-[#181B24] border-[#252A36] hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0">{goal.icon}</span>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? (isDark ? 'text-[#00F0D0]' : 'text-teal-900') : ''}`}>
                            {goal.name}
                          </h4>
                          <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatRupiah(goal.currentAmount)} / {formatRupiah(goal.targetAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-12 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full bg-[#00F0D0] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold tabular-nums ${isSelected ? 'text-[#00F0D0]' : 'text-slate-400'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nominal Nabung */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nominal yang Disisihkan (Rupiah)
                </label>
                {availableBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(availableBalance)}
                    className="text-[10px] font-bold text-[#00F0D0] hover:underline"
                  >
                    Semua Saldo
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  max={availableBalance > 0 ? availableBalance : undefined}
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  disabled={isSaldoZero}
                  required
                  className={`w-full pl-9 pr-3 py-2.5 text-sm font-extrabold font-mono rounded-2xl border outline-none transition-all ${
                    isDark
                      ? 'bg-[#181B24] border-[#252A36] text-white focus:border-[#00F0D0] disabled:opacity-50'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#00F0D0] disabled:opacity-50'
                  }`}
                />
              </div>

              {isExceedingBalance && !isSaldoZero && (
                <p className="text-[10px] text-rose-400 font-bold mt-1">
                  ⚠️ Nominal melebihi saldo kas tersedia ({formatRupiah(availableBalance)}).
                </p>
              )}

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {QUICK_AMOUNTS.map(quick => (
                  <button
                    key={quick}
                    type="button"
                    disabled={isSaldoZero || quick > availableBalance}
                    onClick={() => setAmount(quick)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold font-mono transition-all cursor-pointer border disabled:opacity-30 disabled:cursor-not-allowed ${
                      amount === quick
                        ? isDark
                          ? 'bg-[#00F0D0]/20 border-[#00F0D0] text-[#00F0D0]'
                          : 'bg-teal-50 border-teal-500 text-teal-800'
                        : isDark
                        ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:bg-[#202532]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    +{formatRupiah(quick)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sumber Dana (Dompet) */}
            <div>
              <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Diambil dari (Sumber Dana)
              </label>
              <div className="relative">
                <select
                  value={sourceFund}
                  onChange={e => setSourceFund(e.target.value)}
                  disabled={isSaldoZero}
                  className={`w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-xl border outline-none cursor-pointer transition-all disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#181B24] border-[#252A36] text-white focus:border-[#00F0D0]'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#00F0D0]'
                  }`}
                >
                  {WALLET_SOURCES.map(src => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Catatan (Opsional) */}
            <div>
              <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Catatan / Motivasi (Opsional)
              </label>
              <input
                type="text"
                value={note}
                disabled={isSaldoZero}
                onChange={e => setNote(e.target.value)}
                placeholder={currentGoal ? `Misal: Sisa uang jajan untuk ${currentGoal.name}` : 'Catatan nabung...'}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition-all disabled:opacity-50 ${
                  isDark
                    ? 'bg-[#181B24] border-[#252A36] text-white placeholder-slate-500 focus:border-[#00F0D0]'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#00F0D0]'
                }`}
              />
            </div>

            {/* Tanggal */}
            <div>
              <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Tanggal Setor
              </label>
              <input
                type="date"
                value={date}
                disabled={isSaldoZero}
                onChange={e => setDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition-all disabled:opacity-50 cursor-pointer ${
                  isDark
                    ? 'bg-[#181B24] border-[#252A36] text-white focus:border-[#00F0D0]'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-[#00F0D0]'
                }`}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={amount <= 0 || !currentGoal || isSaldoZero || isExceedingBalance}
                className="btn-cyan-pill w-full py-3 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <PiggyBank className="w-4 h-4" />
                <span>
                  {isSaldoZero
                    ? 'Nabung Tidak Bisa Dilakukan (Saldo Rp 0)'
                    : isExceedingBalance
                    ? 'Nominal Melebihi Saldo Kas'
                    : `Nabung Sekarang (${formatRupiah(amount)})`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
