import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Transaction,
  SavingGoal,
  Budget,
  UserProfile,
  MochiState,
  MochiDevice,
  NotificationItem,
  CategoryInfo,
  CategoryBreakdownItem,
  FinancialInsight,
  MochiMood,
  CategoryBudgetAllocation
} from '../types';
import {
  formatRupiah,
  getTodayString,
  getCurrentTimeString,
  getCurrentMonthString,
  getPreviousMonthString,
  getRelativeDate
} from '../utils/formatters';
import { soundManager } from '../utils/audio';

interface SummaryData {
  income: number;
  expense: number;
  saved: number;
  remaining: number;
  budgetLimit: number;
  budgetPercentage: number;
  totalBalance: number;
}

interface KocekContextType {
  user: UserProfile;
  transactions: Transaction[];
  savingGoals: SavingGoal[];
  budget: Budget;
  currentMonth: string;
  mochiState: MochiState;
  mochiDevice: MochiDevice;
  insights: FinancialInsight[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  summary: SummaryData;
  categoryBreakdown: CategoryBreakdownItem[];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addSavingGoal: (goal: Omit<SavingGoal, 'id' | 'currentAmount'>) => void;
  deleteSavingGoal: (id: string) => void;
  depositToGoal: (goalId: string, amount: number, note?: string) => void;
  updateBudgetLimit: (limit: number) => void;
  setCurrentMonth: (month: string) => void;
  toggleMochiSound: () => void;
  toggleMochiConnection: () => void;
  triggerMochiReaction: (mood?: MochiMood) => void;
  markNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  sendNotification: (custom?: Partial<NotificationItem>) => void;
  activeToast: NotificationItem | null;
  dismissToast: () => void;
  budgetAllocations: CategoryBudgetAllocation[];
  updateBudgetAllocation: (alloc: CategoryBudgetAllocation) => void;
  resetBudgetAllocation: (id: string) => void;
  resetToDefault: () => void;
  resetToCleanSlate: () => void;
  restartAppTotally: () => void;
  exportJSON: () => void;
  exportCSV: () => void;
}

const KocekContext = createContext<KocekContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'kocek_transactions_v1',
  SAVING_GOALS: 'kocek_saving_goals_v1',
  BUDGET: 'kocek_budget_v1',
  BUDGET_ALLOCATIONS: 'kocek_budget_allocations_v1',
  MOCHI_SETTINGS: 'kocek_mochi_settings_v1',
  THEME: 'kocek_theme_v1',
  NOTIFICATIONS: 'kocek_notifications_v1',
  AUTH: 'kocek_auth_v1',
};

const DEFAULT_USER: UserProfile = {
  name: 'Andi',
  email: 'andi@student.ac.id',
  role: 'Mahasiswa / Young Adult',
  joinedDate: 'Januari 2026',
};

export const DEFAULT_BUDGET_ALLOCATIONS: CategoryBudgetAllocation[] = [
  {
    id: 'alloc-makan',
    category: 'Makanan',
    icon: '🍜',
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
    notes: 'Alokasi makan mingguan & harian: Senin hemat Rp20rb',
  },
  {
    id: 'alloc-transport',
    category: 'Transportasi',
    icon: '🚗',
    monthlyBudget: 500000,
    weeklyBudget: 125000,
    dailyAllocations: {
      senin: 20000,
      selasa: 20000,
      rabu: 20000,
      kamis: 20000,
      jumat: 20000,
      sabtu: 12500,
      minggu: 12500,
    },
    notes: 'Ongkos harian kuliah & mobilitas',
  },
];

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { name: 'Makanan', icon: '🍜', color: '#F59E0B' },
  { name: 'Transportasi', icon: '🚗', color: '#3B82F6' },
  { name: 'Pendidikan', icon: '📚', color: '#10B981' },
  { name: 'Hiburan', icon: '🎮', color: '#8B5CF6' },
  { name: 'Tagihan', icon: '🧾', color: '#EC4899' },
  { name: 'Belanja', icon: '🛍️', color: '#06B6D4' },
  { name: 'Gaji / Pemasukan', icon: '💵', color: '#10B981' },
  { name: 'Transfer Masuk', icon: '💸', color: '#00F0D0' },
  { name: 'Saldo Awal / Modal', icon: '💰', color: '#10B981' },
  { name: 'Bonus & THR', icon: '🎁', color: '#F59E0B' },
  { name: 'Freelance & Usaha', icon: '💼', color: '#3B82F6' },
  { name: 'Investasi & Dividen', icon: '📈', color: '#8B5CF6' },
  { name: 'Hadiah / Uang Saku', icon: '🧧', color: '#EC4899' },
  { name: 'Lainnya', icon: '📦', color: '#64748B' },
];

function generateDefaultTransactions(): Transaction[] {
  return [];
}

const DEFAULT_SAVING_GOALS: SavingGoal[] = [];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-welcome',
    title: 'Selamat Datang di Kocek! 👾',
    message: 'Dasai Mochi siap mendampingimu mengatur keuangan dan membangun kebiasaan menabung yang sehat. Mulai catat transaksimu!',
    time: 'Baru saja',
    icon: '✨',
    read: false,
    type: 'mochi',
  },
];

function calculateMochiMood(budget: Budget, spent: number, saved: number, goals: SavingGoal[], latestTx?: Transaction): MochiState {
  const ratio = budget.limit > 0 ? spent / budget.limit : 0;
  const anyGoalCompleted = goals.some(g => g.currentAmount >= g.targetAmount);
  const isSavingTx = latestTx?.type === 'saving';

  if (anyGoalCompleted) {
    return {
      mood: 'super_joy',
      title: 'Target Tercapai!',
      message: 'Selamat! Target tabunganmu sudah terpenuhi.',
      statusBadge: 'Sangat Hebat',
      emoji: '😄',
      glowColor: '#10B981',
    };
  }

  if (ratio > 1) {
    return {
      mood: 'sad',
      title: 'Budget Terlampaui',
      message: `Pengeluaran bulan ini melebihi budget sebesar ${Math.round((ratio - 1) * 100)}%.`,
      statusBadge: 'Perlu Evaluasi',
      emoji: '😢',
      glowColor: '#EF4444',
    };
  }

  if (isSavingTx) {
    return {
      mood: 'happy',
      title: 'Progress Tabungan Naik!',
      message: 'Tabungan bertambah. Konsistensi kecil menghasilkan perubahan besar.',
      statusBadge: 'Progress Positif',
      emoji: '😊',
      glowColor: '#00F0D0',
    };
  }

  if (ratio >= 0.85) {
    return {
      mood: 'worried',
      title: 'Budget Hampir Habis',
      message: `Sudah terpakai ${Math.round(ratio * 100)}% dari batas bulananmu.`,
      statusBadge: 'Hati-hati',
      emoji: '😟',
      glowColor: '#F59E0B',
    };
  }

  if (ratio >= 0.70) {
    return {
      mood: 'neutral',
      title: 'Budget Mulai Tinggi',
      message: `Penggunaan budget mencapai ${Math.round(ratio * 100)}%. Masih dalam pantauan aman.`,
      statusBadge: 'Cukup Sehat',
      emoji: '😐',
      glowColor: '#3B82F6',
    };
  }

  if (saved > 0) {
    return {
      mood: 'happy',
      title: 'Tabungan Bertumbuh',
      message: 'Pola tabunganmu bulan ini berjalan dengan baik.',
      statusBadge: 'Sehat & Prima',
      emoji: '😊',
      glowColor: '#00F0D0',
    };
  }

  return {
    mood: 'calm',
    title: 'Kondisi Stabil',
    message: 'Pengeluaran terkontrol dengan aman di bawah batas budget.',
    statusBadge: 'Cukup Sehat',
    emoji: '😌',
    glowColor: '#06B6D4',
  };
}

function calculateInsights(transactions: Transaction[], budget: Budget, currentMonth: string, previousMonth: string): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const curTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const prevTxs = transactions.filter(t => t.date.startsWith(previousMonth));

  const curSpent = curTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const curIncome = curTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const curSaved = curTxs.filter(t => t.type === 'saving').reduce((acc, t) => acc + t.amount, 0);

  const getCategorySpent = (txs: Transaction[], cat: string) =>
    txs.filter(t => t.type === 'expense' && t.category.toLowerCase().includes(cat.toLowerCase()))
      .reduce((acc, t) => acc + t.amount, 0);

  const curFood = getCategorySpent(curTxs, 'makanan');
  const prevFood = getCategorySpent(prevTxs, 'makanan');
  if (prevFood > 0 && curFood > prevFood * 1.1) {
    const diff = Math.round(((curFood - prevFood) / prevFood) * 100);
    insights.push({
      id: 'food-increase',
      type: 'neutral',
      title: 'Perubahan Pengeluaran Makanan',
      message: `Pengeluaran makanan meningkat ${diff}% dibanding bulan lalu.`,
      category: 'Makanan',
      comparison: { current: curFood, previous: prevFood, percentChange: diff },
    });
  }

  const budgetPct = budget.limit > 0 ? (curSpent / budget.limit) * 100 : 0;
  if (budgetPct >= 80) {
    insights.push({
      id: 'budget-high',
      type: 'caution',
      title: 'Kondisi Anggaran',
      message: `Budget bulan ini sudah terpakai ${Math.round(budgetPct)}% (${formatRupiah(curSpent)} dari ${formatRupiah(budget.limit)}).`,
    });
  } else if (budgetPct >= 65) {
    insights.push({
      id: 'budget-moderate',
      type: 'neutral',
      title: 'Kondisi Anggaran',
      message: `Budget bulan ini telah terpakai ${Math.round(budgetPct)}%. Masih ada sisa ${formatRupiah(budget.limit - curSpent)}.`,
    });
  }

  if (curIncome > 0 && curSaved > 0) {
    const saveRate = Math.round((curSaved / curIncome) * 100);
    if (saveRate >= 20) {
      insights.push({
        id: 'saving-good',
        type: 'positive',
        title: 'Kebiasaan Menabung',
        message: `Kamu telah menyisihkan ${saveRate}% dari pemasukan bulan ini untuk tabungan. Kebiasaan ini sangat baik untuk target jangka panjang.`,
      });
    }
  }

  const curTransport = getCategorySpent(curTxs, 'transportasi');
  const prevTransport = getCategorySpent(prevTxs, 'transportasi');
  if (prevTransport > 0 && curTransport < prevTransport) {
    const diff = Math.round(((prevTransport - curTransport) / prevTransport) * 100);
    insights.push({
      id: 'transport-decrease',
      type: 'positive',
      title: 'Efisiensi Transportasi',
      message: `Pengeluaran transportasi turun ${diff}% dibanding bulan lalu.`,
      category: 'Transportasi',
      comparison: { current: curTransport, previous: prevTransport, percentChange: -diff },
    });
  }

  return insights;
}

export const KocekProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          return { ...DEFAULT_USER, name: parsed.name || DEFAULT_USER.name, email: parsed.email };
        }
      }
      return DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [currentMonth, setCurrentMonth] = useState<string>(() => getCurrentMonthString());

  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      return stored === 'dark' || stored === 'light' ? stored : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#0E1116';
        document.body.style.color = '#FFFFFF';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '#F5F7FA';
        document.body.style.color = '#0F141C';
      }
    } catch (e) {
      console.warn('Theme apply error', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
  };

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVING_GOALS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const realGoals = parsed.filter(g => g.id !== 'goal-laptop' && g.id !== 'goal-emergency' && g.id !== 'goal-course');
          return realGoals;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [budget, setBudget] = useState<Budget>(() => {
    const cur = getCurrentMonthString();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.month === cur ? parsed : { ...parsed, month: cur };
      }
      return { month: cur, limit: 4000000 };
    } catch {
      return { month: cur, limit: 4000000 };
    }
  });

  const [mochiDevice, setMochiDevice] = useState<MochiDevice>({
    mood: 'calm',
    message: 'Kondisi stabil',
    subMessage: 'Dasai Mochi siap menemani proses menabungmu',
    connected: true,
    battery: 92,
    deviceId: 'MOCHI-B72F',
    ledColor: '#00F0D0',
    soundEnabled: true,
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            n => !n.title?.includes('Andi') && !n.message?.includes('Laptop') && n.id !== 'notif-1'
          );
          return filtered.length > 0 ? filtered : DEFAULT_NOTIFICATIONS;
        }
      }
      return DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Notifications storage error', e);
    }
  }, [notifications]);

  const [budgetAllocations, setBudgetAllocations] = useState<CategoryBudgetAllocation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGET_ALLOCATIONS);
      return stored ? JSON.parse(stored) : DEFAULT_BUDGET_ALLOCATIONS;
    } catch {
      return DEFAULT_BUDGET_ALLOCATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET_ALLOCATIONS, JSON.stringify(budgetAllocations));
    } catch (e) {
      console.warn('Budget allocations storage error', e);
    }
  }, [budgetAllocations]);

  const updateBudgetAllocation = (updated: CategoryBudgetAllocation) => {
    setBudgetAllocations(prev => {
      const idx = prev.findIndex(a => a.id === updated.id || a.category.toLowerCase() === updated.category.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    soundManager.playPop();
  };

  const resetBudgetAllocation = (id: string) => {
    setBudgetAllocations(prev => {
      const defaultAlloc = DEFAULT_BUDGET_ALLOCATIONS.find(a => a.id === id);
      if (defaultAlloc) {
        return prev.map(a => a.id === id ? { ...defaultAlloc } : a);
      }
      return prev.filter(a => a.id !== id);
    });
    soundManager.playCalm();
  };

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const dismissToast = () => {
    setActiveToast(null);
  };

  const sendNotification = (custom?: Partial<NotificationItem>) => {
    const id = `notif-${Date.now()}`;
    const newNotif: NotificationItem = {
      id,
      title: custom?.title || 'Pengingat dari Dasai Mochi 👾',
      message:
        custom?.message ||
        'Halo Andi! Mochi mengingatkan: Jangan lupa sisihkan uang jajanmu hari ini untuk target tabungan Laptop barumu!',
      time: custom?.time || 'Baru saja',
      icon: custom?.icon || '🔔',
      read: false,
      type: custom?.type || 'mochi',
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
    soundManager.playHappy();

    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/favicon.ico',
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(newNotif.title, {
                body: newNotif.message,
                icon: '/favicon.ico',
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Native notification not available', e);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVING_GOALS, JSON.stringify(savingGoals));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [savingGoals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [budget]);

  // Calculations
  const curMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const income = curMonthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = curMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const saved = curMonthTxs.filter(t => t.type === 'saving').reduce((acc, t) => acc + t.amount, 0);
  const remaining = income - expense - saved;
  const budgetPercentage = budget.limit > 0 ? Math.min(100, Math.round((expense / budget.limit) * 100)) : 0;

  // Real available cash across all transactions (saldo kas riil)
  const allIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const allExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const allSaved = transactions.filter(t => t.type === 'saving').reduce((acc, t) => acc + t.amount, 0);
  const totalBalance = allIncome - allExpense - allSaved;

  const categoryBreakdown: CategoryBreakdownItem[] = DEFAULT_CATEGORIES.filter(
    c => c.name !== 'Gaji / Pemasukan' && c.name !== 'Tabungan'
  )
    .map(c => {
      const spent = curMonthTxs
        .filter(t => t.type === 'expense' && t.category.toLowerCase().includes(c.name.toLowerCase()))
        .reduce((acc, t) => acc + t.amount, 0);

      const prevMonth = getPreviousMonthString(currentMonth);
      const prevSpent = transactions
        .filter(t => t.date.startsWith(prevMonth) && t.type === 'expense' && t.category.toLowerCase().includes(c.name.toLowerCase()))
        .reduce((acc, t) => acc + t.amount, 0);

      const changePercent = prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 100) : 0;
      const percentage = expense > 0 ? Math.round((spent / expense) * 100) : 0;

      return {
        category: c.name,
        spent,
        percentage,
        previousSpent: prevSpent,
        changePercent,
        icon: c.icon,
        color: c.color,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const latestTx = transactions[0];
  const mochiState = calculateMochiMood(budget, expense, saved, savingGoals, latestTx);
  const insights = calculateInsights(transactions, budget, currentMonth, getPreviousMonthString(currentMonth));

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const id = `tx-${Date.now()}`;
    const tx: Transaction = {
      ...newTx,
      id,
      date: newTx.date || getTodayString(),
      time: newTx.time || getCurrentTimeString(),
      sourceFund: newTx.sourceFund || newTx.merchant || 'Kas / Dompet',
    };

    setTransactions(prev => [tx, ...prev]);

    // Handle saving goal linkage
    if (tx.type === 'saving') {
      if (tx.savingGoalId) {
        setSavingGoals(prev =>
          prev.map(g => {
            if (g.id === tx.savingGoalId) {
              const updated = g.currentAmount + tx.amount;
              if (updated >= g.targetAmount) {
                soundManager.playSuperJoy();
              } else {
                soundManager.playHappy();
              }
              return { ...g, currentAmount: updated };
            }
            return g;
          })
        );
      } else {
        soundManager.playHappy();
      }
    } else if (tx.type === 'expense') {
      const newExpense = expense + tx.amount;
      const ratio = budget.limit > 0 ? newExpense / budget.limit : 0;
      if (ratio > 1) {
        soundManager.playSad();
      } else if (ratio >= 0.85) {
        soundManager.playWorried();
      } else if (ratio >= 0.70) {
        soundManager.playNeutral();
      } else {
        soundManager.playCalm();
      }
    } else {
      soundManager.playHappy();
    }
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const target = transactions.find(t => t.id === id);
    if (target && target.type === 'saving' && target.savingGoalId && typeof updates.amount === 'number' && updates.amount !== target.amount) {
      const diff = updates.amount - target.amount;
      setSavingGoals(prev => prev.map(g => (g.id === target.savingGoalId ? { ...g, currentAmount: Math.max(0, g.currentAmount + diff) } : g)));
    }
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (target && target.type === 'saving' && target.savingGoalId) {
      setSavingGoals(prev => prev.map(g => (g.id === target.savingGoalId ? { ...g, currentAmount: Math.max(0, g.currentAmount - target.amount) } : g)));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addSavingGoal = (goal: Omit<SavingGoal, 'id' | 'currentAmount'>) => {
    const newGoal: SavingGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      currentAmount: 0,
    };
    setSavingGoals(prev => [...prev, newGoal]);
    soundManager.playHappy();
  };

  const deleteSavingGoal = (id: string) => {
    setSavingGoals(prev => prev.filter(g => g.id !== id));
  };

  const depositToGoal = (goalId: string, amount: number, note?: string) => {
    const goal = savingGoals.find(g => g.id === goalId);
    if (goal) {
      addTransaction({
        type: 'saving',
        amount,
        category: 'Tabungan',
        note: note || `Tabungan untuk ${goal.name}`,
        date: getTodayString(),
        time: getCurrentTimeString(),
        sourceFund: 'Kantong Utama',
        savingGoalId: goalId,
        source: 'manual',
      });
    }
  };

  const updateBudgetLimit = (limit: number) => {
    setBudget(prev => ({ ...prev, limit }));
  };

  const toggleMochiSound = () => {
    const next = !mochiDevice.soundEnabled;
    soundManager.setSoundEnabled(next);
    setMochiDevice(prev => ({ ...prev, soundEnabled: next }));
    if (next) {
      soundManager.playHappy();
    }
  };

  const toggleMochiConnection = () => {
    setMochiDevice(prev => {
      const next = !prev.connected;
      if (next) soundManager.playCalm();
      return { ...prev, connected: next };
    });
  };

  const triggerMochiReaction = () => {
    soundManager.playTap();
  };

  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SAVING_GOALS);
    localStorage.removeItem(STORAGE_KEYS.BUDGET);
    localStorage.removeItem(STORAGE_KEYS.BUDGET_ALLOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    setNotifications(DEFAULT_NOTIFICATIONS);
    setTransactions(generateDefaultTransactions());
    setSavingGoals(DEFAULT_SAVING_GOALS);
    setBudget({ month: getCurrentMonthString(), limit: 4000000 });
    setBudgetAllocations(DEFAULT_BUDGET_ALLOCATIONS);
    soundManager.playCalm();
  };

  const resetToCleanSlate = () => {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SAVING_GOALS);
    localStorage.removeItem(STORAGE_KEYS.BUDGET);
    localStorage.removeItem(STORAGE_KEYS.BUDGET_ALLOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    const cleanGoals: SavingGoal[] = [
      {
        id: 'goal-custom-1',
        name: 'Target Tabungan Saya',
        targetAmount: 2000000,
        currentAmount: 0,
        deadline: '2026-12-31',
        icon: '🎯',
        color: '#00F0D0',
      },
    ];
    setTransactions([]);
    setSavingGoals(cleanGoals);
    setBudget({ month: getCurrentMonthString(), limit: 3000000 });
    setBudgetAllocations(DEFAULT_BUDGET_ALLOCATIONS);
    setNotifications([
      {
        id: `notif-clean-${Date.now()}`,
        title: 'Mulai dari Awal! 🚀',
        message: 'Data kamu sudah bersih. Mulai catat transaksi pertamamu sekarang!',
        time: 'Baru saja',
        read: false,
        icon: '✨',
        type: 'mochi',
      },
    ]);
    soundManager.playHappy();
  };

  const restartAppTotally = () => {
    try {
      localStorage.removeItem('kocek_auth_v1');
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.SAVING_GOALS);
      localStorage.removeItem(STORAGE_KEYS.BUDGET);
      localStorage.removeItem(STORAGE_KEYS.BUDGET_ALLOCATIONS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      sessionStorage.clear();
    } catch (e) {
      console.warn(e);
    }
    window.dispatchEvent(new Event('kocek-restart'));
  };

  const exportJSON = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      user,
      budget,
      budgetAllocations,
      savingGoals,
      transactions,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kocek_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan', 'Sumber'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category}"`,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.source || 'manual',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kocek_transaksi_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <KocekContext.Provider
      value={{
        user,
        transactions,
        savingGoals,
        budget,
        budgetAllocations,
        updateBudgetAllocation,
        resetBudgetAllocation,
        currentMonth,
        mochiState,
        mochiDevice,
        insights,
        notifications,
        unreadNotificationsCount,
        summary: {
          income,
          expense,
          saved,
          remaining,
          budgetLimit: budget.limit,
          budgetPercentage,
          totalBalance,
        },
        categoryBreakdown,
        theme,
        toggleTheme,
        setTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addSavingGoal,
        deleteSavingGoal,
        depositToGoal,
        updateBudgetLimit,
        setCurrentMonth,
        toggleMochiSound,
        toggleMochiConnection,
        triggerMochiReaction,
        markNotificationsAsRead,
        markNotificationAsRead,
        deleteNotification,
        sendNotification,
        activeToast,
        dismissToast,
        resetToDefault,
        resetToCleanSlate,
        restartAppTotally,
        exportJSON,
        exportCSV,
      }}
    >
      {children}
    </KocekContext.Provider>
  );
};

export const useKocek = () => {
  const context = useContext(KocekContext);
  if (!context) {
    throw new Error('useKocek must be used within a KocekProvider');
  }
  return context;
};
