import { TransactionType } from '../types';
import { getTodayString } from './formatters';

const DIGIT_WORDS: Record<string, number> = {
  nol: 0,
  kosong: 0,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  seratus: 100,
  seribu: 1000,
  sejuta: 1000000,
};

function parseSectionUnderThousand(words: string[]): number {
  let total = 0;
  let current = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (w === 'seratus') {
      current += 100;
    } else if (w === 'ratus') {
      current = (current === 0 ? 1 : current) * 100;
    } else if (w === 'sepuluh') {
      current += 10;
    } else if (w === 'sebelas') {
      current += 11;
    } else if (w === 'belas') {
      current = (current === 0 ? 1 : current) + 10;
    } else if (w === 'puluh') {
      current = (current === 0 ? 1 : current) * 10;
    } else if (DIGIT_WORDS[w] !== undefined) {
      const val = DIGIT_WORDS[w];
      // Check if next word is puluh, belas, or ratus
      const next = words[i + 1];
      if (next === 'puluh') {
        current += val * 10;
        i++; // skip puluh
      } else if (next === 'belas') {
        current += val + 10;
        i++; // skip belas
      } else if (next === 'ratus') {
        current += val * 100;
        i++; // skip ratus
      } else {
        current += val;
      }
    } else if (!isNaN(Number(w))) {
      current += Number(w);
    }
  }

  total += current;
  return total;
}

export function parseIndonesianWordNumber(text: string): number | null {
  const clean = text
    .toLowerCase()
    .replace(/[,\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Handle special fractional terms
  if (clean.includes('setengah juta') || clean.includes('1/2 juta')) {
    return 500000;
  }
  if (clean.includes('satu setengah juta') || clean.includes('1 setengah juta')) {
    return 1500000;
  }
  if (clean.includes('dua setengah juta') || clean.includes('2 setengah juta')) {
    return 2500000;
  }
  if (clean.includes('tiga setengah juta') || clean.includes('3 setengah juta')) {
    return 3500000;
  }

  const tokens = clean.split(' ');
  const numberTokens: string[] = [];

  const validWordKeywords = new Set([
    'nol', 'kosong', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh',
    'delapan', 'sembilan', 'sepuluh', 'sebelas', 'belas', 'puluh', 'seratus',
    'ratus', 'seribu', 'ribu', 'sejuta', 'juta', 'miliar', 'milyar', 'k', 'rb'
  ]);

  // Extract only consecutive or nearby number-related tokens
  for (const t of tokens) {
    if (validWordKeywords.has(t) || !isNaN(Number(t))) {
      numberTokens.push(t);
    }
  }

  if (numberTokens.length === 0) return null;

  // Split by 'miliar', 'juta', 'ribu'
  let grandTotal = 0;
  let hasFoundNumber = false;

  let currentSubWords: string[] = [];

  for (let i = 0; i < numberTokens.length; i++) {
    const t = numberTokens[i];

    if (t === 'miliar' || t === 'milyar') {
      const sectionVal = parseSectionUnderThousand(currentSubWords);
      grandTotal += (sectionVal === 0 ? 1 : sectionVal) * 1000000000;
      currentSubWords = [];
      hasFoundNumber = true;
    } else if (t === 'juta') {
      const sectionVal = parseSectionUnderThousand(currentSubWords);
      grandTotal += (sectionVal === 0 ? 1 : sectionVal) * 1000000;
      currentSubWords = [];
      hasFoundNumber = true;
    } else if (t === 'sejuta') {
      grandTotal += 1000000;
      currentSubWords = [];
      hasFoundNumber = true;
    } else if (t === 'ribu' || t === 'rb' || t === 'k') {
      const sectionVal = parseSectionUnderThousand(currentSubWords);
      grandTotal += (sectionVal === 0 ? 1 : sectionVal) * 1000;
      currentSubWords = [];
      hasFoundNumber = true;
    } else if (t === 'seribu') {
      grandTotal += 1000;
      currentSubWords = [];
      hasFoundNumber = true;
    } else {
      currentSubWords.push(t);
    }
  }

  if (currentSubWords.length > 0) {
    const remainingVal = parseSectionUnderThousand(currentSubWords);
    if (remainingVal > 0) {
      grandTotal += remainingVal;
      hasFoundNumber = true;
    }
  }

  return hasFoundNumber && grandTotal > 0 ? grandTotal : null;
}

export function extractNominalFromText(rawText: string): number | null {
  if (!rawText) return null;
  const text = rawText.toLowerCase().replace(/rp\.?/g, '').trim();

  // 1. Dotted format, e.g. "25.000", "150.000", "1.500.000"
  const dottedMatch = text.match(/\b\d{1,3}(?:\.\d{3})+\b/);
  if (dottedMatch) {
    const parsed = parseInt(dottedMatch[0].replace(/\./g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 2. Digits with "juta" or "jt", e.g. "1.5 juta", "1,5 juta", "2 jt", "5 juta"
  const millionMatch = text.match(/(\d+(?:[\.,]\d+)?)\s*(?:juta|jt)\b/);
  if (millionMatch) {
    const base = parseFloat(millionMatch[1].replace(',', '.'));
    if (!isNaN(base)) {
      // Look for additional thousand words or digits, e.g. "1 juta 500 ribu" or "1 juta 500rb"
      const extraThousand = text.match(/(?:juta|jt)\s*(\d+(?:[\.,]\d+)?)\s*(?:ribu|rb|k)\b/);
      if (extraThousand) {
        const extra = parseFloat(extraThousand[1].replace(',', '.')) * 1000;
        return Math.round(base * 1000000 + extra);
      }
      return Math.round(base * 1000000);
    }
  }

  // 3. Digits with "ribu", "rb", or "k", e.g. "25 ribu", "25rb", "25k", "25 k", "2.5 ribu"
  const thousandMatch = text.match(/(\d+(?:[\.,]\d+)?)\s*(?:ribu|rb|k)\b/);
  if (thousandMatch) {
    const base = parseFloat(thousandMatch[1].replace(',', '.'));
    if (!isNaN(base)) {
      // Look for additional hundreds, e.g. "25 ribu 500"
      const extraHundred = text.match(/(?:ribu|rb|k)\s*(\d{2,3})\b/);
      if (extraHundred) {
        return Math.round(base * 1000 + parseInt(extraHundred[1], 10));
      }
      return Math.round(base * 1000);
    }
  }

  // 4. Indonesian word-number parsing, e.g. "dua puluh lima ribu", "tiga puluh ribu", "seratus lima puluh ribu"
  const wordNumber = parseIndonesianWordNumber(text);
  if (wordNumber !== null && wordNumber > 0) {
    return wordNumber;
  }

  // 5. Plain standalone numbers of reasonable transaction scale (e.g. 500, 1000, 25000)
  const plainMatch = text.match(/\b\d{3,9}\b/);
  if (plainMatch) {
    const val = parseInt(plainMatch[0], 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return null;
}

export function parseIndonesianVoiceTransaction(transcript: string): {
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
} {
  const clean = transcript.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Nominal (0 if not detected yet)
  const detectedAmount = extractNominalFromText(lower) || 0;

  // 2. Detect Type (Income, Saving, or Expense)
  let detectedType: TransactionType = 'expense';

  const incomeKeywords = [
    'gaji', 'pemasukan', 'dapat uang', 'ditransfer', 'dapat transferan',
    'bonus', 'thr', 'hasil jualan', 'cair', 'pendapatan', 'terima uang', 'untung'
  ];
  const savingKeywords = [
    'tabung', 'nabung', 'simpan', 'celengan', 'deposito', 'investasi',
    'reksadana', 'saving', 'sisihkan', 'alokasi tabungan'
  ];

  if (savingKeywords.some(kw => lower.includes(kw))) {
    detectedType = 'saving';
  } else if (incomeKeywords.some(kw => lower.includes(kw))) {
    detectedType = 'income';
  }

  // 3. Detect Category
  let detectedCategory = 'Makanan';

  if (detectedType === 'saving') {
    detectedCategory = 'Tabungan';
  } else if (detectedType === 'income') {
    detectedCategory = 'Gaji / Pemasukan';
  } else if (
    lower.includes('bensin') ||
    lower.includes('ojol') ||
    lower.includes('gojek') ||
    lower.includes('gocar') ||
    lower.includes('goride') ||
    lower.includes('grab') ||
    lower.includes('maxim') ||
    lower.includes('angkot') ||
    lower.includes('bus') ||
    lower.includes('kereta') ||
    lower.includes('krl') ||
    lower.includes('mrt') ||
    lower.includes('parkir') ||
    lower.includes('tol')
  ) {
    detectedCategory = 'Transportasi';
  } else if (
    lower.includes('buku') ||
    lower.includes('modul') ||
    lower.includes('kuliah') ||
    lower.includes('spp') ||
    lower.includes('kursus') ||
    lower.includes('seminar') ||
    lower.includes('fotokopi') ||
    lower.includes('print') ||
    lower.includes('alat tulis') ||
    lower.includes('sertifikasi')
  ) {
    detectedCategory = 'Pendidikan';
  } else if (
    lower.includes('nonton') ||
    lower.includes('bioskop') ||
    lower.includes('game') ||
    lower.includes('steam') ||
    lower.includes('topup') ||
    lower.includes('spotify') ||
    lower.includes('netflix') ||
    lower.includes('konser') ||
    lower.includes('karaoke')
  ) {
    detectedCategory = 'Hiburan';
  } else if (
    lower.includes('listrik') ||
    lower.includes('pln') ||
    lower.includes('air') ||
    lower.includes('pdam') ||
    lower.includes('wifi') ||
    lower.includes('indihome') ||
    lower.includes('pulsa') ||
    lower.includes('paket data') ||
    lower.includes('kuota') ||
    lower.includes('kos') ||
    lower.includes('bpjs')
  ) {
    detectedCategory = 'Tagihan';
  } else if (
    lower.includes('beli baju') ||
    lower.includes('belanja') ||
    lower.includes('shopee') ||
    lower.includes('tokopedia') ||
    lower.includes('sepatu') ||
    lower.includes('skincare') ||
    lower.includes('minimarket') ||
    lower.includes('indomaret') ||
    lower.includes('alfamart')
  ) {
    detectedCategory = 'Belanja';
  } else if (
    lower.includes('makan') ||
    lower.includes('sarapan') ||
    lower.includes('siang') ||
    lower.includes('malam') ||
    lower.includes('kopi') ||
    lower.includes('ngopi') ||
    lower.includes('warung') ||
    lower.includes('ayam') ||
    lower.includes('nasi') ||
    lower.includes('bakso') ||
    lower.includes('mie') ||
    lower.includes('jajan') ||
    lower.includes('snack') ||
    lower.includes('roti')
  ) {
    detectedCategory = 'Makanan';
  } else {
    detectedCategory = 'Lainnya';
  }

  // 4. Clean Note
  let cleanNote = clean;
  // Clean prefixes like "dari awal", "tadi", "beli", "saya", "tolong catat"
  cleanNote = cleanNote.replace(/^(dari\s+awal\s+|tadi\s+beli\s+|tadi\s+|saya\s+|tolong\s+catat\s+|catat\s+)/i, '');
  if (!cleanNote) cleanNote = detectedCategory;

  return {
    type: detectedType,
    amount: detectedAmount,
    category: detectedCategory,
    note: cleanNote,
    date: getTodayString(),
  };
}
