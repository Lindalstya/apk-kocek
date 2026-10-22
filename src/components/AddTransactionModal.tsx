import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Tag,
  Wallet,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Camera,
  Upload,
  RefreshCw,
  Mic,
  MicOff,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Video,
  VideoOff,
  AlertCircle,
  Image as ImageIcon,
  Edit3,
  Store,
} from 'lucide-react';
import { useKocek, DEFAULT_CATEGORIES } from '../context/KocekContext';
import { formatRupiah, getTodayString, getCurrentTimeString } from '../utils/formatters';
import { parseIndonesianVoiceTransaction } from '../utils/nlpParser';
import { TransactionType } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  initialTab?: 'manual' | 'receipt' | 'voice';
  initialDate?: string;
  initialCategory?: string;
  initialNote?: string;
  initialAmount?: number;
  initialType?: TransactionType;
  lockType?: TransactionType;
  onClose: () => void;
  savingGoalId?: string | null;
}

const DEFAULT_SOURCES = [
  { id: 'cash', name: 'Kas / Dompet Tunai', icon: '💵', category: 'Tunai' },
  { id: 'bca', name: 'Bank BCA', icon: '🏦', category: 'Bank' },
  { id: 'mandiri', name: 'Bank Mandiri', icon: '🏦', category: 'Bank' },
  { id: 'bri', name: 'Bank BRI', icon: '🏦', category: 'Bank' },
  { id: 'bni', name: 'Bank BNI', icon: '🏦', category: 'Bank' },
  { id: 'jago', name: 'Bank Jago', icon: '💳', category: 'Bank Digital' },
  { id: 'gopay', name: 'GoPay', icon: '🟢', category: 'E-Wallet' },
  { id: 'ovo', name: 'OVO', icon: '🟣', category: 'E-Wallet' },
  { id: 'shopeepay', name: 'ShopeePay', icon: '🟠', category: 'E-Wallet' },
  { id: 'dana', name: 'DANA', icon: '🔵', category: 'E-Wallet' },
];


export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  initialTab = 'manual',
  initialDate,
  initialCategory,
  initialNote,
  initialAmount,
  initialType,
  lockType,
  onClose,
  savingGoalId,
}) => {
  const { addTransaction, theme, savingGoals, summary } = useKocek();
  const targetGoal = savingGoalId ? (savingGoals || []).find(g => g.id === savingGoalId) : null;
  const isDark = theme === 'dark';
  const availableBalance = summary?.totalBalance ?? 0;
  const isSavingTarget = Boolean(savingGoalId);
  const isZeroBalanceForSaving = isSavingTarget && availableBalance <= 0;
  const isIncomeOnly = lockType === 'income';

  const [activeSubView, setActiveSubView] = useState<'none' | 'category_picker' | 'source_picker' | 'amount_picker' | 'receipt' | 'voice'>('none');
  const [type, setType] = useState<TransactionType>(lockType || initialType || 'expense');
  const [amount, setAmount] = useState<number>(initialAmount || 0);
  const isExceedingBalanceForSaving = isSavingTarget && amount > availableBalance;
  const [category, setCategory] = useState<string>(initialCategory || (isIncomeOnly ? 'Gaji / Pemasukan' : 'Makanan'));
  const [sourceFund, setSourceFund] = useState<string>('Kas / Dompet Tunai');
  const [customSource, setCustomSource] = useState<string>('');
  const [date, setDate] = useState<string>(initialDate || getTodayString());
  const [time, setTime] = useState<string>(() => getCurrentTimeString());
  const [note, setNote] = useState<string>(initialNote || '');

  // Receipt Scanner states
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptScanError, setReceiptScanError] = useState<string>('');
  const [receiptParsedData, setReceiptParsedData] = useState<{
    merchant: string;
    total: number;
    category: string;
    note: string;
    date: string;
  } | null>(null);
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when closing modal or switching subview
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraLive(false);
  };

  const startLiveCamera = async () => {
    setCameraError('');
    setIsStartingCamera(true);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Kamera tidak didukung pada browser ini. Silakan gunakan tombol Unggah Foto Struk.');
      }
      stopLiveCamera();
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setIsCameraLive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Gagal mengaktifkan kamera:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Izin kamera belum diizinkan oleh browser. Silakan izinkan akses kamera atau pilih file foto struk dari galeri.'
          : 'Kamera tidak dapat diakses saat ini. Anda dapat mengunggah file foto struk dari galeri.'
      );
      setIsCameraLive(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (!isOpen || activeSubView !== 'receipt') {
      stopLiveCamera();
    } else if (isOpen && activeSubView === 'receipt' && !receiptImage && !isCameraLive && !cameraError) {
      startLiveCamera();
    }
  }, [isOpen, activeSubView, receiptImage]);

  useEffect(() => {
    if (isCameraLive && videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraLive]);

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    stopLiveCamera();
    setReceiptImage(base64);
    processReceipt(base64);
  };

  // Voice Input states
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [voiceParsedResult, setVoiceParsedResult] = useState<{
    type: TransactionType;
    amount: number;
    category: string;
    note: string;
    date: string;
  } | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setActiveSubView(initialTab === 'receipt' ? 'receipt' : initialTab === 'voice' ? 'voice' : 'none');
    if (isOpen) {
      setDate(initialDate || getTodayString());
      setTime(getCurrentTimeString());
      if (lockType) {
        setType(lockType);
        setCategory(initialCategory || (lockType === 'income' ? 'Gaji / Pemasukan' : 'Makanan'));
      } else if (initialType) {
        setType(initialType);
        if (initialCategory) setCategory(initialCategory);
      } else if (initialCategory) {
        setCategory(initialCategory);
      }
      if (initialNote) setNote(initialNote);
      if (initialAmount) setAmount(initialAmount);
    }
  }, [initialTab, isOpen, initialDate, initialCategory, initialNote, initialAmount, initialType, lockType]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (amount <= 0) {
      setActiveSubView('amount_picker');
      return;
    }

    if (savingGoalId) {
      if (availableBalance <= 0 || amount > availableBalance) {
        return;
      }
      addTransaction({
        type: 'saving',
        savingGoalId,
        amount,
        category: 'Tabungan',
        note: note.trim() || `Tabungan untuk ${targetGoal ? targetGoal.name : 'target'}`,
        date: date || getTodayString(),
        time: time || getCurrentTimeString(),
        sourceFund,
        merchant: sourceFund,
        source: 'manual',
      });
    } else {
      addTransaction({
        type,
        amount,
        category,
        note: note.trim() || category,
        date: date || getTodayString(),
        time: time || getCurrentTimeString(),
        sourceFund,
        merchant: sourceFund,
        source: 'manual',
      });
    }

    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    stopLiveCamera();
    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      setReceiptImage(base64);
      processReceipt(base64);
    };
    reader.readAsDataURL(file);
  };

  const processReceipt = async (base64: string) => {
    setIsScanningReceipt(true);
    setReceiptParsedData(null);
    setReceiptScanError('');

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (response.ok) {
        const data = await response.json();
        setReceiptParsedData({
          merchant: data.merchant || 'Struk Belanja',
          total: Number(data.total) || 0,
          category: data.category || 'Belanja',
          note: data.note || 'Transaksi struk belanja',
          date: data.date || getTodayString(),
        });
      } else {
        const errJson = await response.json().catch(() => ({}));
        setReceiptScanError(errJson.error || 'Belum dapat membaca otomatis. Anda dapat mengisi data struk di bawah.');
        setReceiptParsedData({
          merchant: 'Struk Belanja',
          total: 0,
          category: 'Belanja',
          note: 'Belanja keperluan',
          date: getTodayString(),
        });
      }
    } catch {
      setReceiptScanError('Koneksi scanner tidak tersedia. Silakan lengkapi rincian struk belanja di bawah.');
      setReceiptParsedData({
        merchant: 'Struk Belanja',
        total: 0,
        category: 'Belanja',
        note: 'Belanja keperluan',
        date: getTodayString(),
      });
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const applyReceiptData = () => {
    if (receiptParsedData) {
      setAmount(receiptParsedData.total);
      setCategory(receiptParsedData.category);
      setNote(`${receiptParsedData.merchant} - ${receiptParsedData.note}`);
      if (receiptParsedData.date) setDate(receiptParsedData.date);
      stopLiveCamera();
      setActiveSubView('none');
    }
  };

  const handleSaveReceiptDirect = () => {
    if (!receiptParsedData) return;
    if (receiptParsedData.total <= 0) {
      setReceiptScanError('Nominal total struk harus lebih dari Rp 0 sebelum disimpan.');
      return;
    }

    if (savingGoalId) {
      addTransaction({
        type: 'saving',
        savingGoalId,
        amount: receiptParsedData.total,
        category: 'Tabungan',
        note: `${receiptParsedData.merchant} - ${receiptParsedData.note}`,
        date: receiptParsedData.date || getTodayString(),
        time: getCurrentTimeString(),
        sourceFund,
        merchant: receiptParsedData.merchant,
        source: 'receipt',
      });
    } else {
      addTransaction({
        type: 'expense',
        amount: receiptParsedData.total,
        category: receiptParsedData.category || 'Belanja',
        note: `${receiptParsedData.merchant} - ${receiptParsedData.note}`,
        date: receiptParsedData.date || getTodayString(),
        time: getCurrentTimeString(),
        sourceFund,
        merchant: receiptParsedData.merchant,
        source: 'receipt',
      });
    }

    stopLiveCamera();
    setReceiptImage(null);
    setReceiptParsedData(null);
    onClose();
  };

  const startVoiceInput = () => {
    if (isListeningVoice) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    setVoiceError('');

    if (!SpeechRecognition) {
      setVoiceError('Browser ini belum mendukung speech recognition native. Silakan ketik kalimat atau klik contoh di bawah.');
      return;
    }

    try {
      const recognition = new (SpeechRecognition as any)();
      recognitionRef.current = recognition;
      recognition.lang = 'id-ID';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setVoiceError('');
      };

      recognition.onresult = (event: any) => {
        let finalTxt = '';
        let interimTxt = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTxt += event.results[i][0].transcript;
          } else {
            interimTxt += event.results[i][0].transcript;
          }
        }
        const text = (finalTxt || interimTxt).trim();
        if (text) {
          setVoiceTranscript(text);
          const parsed = parseIndonesianVoiceTransaction(text);
          setVoiceParsedResult(parsed);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListeningVoice(false);
        if (event?.error === 'not-allowed') {
          setVoiceError('Izin mikrofon belum diberikan. Silakan izinkan mic di browser atau ketik kalimat / gunakan contoh di bawah.');
        } else if (event?.error !== 'no-speech') {
          setVoiceError(`Info mic: ${event?.error || 'Tidak ada suara'}. Silakan coba lagi.`);
        }
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
      setVoiceError('Gagal mengakses mikrofon. Silakan gunakan contoh kalimat cepat di bawah.');
    }
  };

  const handleTranscriptTextChange = (text: string) => {
    setVoiceTranscript(text);
    if (text.trim()) {
      const parsed = parseIndonesianVoiceTransaction(text);
      setVoiceParsedResult(parsed);
    } else {
      setVoiceParsedResult(null);
    }
  };

  const handleApplyVoiceToForm = () => {
    if (voiceParsedResult) {
      setType(voiceParsedResult.type);
      setAmount(voiceParsedResult.amount);
      setCategory(voiceParsedResult.category);
      setNote(voiceParsedResult.note);
      setActiveSubView('none');
    }
  };

  const handleDirectSaveVoice = () => {
    if (voiceParsedResult && voiceParsedResult.amount > 0) {
      if (savingGoalId) {
        addTransaction({
          type: 'saving',
          savingGoalId,
          amount: voiceParsedResult.amount,
          category: 'Tabungan',
          note: voiceParsedResult.note,
          date: date || getTodayString(),
          time: time || getCurrentTimeString(),
          sourceFund,
          merchant: sourceFund,
          source: 'voice',
        });
      } else {
        addTransaction({
          type: voiceParsedResult.type,
          amount: voiceParsedResult.amount,
          category: voiceParsedResult.category,
          note: voiceParsedResult.note,
          date: date || getTodayString(),
          time: time || getCurrentTimeString(),
          sourceFund,
          merchant: sourceFund,
          source: 'voice',
        });
      }
      onClose();
    }
  };

  const parseVoiceTranscript = (transcript: string) => {
    setVoiceTranscript(transcript);
    setVoiceError('');
    const parsed = parseIndonesianVoiceTransaction(transcript);
    setVoiceParsedResult(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`rounded-t-3xl sm:rounded-3xl max-w-sm w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border relative transition-colors duration-200 ${
          isDark ? 'bg-[#0E1116] border-[#252A36] text-white' : 'bg-[#F8FAFC] border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 pt-4 pb-3 flex items-center justify-between border-b ${
            isDark ? 'border-[#202532] bg-[#12151C]' : 'border-slate-200 bg-white'
          }`}
        >
          <div>
            <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {savingGoalId ? 'Nabung' : isIncomeOnly ? 'Tambah Saldo' : 'Tambah Transaksi'}
            </h2>
            <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
              {savingGoalId
                ? 'Tambah saldo target tabunganmu'
                : isIncomeOnly
                ? 'Catat saldo awal, gaji, transferan, atau uang masuk'
                : 'Catat pemasukan atau pengeluaranmu'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
              isDark
                ? 'bg-[#181B24] text-slate-300 hover:text-white border border-[#252A36]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {/* Target saving badge if applicable */}
          {savingGoalId && (
            <div className="space-y-2">
              <div
                className="p-3 rounded-2xl flex items-center gap-2.5"
                style={{ background: 'rgba(0, 240, 208, 0.10)', border: '1px solid rgba(0, 240, 208, 0.4)' }}
              >
                <span className="text-xl">{targetGoal ? targetGoal.icon : '🎯'}</span>
                <div>
                  <span className="text-xs font-bold block">Nabung ke {targetGoal ? targetGoal.name : 'target'}</span>
                  <span className="text-[10px] text-slate-400 block">Masuk ke progress target, bukan pengeluaran</span>
                </div>
              </div>

              {availableBalance <= 0 ? (
                <div className="p-3 rounded-2xl border bg-rose-500/10 border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-200">Saldo Awal Belum Ada (Rp 0)</span>
                    <span className="text-[11px] text-rose-300/80 block mt-0.5">
                      Nabung belum bisa dilakukan karena saldo kas masih Rp 0. Catat pemasukan / saldo awal terlebih dahulu.
                    </span>
                  </div>
                </div>
              ) : (
                <div className={`p-2 px-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[11px] text-slate-400">Saldo Kas Tersedia:</span>
                  <span className="font-mono font-bold text-[#00F0D0]">{formatRupiah(availableBalance)}</span>
                </div>
              )}

              {isExceedingBalanceForSaving && availableBalance > 0 && (
                <p className="text-[10px] text-rose-400 font-bold px-1">
                  ⚠️ Nominal tabungan melebihi sisa saldo kas ({formatRupiah(availableBalance)}).
                </p>
              )}
            </div>
          )}

          {/* Type Toggle: Pengeluaran vs Pemasukan (Or locked income banner if isIncomeOnly) */}
          {savingGoalId ? null : isIncomeOnly ? (
            <div className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
              isDark ? 'bg-teal-950/40 border-[#00F0D0]/40 text-white' : 'bg-teal-50 border-teal-300 text-teal-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-[#00F0D0]/20 text-[#00F0D0]' : 'bg-teal-100 text-teal-700'
                }`}>
                  <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Pemasukan & Saldo</span>
                  <span className="text-[10px] text-slate-400 block">Menambah saldo kas & sisa alokasi</span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#00F0D0]/20 text-[#00F0D0] border border-[#00F0D0]/40">
                Saldo Masuk
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  type === 'expense'
                    ? isDark
                      ? 'bg-rose-950/40 border-rose-700 ring-1 ring-rose-500/50'
                      : 'bg-rose-50 border-rose-300 shadow-xs ring-1 ring-rose-300'
                    : isDark
                    ? 'bg-[#141824] border-[#252A36] text-slate-400'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    type === 'expense'
                      ? isDark ? 'bg-rose-900/60 text-rose-300' : 'bg-rose-100 text-rose-600'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Pengeluaran</span>
                  <span className="text-[10px] text-slate-400 block truncate">Uang keluar</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('income')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  type === 'income'
                    ? isDark
                      ? 'bg-teal-950/40 border-[#00F0D0] ring-1 ring-[#00F0D0]/50'
                      : 'bg-teal-50 border-teal-300 shadow-xs ring-1 ring-teal-300'
                    : isDark
                    ? 'bg-[#141824] border-[#252A36] text-slate-400'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    type === 'income'
                      ? isDark ? 'bg-[#00F0D0]/20 text-[#00F0D0]' : 'bg-teal-100 text-teal-700'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Pemasukan</span>
                  <span className="text-[10px] text-slate-400 block truncate">Uang masuk</span>
                </div>
              </button>
            </div>
          )}

          {/* Form Rows Container */}
          <div
            className={`rounded-2xl p-1.5 border divide-y transition-colors ${
              isDark ? 'bg-[#141824] border-[#252A36] divide-[#202532] text-white' : 'bg-white border-slate-200 divide-slate-100 text-slate-900'
            }`}
          >
            {/* Row 1: Kategori */}
            <div
              onClick={() => setActiveSubView('category_picker')}
              className={`p-2.5 flex items-center justify-between rounded-xl transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#1A1F2E]' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
                  <Tag className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Kategori</span>
                  <span className="text-[10px] text-slate-400 block">Pilih jenis transaksi</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold">
                <span className={isDark ? 'text-[#00F0D0]' : 'text-teal-700'}>{category}</span>
                <span className="text-slate-400">›</span>
              </div>
            </div>

            {/* Row 2: Sumber Dana */}
            <div
              onClick={() => setActiveSubView('source_picker')}
              className={`p-2.5 flex items-center justify-between rounded-xl transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#1A1F2E]' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
                  <Wallet className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Sumber Dana</span>
                  <span className="text-[10px] text-slate-400 block">Dompet / Rekening</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold">
                <span className={isDark ? 'text-white font-medium' : 'text-slate-700 font-medium'}>{sourceFund}</span>
                <span className="text-slate-400">›</span>
              </div>
            </div>

            {/* Row 3: Nominal */}
            <div
              onClick={() => setActiveSubView('amount_picker')}
              className={`p-2.5 flex items-center justify-between rounded-xl transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#1A1F2E]' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
                  Rp
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Nominal</span>
                  <span className="text-[10px] text-slate-400 block">Berapa jumlah uang</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold font-mono">
                <span className={isDark ? 'text-[#00F0D0]' : 'text-teal-700'}>
                  {amount > 0 ? formatRupiah(amount) : 'Pilih Nominal'}
                </span>
                <span className="text-slate-400">›</span>
              </div>
            </div>

            {/* Row 4: Tanggal */}
            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
                  <CalendarIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Tanggal</span>
                  <span className="text-[10px] text-slate-400 block">Tanggal transaksi</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDate(getTodayString())}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                    date === getTodayString()
                      ? isDark ? 'bg-[#00F0D0]/20 text-[#00F0D0]' : 'bg-teal-100 text-teal-800'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Hari Ini
                </button>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                    isDark ? 'bg-[#0E1116] border-[#252A36] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Row 5: Waktu */}
            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
                  <Clock className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Waktu</span>
                  <span className="text-[10px] text-slate-400 block">Jam pencatatan</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTime(getCurrentTimeString())}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                    isDark ? 'bg-[#00F0D0]/20 text-[#00F0D0] hover:bg-[#00F0D0]/30' : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                  }`}
                  title="Sinkronkan dengan jam sekarang"
                >
                  Sekarang
                </button>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                    isDark ? 'bg-[#0E1116] border-[#252A36] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Row 6: Catatan */}
            <div className="p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
                  <FileText className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Catatan</span>
                  <span className="text-[10px] text-slate-400 block">Keterangan</span>
                </div>
              </div>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={type === 'income' ? 'misal: Gaji bulan ini, Kiriman orang tua...' : 'misal: Makan siang...'}
                className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none w-44 text-right ${
                  isDark
                    ? 'bg-[#0E1116] border-[#252A36] text-white placeholder-slate-500 focus:border-[#00F0D0]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-600'
                }`}
              />
            </div>
          </div>

          {/* Quick Smart Input Row */}
          <div className={`rounded-2xl p-3 border space-y-2 ${isDark ? 'bg-[#141824] border-[#252A36]' : 'bg-white border-slate-200'}`}>
            <span className={`text-[11px] font-bold block text-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Input Cepat Pintar
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveSubView('receipt')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all ${
                  isDark
                    ? 'bg-[#181B24] border-[#252A36] text-slate-200 hover:border-[#00F0D0]/50'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Camera className="w-4 h-4 text-[#00F0D0]" />
                <span className="text-xs font-bold">Scan Struk</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView('voice')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all ${
                  isDark
                    ? 'bg-[#181B24] border-[#252A36] text-slate-200 hover:border-[#00F0D0]/50'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Mic className="w-4 h-4 text-[#00F0D0]" />
                <span className="text-xs font-bold">Voice Input</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isZeroBalanceForSaving || isExceedingBalanceForSaving}
            className="w-full py-3.5 rounded-2xl btn-cyan-pill text-sm font-extrabold tracking-tight flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {isZeroBalanceForSaving
                ? 'Tidak Bisa Menabung (Saldo Rp 0)'
                : isExceedingBalanceForSaving
                ? 'Saldo Kas Tidak Mencukupi'
                : isIncomeOnly || type === 'income'
                ? `Tambah Saldo ${amount > 0 ? `(${formatRupiah(amount)})` : ''}`
                : `Simpan Transaksi ${amount > 0 ? `(${formatRupiah(amount)})` : ''}`}
            </span>
          </button>
        </div>

        {/* Sub-view: Source of Funds Picker */}
        {activeSubView === 'source_picker' && (
          <div className={`absolute inset-0 z-20 flex flex-col p-4 animate-in fade-in ${isDark ? 'bg-[#0E1116] text-white' : 'bg-white text-slate-900'}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
              <div>
                <span className="text-sm font-bold block">
                  {type === 'income' ? 'Pilih Rekening / Kas Tujuan' : 'Pilih Sumber Dana'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {type === 'income' ? 'Ke mana uang masuk ini disimpan?' : 'Dari mana transaksi ini dibayarkan?'}
                </span>
              </div>
              <button onClick={() => setActiveSubView('none')} className={`p-1.5 rounded-full ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Input */}
            <div className="pt-3 pb-2 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Atau ketik nama rekening / dompet lain:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSource}
                  onChange={e => setCustomSource(e.target.value)}
                  placeholder="misal: Kantong Jajan, BCA Digital..."
                  className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-[#181B24] border-[#252A36] text-white focus:border-[#00F0D0]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                />
                <button
                  onClick={() => {
                    if (customSource.trim()) {
                      setSourceFund(customSource.trim());
                      setActiveSubView('none');
                    }
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl cursor-pointer ${
                    isDark ? 'bg-[#00F0D0] text-[#0E1116]' : 'bg-teal-600 text-white'
                  }`}
                >
                  Gunakan
                </button>
              </div>
            </div>

            {/* Source Grid */}
            <div className="grid grid-cols-2 gap-2 py-2 overflow-y-auto flex-1">
              {DEFAULT_SOURCES.map(src => (
                <button
                  key={src.id}
                  onClick={() => {
                    setSourceFund(src.name);
                    setActiveSubView('none');
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    sourceFund === src.name
                      ? isDark ? 'bg-[#00F0D0]/15 border-[#00F0D0] text-[#00F0D0] font-bold' : 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                      : isDark ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{src.icon}</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs truncate block">{src.name}</span>
                    <span className="text-[10px] text-slate-400 block">{src.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-view: Amount Keypad */}
        {activeSubView === 'amount_picker' && (
          <div className={`absolute inset-0 z-20 flex flex-col p-4 animate-in fade-in ${isDark ? 'bg-[#0E1116] text-white' : 'bg-white text-slate-900'}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
              <span className="text-sm font-bold">Masukkan Nominal</span>
              <button onClick={() => setActiveSubView('none')} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 text-center">
              <span className="text-xs text-slate-400 block mb-1">Total Transaksi</span>
              <div className={`text-3xl font-extrabold font-mono ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
                {formatRupiah(amount)}
              </div>
            </div>

            {/* Quick chips */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(type === 'income'
                ? [100000, 500000, 1000000, 2000000]
                : [20000, 50000, 100000, 250000]
              ).map(val => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isDark ? 'bg-[#181B24] border-[#252A36] text-white hover:border-[#00F0D0]' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  +{val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                </button>
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 flex-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '000', 0, 'DEL'].map(btn => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'DEL') {
                      setAmount(prev => Math.floor(prev / 10));
                    } else if (btn === '000') {
                      setAmount(prev => prev * 1000);
                    } else {
                      setAmount(prev => prev * 10 + Number(btn));
                    }
                  }}
                  className={`text-lg font-bold rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 border ${
                    isDark ? 'bg-[#141824] border-[#252A36] text-white hover:bg-[#1C2234]' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveSubView('none')}
              className="w-full mt-3 py-3 rounded-2xl btn-cyan-pill text-sm font-extrabold cursor-pointer"
            >
              Selesai
            </button>
          </div>
        )}

        {/* Sub-view: Category Picker */}
        {activeSubView === 'category_picker' && (
          <div className={`absolute inset-0 z-20 flex flex-col p-4 animate-in fade-in ${isDark ? 'bg-[#0E1116] text-white' : 'bg-white text-slate-900'}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
              <div>
                <span className="text-sm font-bold">
                  {isIncomeOnly || type === 'income' ? 'Pilih Kategori Pemasukan / Saldo' : 'Pilih Kategori Pengeluaran'}
                </span>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {type === 'expense' ? 'Kategori belanja & pengeluaran operasional' : 'Gaji, transferan, saldo awal, atau sumber pemasukan'}
                </p>
              </div>
              <button onClick={() => setActiveSubView('none')} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 py-4 overflow-y-auto flex-1">
              {(type === 'expense'
                ? [
                    { name: 'Makanan', icon: '🍜', desc: 'Makan & minum harian' },
                    { name: 'Transportasi', icon: '🚗', desc: 'Bensin, ojek, tol' },
                    { name: 'Belanja', icon: '🛍️', desc: 'Belanja bulanan' },
                    { name: 'Hiburan', icon: '🎮', desc: 'Game, film, nongkrong' },
                    { name: 'Tagihan', icon: '🧾', desc: 'Listrik, air, kuota, wifi' },
                    { name: 'Pendidikan', icon: '📚', desc: 'Kuliah, kursus, buku' },
                    { name: 'Kesehatan & Medis', icon: '💊', desc: 'Obat, dokter, vitamin' },
                    { name: 'Kebutuhan Pribadi', icon: '🧴', desc: 'Skincare, pakaian' },
                    { name: 'Lainnya', icon: '📦', desc: 'Pengeluaran lain' },
                  ]
                : [
                    { name: 'Gaji / Pemasukan', icon: '💵', desc: 'Gaji bulanan atau upah tetap' },
                    { name: 'Transfer Masuk', icon: '💸', desc: 'Kiriman uang orang tua / teman' },
                    { name: 'Saldo Awal / Modal', icon: '💰', desc: 'Setoran saldo awal kas / dompet' },
                    { name: 'Bonus & THR', icon: '🎁', desc: 'Tunjangan atau insentif' },
                    { name: 'Freelance & Usaha', icon: '💼', desc: 'Honor freelance, jasa, proyek' },
                    { name: 'Penjualan Bisnis', icon: '🏪', desc: 'Omset dagang / jualan' },
                    { name: 'Investasi & Dividen', icon: '📈', desc: 'Hasil investasi, dividen, bunga' },
                    { name: 'Hadiah / Uang Saku', icon: '🧧', desc: 'Uang hadiah, angpao, uang saku' },
                    { name: 'Pemasukan Lainnya', icon: '📦', desc: 'Pemasukan jenis lainnya' },
                  ]
              ).map(cat => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setCategory(cat.name);
                    setActiveSubView('none');
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    category === cat.name
                      ? isDark ? 'bg-[#00F0D0]/15 border-[#00F0D0] text-[#00F0D0] font-bold' : 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                      : isDark ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{cat.icon}</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs truncate block font-bold">{cat.name}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{cat.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-view: Scan Receipt */}
        {activeSubView === 'receipt' && (
          <div className={`absolute inset-0 z-20 flex flex-col p-4 animate-in fade-in ${isDark ? 'bg-[#0E1116] text-white' : 'bg-white text-slate-900'}`}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#00F0D0]" />
                <span className="text-sm font-bold">Scan Struk Belanja</span>
              </div>
              <button
                onClick={() => {
                  stopLiveCamera();
                  setActiveSubView('none');
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {isScanningReceipt ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-3xl bg-[#00F0D0]/15 border border-[#00F0D0] flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-[#00F0D0] animate-spin" />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-bold block">Menganalisis Struk Belanja...</span>
                    <span className="text-xs text-slate-400 block mt-1 max-w-xs">
                      AI Gemini sedang membaca nama toko, rincian item, dan total pembayaran
                    </span>
                  </div>
                </div>
              ) : receiptParsedData ? (
                /* Editable Form for Receipt Review */
                <div className="space-y-3 animate-in fade-in">
                  <div
                    className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                      receiptScanError
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : isDark
                        ? 'bg-teal-950/40 border-[#00F0D0]/40 text-[#00F0D0]'
                        : 'bg-teal-50 border-teal-200 text-teal-800'
                    }`}
                  >
                    {receiptScanError ? (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>
                      {receiptScanError
                        ? receiptScanError
                        : 'Struk berhasil terbaca! Periksa dan sesuaikan data di bawah:'}
                    </span>
                  </div>

                  {/* Receipt Image Thumbnail */}
                  {receiptImage && (
                    <div className="relative rounded-2xl overflow-hidden border border-[#252A36] max-h-36 flex items-center justify-center bg-black/40">
                      <img
                        src={receiptImage}
                        alt="Struk Belanja"
                        className="max-h-36 w-full object-contain"
                      />
                      <button
                        onClick={() => {
                          setReceiptImage(null);
                          setReceiptParsedData(null);
                          startLiveCamera();
                        }}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs border border-white/20 hover:bg-black flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Foto Ulang</span>
                      </button>
                    </div>
                  )}

                  {/* Editable Fields */}
                  <div
                    className={`rounded-2xl p-3.5 border space-y-2.5 ${
                      isDark ? 'bg-[#181B24] border-[#252A36]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Nama Toko / Merchant
                      </label>
                      <input
                        type="text"
                        value={receiptParsedData.merchant}
                        onChange={e =>
                          setReceiptParsedData(prev =>
                            prev ? { ...prev, merchant: e.target.value } : null
                          )
                        }
                        placeholder="Contoh: Indomaret, Superindo"
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                          isDark
                            ? 'bg-[#0E1116] border-[#252A36] text-white focus:border-[#00F0D0]'
                            : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400">Total Transaksi</label>
                        <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#00F0D0]' : 'text-teal-700'}`}>
                          {formatRupiah(receiptParsedData.total)}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={receiptParsedData.total || ''}
                        onChange={e =>
                          setReceiptParsedData(prev =>
                            prev ? { ...prev, total: Number(e.target.value) || 0 } : null
                          )
                        }
                        placeholder="0"
                        className={`w-full text-sm font-bold font-mono px-3 py-2 rounded-xl border outline-none ${
                          isDark
                            ? 'bg-[#0E1116] border-[#252A36] text-white focus:border-[#00F0D0]'
                            : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Kategori Pengeluaran
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Makanan',
                          'Belanja',
                          'Transportasi',
                          'Tagihan',
                          'Hiburan',
                          'Kesehatan & Medis',
                          'Lainnya',
                        ].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() =>
                              setReceiptParsedData(prev =>
                                prev ? { ...prev, category: cat } : null
                              )
                            }
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                              receiptParsedData.category === cat
                                ? isDark
                                  ? 'bg-[#00F0D0]/20 border-[#00F0D0] text-[#00F0D0]'
                                  : 'bg-teal-100 border-teal-500 text-teal-800'
                                : isDark
                                ? 'bg-[#0E1116] border-[#252A36] text-slate-400'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Rincian Item / Catatan
                      </label>
                      <input
                        type="text"
                        value={receiptParsedData.note}
                        onChange={e =>
                          setReceiptParsedData(prev =>
                            prev ? { ...prev, note: e.target.value } : null
                          )
                        }
                        placeholder="Rincian barang belanja..."
                        className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                          isDark
                            ? 'bg-[#0E1116] border-[#252A36] text-white focus:border-[#00F0D0]'
                            : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Tanggal Transaksi
                      </label>
                      <input
                        type="date"
                        value={receiptParsedData.date || getTodayString()}
                        onChange={e =>
                          setReceiptParsedData(prev =>
                            prev ? { ...prev, date: e.target.value } : null
                          )
                        }
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                          isDark
                            ? 'bg-[#0E1116] border-[#252A36] text-white'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveReceiptDirect}
                      className="w-full py-3 rounded-2xl btn-cyan-pill text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        Simpan Transaksi Struk ({formatRupiah(receiptParsedData.total)})
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={applyReceiptData}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Buka di Form Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptImage(null);
                          setReceiptParsedData(null);
                          startLiveCamera();
                        }}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isDark
                            ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Foto Ulang</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Camera Viewfinder & Options */
                <div className="space-y-3">
                  {cameraError && (
                    <div className="p-3 rounded-2xl text-xs font-semibold border bg-rose-500/10 border-rose-500/40 text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {isCameraLive ? (
                    <div className="space-y-3">
                      {/* Live Video Viewfinder */}
                      <div className="relative rounded-3xl overflow-hidden bg-black aspect-3/4 border-2 border-[#00F0D0]/50 shadow-xl flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Scanner Overlay Guides */}
                        <div className="absolute inset-4 border border-dashed border-white/40 rounded-2xl pointer-events-none flex flex-col items-center justify-start p-3">
                          <div className="self-center bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                            Arahkan struk ke dalam kotak
                          </div>
                        </div>

                        {/* Shutter Button and Guide Text placed safely above camera shutter icon */}
                        <div className="absolute bottom-4 inset-x-0 flex flex-col items-center justify-center gap-2.5 z-10 pointer-events-auto">
                          <div className="bg-black/70 backdrop-blur-xs text-white/95 text-[10px] font-bold px-3 py-1 rounded-full border border-white/25 shadow-md pointer-events-none">
                            Posisikan total & nama toko terbaca
                          </div>
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="w-16 h-16 rounded-full bg-white border-4 border-[#00F0D0] shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform hover:scale-105"
                            title="Ambil Foto Struk"
                            aria-label="Ambil Foto Struk"
                          >
                            <Camera className="w-7 h-7 text-[#0E1116]" />
                          </button>
                        </div>
                      </div>

                      {/* Controls Below Viewfinder */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                            isDark
                              ? 'bg-[#181B24] border-[#252A36] text-slate-300 hover:text-white'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5 text-[#00F0D0]" />
                          <span>Pilih dari Galeri</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopLiveCamera}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                            isDark
                              ? 'bg-[#181B24] border-[#252A36] text-rose-300 hover:bg-rose-950/30'
                              : 'bg-slate-100 border-slate-200 text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <VideoOff className="w-3.5 h-3.5" />
                          <span>Matikan Kamera</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Card to Turn on Camera */}
                      <div
                        onClick={startLiveCamera}
                        className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                          isDark
                            ? 'border-[#00F0D0]/60 bg-[#141824] hover:bg-[#181D2E]'
                            : 'border-teal-400 bg-teal-50/50 hover:bg-teal-50'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-[#00F0D0] text-[#0E1116] flex items-center justify-center mx-auto mb-3 shadow-md font-bold">
                          <Camera className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-bold block">
                          {isStartingCamera ? 'Menghubungkan Kamera...' : 'Nyalakan Kamera Langsung'}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Buka kamera untuk memfoto struk belanjaan secara langsung
                        </span>
                      </div>

                      {/* Button to Upload from Gallery */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDark
                            ? 'bg-[#181B24] border-[#252A36] text-slate-200 hover:border-[#00F0D0]/50'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <Upload className="w-4 h-4 text-[#00F0D0]" />
                        <span>Pilih Foto Struk dari Galeri / File</span>
                      </button>

                      {/* Tips Card */}
                      <div
                        className={`rounded-2xl p-3 border text-xs space-y-1.5 ${
                          isDark ? 'bg-[#12151D] border-[#202532]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="font-bold text-[11px] text-[#00F0D0] block">
                          💡 Tips Foto Struk:
                        </span>
                        <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                          <li>Pastikan pencahayaan cukup dan struk tidak berbayang.</li>
                          <li>Pastikan tulisan nama toko dan total harga terlihat jelas.</li>
                          <li>Data struk dapat diedit sebelum disimpan ke riwayat transaksi.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-view: Voice Input */}
        {activeSubView === 'voice' && (
          <div className={`absolute inset-0 z-20 flex flex-col p-4 animate-in fade-in ${isDark ? 'bg-[#0E1116] text-white' : 'bg-white text-slate-900'}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#00F0D0]" />
                <span className="text-sm font-bold">Deteksi Suara & Nominal Otomatis</span>
              </div>
              <button onClick={() => setActiveSubView('none')} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3.5">
              {/* Central Mic Button */}
              <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center">
                <div className="relative">
                  {isListeningVoice && (
                    <div className="absolute inset-0 rounded-full bg-[#00F0D0]/30 animate-ping pointer-events-none" />
                  )}
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl relative z-10 active:scale-95 ${
                      isListeningVoice
                        ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-500/25'
                        : 'bg-[#00F0D0] text-[#0E1116] shadow-lg shadow-[#00F0D0]/35 hover:scale-105'
                    }`}
                    title={isListeningVoice ? 'Ketuk untuk berhenti bicara' : 'Ketuk untuk mulai bicara'}
                  >
                    {isListeningVoice ? (
                      <MicOff className="w-8 h-8 stroke-[2.5]" />
                    ) : (
                      <Mic className="w-8 h-8 stroke-[2.5]" />
                    )}
                  </button>
                </div>

                <div className="mt-3">
                  <span className={`text-xs font-extrabold block ${isListeningVoice ? 'text-[#FF4B72] animate-pulse' : isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isListeningVoice ? 'Mendengarkan... Silakan Bicara' : 'Ketuk Mic untuk Mulai Bicara'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Sebutkan nominal angka atau kata, contoh: <strong className="text-[#00F0D0]">"Makan siang 25 ribu"</strong> atau <strong className="text-[#00F0D0]">"Dua puluh lima ribu"</strong>
                  </span>
                </div>
              </div>

              {/* Error Notice if any */}
              {voiceError && (
                <div className="p-3 rounded-2xl text-xs font-semibold border bg-rose-500/10 border-rose-500/40 text-rose-400">
                  {voiceError}
                </div>
              )}

              {/* Live Transcript Box (Editable so user can also type/edit) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Kalimat yang Terdengar / Teks Input:
                  </label>
                  {voiceTranscript && (
                    <button
                      type="button"
                      onClick={() => handleTranscriptTextChange('')}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <div className={`p-2.5 rounded-2xl border transition-all ${isDark ? 'bg-[#181B24] border-[#252A36] focus-within:border-[#00F0D0]' : 'bg-slate-50 border-slate-200 focus-within:border-teal-500'}`}>
                  <textarea
                    rows={2}
                    value={voiceTranscript}
                    onChange={e => handleTranscriptTextChange(e.target.value)}
                    placeholder="Contoh: 'Tadi makan ayam dua puluh lima ribu' atau 'Beli bensin 30 ribu'..."
                    className={`w-full bg-transparent text-xs outline-none resize-none leading-relaxed ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                  />
                </div>
              </div>

              {/* Detected Nominal & Financial Info Display */}
              {voiceParsedResult && voiceParsedResult.amount > 0 ? (
                <div className="rounded-2xl p-3.5 border space-y-2.5 transition-all animate-in fade-in" style={{ background: 'rgba(0, 240, 208, 0.08)', borderColor: '#00F0D0' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00F0D0] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Nominal Terdeteksi Berhasil!
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      voiceParsedResult.type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : voiceParsedResult.type === 'saving'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {voiceParsedResult.type === 'income' ? 'Pemasukan' : voiceParsedResult.type === 'saving' ? 'Tabungan' : 'Pengeluaran'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nominal Rupiah</span>
                      <span className="text-2xl font-black font-mono text-[#00F0D0] tracking-tight">
                        {formatRupiah(voiceParsedResult.amount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Kategori</span>
                      <span className="text-xs font-bold text-white">
                        {voiceParsedResult.category}
                      </span>
                    </div>
                  </div>

                  {voiceParsedResult.note && (
                    <div className={`p-2 rounded-xl text-[11px] ${isDark ? 'bg-[#181B24]/80 text-slate-300' : 'bg-white text-slate-700'}`}>
                      <span className="text-slate-400">Catatan: </span>
                      <span className="font-medium">{voiceParsedResult.note}</span>
                    </div>
                  )}

                  {/* Dual Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDirectSaveVoice}
                      className="py-2.5 px-2 rounded-xl btn-cyan-pill text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-[#00F0D0]/20"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Simpan Langsung</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyVoiceToForm}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isDark ? 'border-[#252A36] bg-[#181B24] text-slate-200 hover:bg-[#202532]' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>Gunakan di Form</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`p-3 rounded-2xl border text-center text-xs space-y-1 ${isDark ? 'bg-[#181B24]/60 border-[#252A36] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <p className="font-semibold text-slate-300">
                    {voiceTranscript ? 'Nominal belum terdeteksi dari kalimat' : 'Belum ada suara atau kalimat'}
                  </p>
                  <p className="text-[10px]">
                    Sebutkan nominal angka atau kata, baik di <strong>awal kalimat</strong> (contoh: <em>"Dua puluh ribu untuk makan"</em>) maupun di <strong>akhir</strong> (contoh: <em>"Beli bensin 30 ribu"</em>).
                  </p>
                </div>
              )}

              {/* Sample Quick Test Phrases with realistic words & numbers */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Uji Coba Deteksi Nominal Suara (Klik untuk Tes):
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { phrase: 'Dua puluh lima ribu makan siang', amount: 'Rp25.000', cat: 'Nominal di Awal' },
                    { phrase: 'Lima puluh ribu isi bensin', amount: 'Rp50.000', cat: 'Nominal di Awal' },
                    { phrase: 'Makan siang 25 ribu', amount: 'Rp25.000', cat: 'Makanan' },
                    { phrase: 'Beli bensin tiga puluh ribu', amount: 'Rp30.000', cat: 'Transport' },
                    { phrase: 'Nabung seratus ribu rupiah', amount: 'Rp100.000', cat: 'Tabungan' },
                    { phrase: 'Gaji bulan ini lima juta', amount: 'Rp5.000.000', cat: 'Pemasukan' },
                  ].map(item => (
                    <button
                      key={item.phrase}
                      type="button"
                      onClick={() => parseVoiceTranscript(item.phrase)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all active:scale-95 ${
                        isDark ? 'bg-[#181B24] border-[#252A36] hover:border-[#00F0D0]/50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`text-[11px] font-bold block truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        "{item.phrase}"
                      </span>
                      <div className="flex items-center justify-between mt-0.5 text-[9px]">
                        <span className="text-[#00F0D0] font-mono font-bold">{item.amount}</span>
                        <span className="text-slate-400">{item.cat}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
