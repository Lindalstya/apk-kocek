import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  PiggyBank,
  Calendar as CalendarIcon,
  Trash2,
} from 'lucide-react';
import { useKocek } from '../context/KocekContext';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface SavingGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: (goalId: string) => void;
}

export const SavingGoalsModal: React.FC<SavingGoalsModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit,
}) => {
  const { savingGoals, addSavingGoal, deleteSavingGoal, transactions, deleteTransaction, theme, summary } = useKocek();
  const isDark = theme === 'dark';
  const isSaldoZero = (summary?.totalBalance ?? 0) <= 0;

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('2026-12-30');
  const [icon, setIcon] = useState('🎯');
  const [iconCategory, setIconCategory] = useState('all');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedGoalDetailId, setSelectedGoalDetailId] = useState<string | null>(null);
  const [confirmDeleteDepositId, setConfirmDeleteDepositId] = useState<string | null>(null);

  const ICON_GROUPS: Record<string, string[]> = {
    fashion: ['👟', '👠', '🥾', '👗', '👕', '👜', '🎒', '⌚', '🕶️', '💄', '💍', '🧢', '🧥', '👡'],
    gadget: ['📱', '💻', '🎧', '📷', '🎮', '🖥️', '⌨️', '📺', '🕹️', '⌚', '🎙️', '🔌'],
    kendaraan: ['🛵', '🚗', '🚲', '🛹', '⛽', '🏎️', '🏍️', '🚙', '🛞', '🛴'],
    liburan: ['✈️', '🏖️', '🏕️', '🧳', '🎫', '🌴', '🏨', '🚢', '🗺️', '⛩️', '🗻'],
    rumah: ['🏠', '🛋️', '🛏️', '🪴', '🍳', '📺', '🚪', '🧹', '🏡', '🏢'],
    finansial: ['🛡️', '💰', '📈', '🎓', '📚', '👶', '🕋', '🐑', '🪙', '📜', '💎'],
    hobi: ['⚽', '🏋️', '🎸', '🎨', '☕', '🚴', '🏊', '🎾', '🏸', '🎮', '🎯', '🧁'],
  };

  const allIcons = Object.values(ICON_GROUPS).flat();
  const filteredIcons = iconCategory === 'all' ? allIcons : (ICON_GROUPS[iconCategory] || allIcons);

  useEffect(() => {
    if (!isOpen) {
      setSelectedGoalDetailId(null);
      setConfirmDeleteDepositId(null);
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(targetAmount.replace(/\D/g, ''), 10);
    if (parsedAmount && name.trim()) {
      addSavingGoal({
        name: name.trim(),
        targetAmount: parsedAmount,
        deadline,
        icon,
        color: '#00F0D0',
      });
      setName('');
      setTargetAmount('');
      setIsAdding(false);
    }
  };

  const selectedGoal = selectedGoalDetailId ? savingGoals.find(g => g.id === selectedGoalDetailId) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border transition-colors ${
          isDark ? 'bg-[#12151C] text-slate-100 border-[#252A36]' : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#00F0D0]" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Target Tabungan (Saving Goals)
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div
            className={`p-3 rounded-2xl text-xs leading-relaxed border ${
              isDark ? 'bg-blue-950/40 border-blue-800/80 text-blue-200' : 'bg-[#EAF2FF] border-[#C5DCFF] text-[#181B24]'
            }`}
          >
            <span className="font-bold">Info: </span>
            Saving goal bukan rekening sungguhan. Kocek mencatat progress target untuk membangun kebiasaan menabung secara konsisten.
          </div>

          {isSaldoZero && (
            <div className="p-3 rounded-2xl border bg-amber-500/10 border-amber-500/30 text-amber-300 text-xs">
              ⚠️ <strong>Saldo Kas Saat Ini Rp 0:</strong> Catat pemasukan atau saldo awal terlebih dahulu sebelum menyisihkan tabungan ke target.
            </div>
          )}

          {/* Drilled-down Detail View of a specific Goal */}
          {selectedGoal ? (() => {
            const goalTxs = (transactions || [])
              .filter(t => t.type === 'saving' && t.savingGoalId === selectedGoal.id)
              .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
            const totalRecorded = goalTxs.reduce((sum, t) => sum + t.amount, 0);
            const initialBalance = Math.max(0, selectedGoal.currentAmount - totalRecorded);
            const percentage = selectedGoal.targetAmount > 0
              ? Math.min(100, Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100))
              : 0;
            const remaining = Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount);

            const daysLeft = Math.ceil(
              (new Date(selectedGoal.deadline + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) /
                86400000
            );

            const dateGroups: Record<string, typeof goalTxs> = {};
            goalTxs.forEach(t => {
              (dateGroups[t.date] = dateGroups[t.date] || []).push(t);
            });
            const sortedDates = Object.keys(dateGroups).sort().reverse();

            return (
              <div className="space-y-3 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGoalDetailId(null);
                    setConfirmDeleteDepositId(null);
                  }}
                  className="text-xs font-bold cursor-pointer"
                  style={{ color: '#00F0D0' }}
                >
                  ‹ Kembali ke daftar target
                </button>

                {/* Goal summary header */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-[#181B24] border-[#252A36] text-white' : 'bg-[#F7F9FC] border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{selectedGoal.icon}</span>
                      <div>
                        <h3 className="text-sm font-extrabold">{selectedGoal.name}</h3>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Target: {formatDateIndo(selectedGoal.deadline, { includeDayName: false })} ·{' '}
                          {daysLeft > 0 ? `${daysLeft} hari lagi` : daysLeft === 0 ? 'hari ini' : `lewat ${-daysLeft} hari`}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: '#00F0D0' }}>
                      {percentage}%
                    </span>
                  </div>

                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className="h-full rounded-full bg-[#00F0D0] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold tabular-nums">
                      {formatRupiah(selectedGoal.currentAmount)}{' '}
                      <span className="text-slate-400 font-normal">/ {formatRupiah(selectedGoal.targetAmount)}</span>
                    </span>
                    <span className="text-slate-400">Sisa {formatRupiah(remaining)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenDeposit(selectedGoal.id);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    style={{ background: '#00F0D0', color: '#06231F' }}
                  >
                    <PiggyBank className="w-4 h-4" />
                    <span>Nabung ke {selectedGoal.name}</span>
                  </button>
                </div>

                {/* Deposit History */}
                <p className={`text-xs font-bold px-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Riwayat Nabung ({goalTxs.length})
                </p>

                {goalTxs.length === 0 ? (
                  <div
                    className={`p-4 rounded-2xl border text-center text-[11px] ${
                      isDark ? 'bg-[#181B24] border-[#252A36] text-[#8E97A6]' : 'bg-[#F7F9FC] border-slate-200 text-slate-500'
                    }`}
                  >
                    Belum ada riwayat nabung. Klik + Nabung untuk mulai.
                  </div>
                ) : (
                  sortedDates.map(dateKey => (
                    <div key={dateKey} className="space-y-1.5">
                      <p className={`text-[11px] font-bold px-1 ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
                        {formatDateIndo(dateKey, { includeDayName: true })}
                      </p>
                      {dateGroups[dateKey].map(tx => (
                        <div
                          key={tx.id}
                          className={`p-2.5 rounded-xl border ${
                            isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-[#F7F9FC] border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className={`text-xs font-semibold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {tx.note || 'Tabungan'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {tx.time ? `${tx.time} WIB` : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-bold font-mono tabular-nums" style={{ color: '#00F0D0' }}>
                                +{formatRupiah(tx.amount)}
                              </span>
                              <button
                                type="button"
                                title="Hapus"
                                onClick={() => setConfirmDeleteDepositId(tx.id)}
                                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-all"
                                style={{ background: 'rgba(255,75,114,0.12)', color: '#FF4B72' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {confirmDeleteDepositId === tx.id && (
                            <div
                              className="mt-2 p-2.5 rounded-xl space-y-2"
                              style={{ background: 'rgba(255,75,114,0.10)', border: '1px solid rgba(255,75,114,0.45)' }}
                            >
                              <p className="text-[11px] font-semibold" style={{ color: '#FF4B72' }}>
                                Hapus setoran ini? Saldo target ikut berkurang.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteDepositId(null)}
                                  className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                                    isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'
                                  }`}
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteTransaction(tx.id);
                                    setConfirmDeleteDepositId(null);
                                  }}
                                  className="flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
                                  style={{ background: '#FF4B72', color: '#fff' }}
                                >
                                  Ya, Hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}

                {initialBalance > 0 && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                      isDark ? 'border-[#252A36] text-[#8E97A6]' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>Saldo awal (sebelum pencatatan)</span>
                    <span className="font-mono tabular-nums font-bold">{formatRupiah(initialBalance)}</span>
                  </div>
                )}
              </div>
            );
          })() : isAdding ? (
            /* Create New Goal Form */
            <form onSubmit={handleCreateSubmit} className="space-y-3 animate-in fade-in">
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nama Target
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Laptop, Liburan, Dana Darurat"
                  required
                  autoFocus
                  className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#00F0D0] ${
                    isDark ? 'bg-[#181B24] border-slate-700 text-white' : 'bg-[#F7F9FC] border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Target Nominal (Rupiah)
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="10000000"
                  required
                  className={`w-full border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-[#00F0D0] ${
                    isDark ? 'bg-[#181B24] border-slate-700 text-white' : 'bg-[#F7F9FC] border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tenggat Waktu (Deadline)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  required
                  className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#00F0D0] ${
                    isDark ? 'bg-[#181B24] border-slate-700 text-white' : 'bg-[#F7F9FC] border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Enhanced Icon Picker with Categorized Tabs & Custom Emoji Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Pilih Ikon Target
                  </label>
                  <span className="text-xs font-bold flex items-center gap-1">
                    Terpilih: <span className="text-xl">{icon}</span>
                  </span>
                </div>

                {/* Custom Emoji Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={icon}
                    onChange={e => {
                      const val = e.target.value;
                      if (val) setIcon(val.slice(-2)); // keep last emoji/char
                    }}
                    placeholder="Ketik / paste emoji bebas (misal: 👟, 🏎️)"
                    maxLength={4}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-[#181B24] border-slate-700 text-white' : 'bg-[#F7F9FC] border-slate-200 text-slate-900'
                    }`}
                  />
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Bisa ketik sendiri
                  </span>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'fashion', label: 'Fashion & Sepatu 👟' },
                    { id: 'gadget', label: 'Gadget 💻' },
                    { id: 'kendaraan', label: 'Kendaraan 🛵' },
                    { id: 'liburan', label: 'Liburan ✈️' },
                    { id: 'rumah', label: 'Rumah 🏠' },
                    { id: 'finansial', label: 'Masa Depan 💰' },
                    { id: 'hobi', label: 'Hobi & Gaya ⚽' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setIconCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        iconCategory === cat.id
                          ? 'bg-[#00F0D0] text-[#0E1116]'
                          : isDark
                          ? 'bg-[#181B24] text-slate-300 hover:bg-[#202532]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl border border-slate-700/40 bg-black/10">
                  {filteredIcons.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center cursor-pointer transition-all ${
                        icon === emoji
                          ? 'bg-[#00F0D0] text-white scale-110 shadow-md shadow-[#00F0D0]/40'
                          : isDark
                          ? 'bg-slate-800 text-white hover:bg-slate-700'
                          : 'bg-white hover:bg-slate-100 shadow-xs'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00F0D0] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-[#00F0D0]/30 active:scale-98 transition-all cursor-pointer"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          ) : (
            /* Saving Goals Cards List */
            <div className="space-y-3">
              <button
                onClick={() => setIsAdding(true)}
                className={`w-full py-3 rounded-2xl border-2 border-dashed font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-700 hover:border-[#00F0D0] text-[#60A5FA] hover:bg-blue-950/20'
                    : 'border-slate-300 hover:border-[#00F0D0] text-[#00F0D0] hover:bg-blue-50/50'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Buat Target Tabungan Baru</span>
              </button>

              {savingGoals.map(goal => {
                const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoalDetailId(goal.id)}
                    className={`p-4 rounded-2xl border space-y-3 shadow-sm transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#181B24] border-[#252A36] text-white hover:border-[#00F0D0]/50'
                        : 'bg-[#F7F9FC] border-slate-200 text-slate-900 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{goal.icon}</span>
                        <div>
                          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {goal.name}
                          </h4>
                          <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <CalendarIcon className="w-3 h-3" />
                            Target: {formatDateIndo(goal.deadline, { includeDayName: false })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#00F0D0] tabular-nums">{percentage}%</span>
                        <button
                          type="button"
                          title="Hapus target"
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmDeleteId(goal.id);
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-all"
                          style={{ background: 'rgba(255,75,114,0.12)', color: '#FF4B72' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {confirmDeleteId === goal.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="rounded-xl p-3 space-y-2"
                        style={{ background: 'rgba(255,75,114,0.10)', border: '1px solid rgba(255,75,114,0.45)' }}
                      >
                        <p className="text-xs font-semibold" style={{ color: '#FF4B72' }}>
                          Hapus target "{goal.name}"? Riwayat transaksi tabungan tetap tersimpan.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteSavingGoal(goal.id);
                              setConfirmDeleteId(null);
                            }}
                            className="flex-1 py-1.5 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all"
                            style={{ background: '#FF4B72', color: '#fff' }}
                          >
                            Ya, Hapus
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div
                        className="h-full rounded-full bg-[#00F0D0] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className={`font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {formatRupiah(goal.currentAmount)}{' '}
                        <span className="text-slate-400 font-normal">/ {formatRupiah(goal.targetAmount)}</span>
                      </span>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onOpenDeposit(goal.id);
                          onClose();
                        }}
                        className="px-3 py-1 bg-[#00F0D0] hover:brightness-110 text-white rounded-xl font-semibold text-xs shadow-sm shadow-[#00F0D0]/30 active:scale-95 transition-all cursor-pointer"
                      >
                        + Nabung
                      </button>
                    </div>

                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Ketuk kartu untuk lihat riwayat nabung ›
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
