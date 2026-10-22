import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Store,
  FileText,
  Pen,
  Trash2,
} from 'lucide-react';
import { useKocek } from '../context/KocekContext';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { Transaction } from '../types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const { deleteTransaction, updateTransaction, theme } = useKocek();
  const isDark = theme === 'dark';

  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setEditNote(transaction.note || '');
      setEditAmount(transaction.amount.toString());
      setShowConfirmDelete(!!transaction.__del);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(editAmount, 10);
    if (parsedAmount > 0) {
      updateTransaction(transaction.id, {
        note: editNote.trim(),
        amount: parsedAmount,
      });
      setIsEditing(false);
      onClose();
    }
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className={`rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 border transition-colors ${
          isDark ? 'bg-[#12151C] text-slate-100 border-[#252A36]' : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Detail Transaksi
          </span>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nominal
              </label>
              <input
                type="number"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                className={`w-full border rounded-xl p-2.5 text-sm font-bold font-mono ${
                  isDark ? 'bg-[#181B24] border-slate-700 text-white' : 'bg-[#F7F9FC] border-slate-200 text-slate-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Catatan
              </label>
              <input
                type="text"
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                className={`w-full border rounded-xl p-2.5 text-xs ${
                  isDark ? 'bg-[#181B24] border-slate-700 text-white' : 'bg-[#F7F9FC] border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#00F0D0] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-[#00F0D0]/30 active:scale-98 transition-all cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-2">
              <span className="text-xs text-slate-400 block mb-1">{transaction.category}</span>
              <div
                className={`text-2xl font-bold font-mono ${
                  transaction.type === 'income'
                    ? 'text-emerald-500'
                    : transaction.type === 'saving'
                    ? 'text-[#00F0D0]'
                    : isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatRupiah(transaction.amount)}
              </div>
            </div>

            <div className={`rounded-2xl p-3.5 space-y-2 text-xs border ${isDark ? 'bg-[#181B24] border-[#252A36] text-slate-300' : 'bg-[#F7F9FC] border-slate-100 text-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Tanggal
                </span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {formatDateIndo(transaction.date)}
                </span>
              </div>

              {transaction.time && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Waktu
                  </span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {transaction.time} WIB
                  </span>
                </div>
              )}

              {(transaction.sourceFund || transaction.merchant) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    Sumber Dana
                  </span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {transaction.sourceFund || transaction.merchant}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                  Catatan
                </span>
                <span className={`font-medium text-right max-w-[60%] ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {transaction.note || '-'}
                </span>
              </div>

              {transaction.source && (
                <div className={`flex items-center justify-between pt-1 border-t text-[11px] ${isDark ? 'border-[#252A36]' : 'border-slate-200/60'}`}>
                  <span className="text-slate-400">Metode input</span>
                  <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {transaction.source === 'receipt'
                      ? 'Scan Struk OCR'
                      : transaction.source === 'voice'
                      ? 'Voice Input'
                      : 'Input Manual'}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className={`${showConfirmDelete ? 'hidden' : 'flex'} gap-2 pt-1`}>
              <button
                onClick={() => {
                  setEditNote(transaction.note || '');
                  setEditAmount(transaction.amount.toString());
                  setIsEditing(true);
                }}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Pen className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setShowConfirmDelete(true)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDark
                    ? 'border-rose-900/60 bg-rose-950/40 hover:bg-rose-950/70 text-rose-400'
                    : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>

            {showConfirmDelete && (
              <div
                className="rounded-2xl p-3.5 space-y-3"
                style={{ background: 'rgba(255, 75, 114, 0.10)', border: '1px solid rgba(255, 75, 114, 0.45)' }}
              >
                <p className="text-xs font-semibold text-center" style={{ color: '#FF4B72' }}>
                  {transaction.type === 'saving'
                    ? 'Hapus tabungan ini? Saldo target tabungan juga akan berkurang.'
                    : 'Hapus transaksi ini?'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmDelete(false);
                      if (transaction.__del) onClose();
                    }}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                      isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all"
                    style={{ background: '#FF4B72', color: '#fff' }}
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
