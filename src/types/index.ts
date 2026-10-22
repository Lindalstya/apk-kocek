export type TransactionType = 'expense' | 'income' | 'saving';

export type MochiMood = 'happy' | 'super_joy' | 'calm' | 'neutral' | 'worried' | 'sad';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  merchant?: string;
  sourceFund?: string;
  source?: 'manual' | 'receipt' | 'voice';
  savingGoalId?: string;
  __del?: boolean;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  icon: string;
  color?: string;
}

export interface Budget {
  month: string; // YYYY-MM
  limit: number;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  joinedDate: string;
}

export interface MochiState {
  mood: MochiMood;
  title: string;
  message: string;
  statusBadge: string;
  emoji: string;
  glowColor: string;
}

export interface MochiDevice {
  mood: MochiMood;
  message: string;
  subMessage: string;
  connected: boolean;
  battery: number;
  deviceId: string;
  ledColor: string;
  soundEnabled: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  read: boolean;
  type: 'mochi' | 'positive' | 'goal' | 'warning';
}

export interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
}

export interface CategoryBreakdownItem {
  category: string;
  spent: number;
  percentage: number;
  previousSpent: number;
  changePercent: number;
  icon: string;
  color: string;
}

export interface FinancialInsight {
  id: string;
  type: 'positive' | 'neutral' | 'caution';
  title: string;
  message: string;
  category?: string;
  comparison?: {
    current: number;
    previous: number;
    percentChange: number;
  };
}

export interface DayAllocationItem {
  key: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
  name: string;
  amount: number;
  isWeekend?: boolean;
}

export interface CategoryBudgetAllocation {
  id: string;
  category: string;
  icon: string;
  monthlyBudget: number;
  weeklyBudget: number;
  dailyAllocations: {
    senin: number;
    selasa: number;
    rabu: number;
    kamis: number;
    jumat: number;
    sabtu: number;
    minggu: number;
  };
  notes?: string;
}

