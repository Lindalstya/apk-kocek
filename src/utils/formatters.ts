import { Transaction } from '../types';

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const DAY_NAMES_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export function formatRupiah(amount: number, options: { withPrefix?: boolean; absolute?: boolean } = {}): string {
  const { withPrefix = true, absolute = false } = options;
  const val = absolute ? Math.abs(amount) : amount;
  const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val);
  return withPrefix ? `Rp${formatted}` : formatted;
}

export function formatDateIndo(dateStr: string, options: { includeDayName?: boolean; shortMonth?: boolean } = {}): string {
  const { includeDayName = true, shortMonth = false } = options;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = DAY_NAMES_ID[dateObj.getDay()];
    const monthName = shortMonth ? MONTH_SHORT_ID[month - 1] : MONTH_NAMES_ID[month - 1];
    if (includeDayName) {
      return `${dayName}, ${day} ${monthName} ${year}`;
    }
    return `${day} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getPreviousMonthString(currentMonthStr?: string): string {
  let year: number;
  let month: number;
  if (currentMonthStr && currentMonthStr.includes('-')) {
    const parts = currentMonthStr.split('-').map(Number);
    year = parts[0];
    month = parts[1];
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

export function getMonthName(monthStr: string): string {
  try {
    const monthIndex = parseInt(monthStr.split('-')[1], 10) - 1;
    return MONTH_NAMES_ID[monthIndex] || 'Bulan Ini';
  } catch {
    return 'Bulan Ini';
  }
}

export function getRelativeDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function matchesTransactionQuery(tx: Transaction, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  const searchable = [
    tx.category,
    tx.note || '',
    tx.merchant || '',
    tx.sourceFund || '',
    tx.type === 'expense' ? 'pengeluaran' : tx.type === 'income' ? 'pemasukan' : 'tabungan',
    String(tx.amount),
    tx.date,
    formatDateIndo(tx.date, { includeDayName: true }),
    formatDateIndo(tx.date, { shortMonth: true, includeDayName: false })
  ].join(' ').toLowerCase();

  const words = q.split(/\s+/).filter(Boolean);
  return words.every(word => searchable.includes(word));
}
