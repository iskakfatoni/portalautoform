/**
 * Formatting and Sanitization Utilities
 * Portal AutoForm - SMKN 1 Jetis Mojokerto
 */

export const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function normalizeFormClassName(rawClass) {
  if (!rawClass || rawClass === '-') return '';
  const clean = String(rawClass).trim().replace(/\s+/g, ' ');
  if (clean.startsWith('XII ')) return clean.replace('XII ', 'XII  ');
  if (clean.startsWith('XI ')) return clean.replace('XI ', 'XI  ');
  if (clean.startsWith('X ')) return clean.replace('X ', 'X  ');
  return clean;
}

export function normalizeDayName(dayStr) {
  if (!dayStr) return '';
  const clean = String(dayStr).trim().replace(/['`’]/g, '').toLowerCase();
  if (clean.startsWith('sen')) return 'Senin';
  if (clean.startsWith('sel')) return 'Selasa';
  if (clean.startsWith('rab')) return 'Rabu';
  if (clean.startsWith('kam')) return 'Kamis';
  if (clean.startsWith('jum')) return 'Jumat';
  if (clean.startsWith('sab')) return 'Sabtu';
  if (clean.startsWith('min') || clean.startsWith('ahd')) return 'Minggu';
  return clean;
}

export function formatTimeString(timeStr) {
  if (timeStr === undefined || timeStr === null || timeStr === '') return '';
  
  let s = String(timeStr).trim();

  // Jika berupa objek Date
  if (timeStr instanceof Date) {
    const hh = String(timeStr.getHours()).padStart(2, '0');
    const mm = String(timeStr.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Jika format "HH:MM" standar
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [h, m] = s.split(':');
    return `${String(parseInt(h, 10)).padStart(2, '0')}:${m}`;
  }

  // Cek jika mengandung angka pecahan Excel yang terformat sebagai "00:XXXX" atau "0.XXXX"
  let numVal = NaN;
  s = s.replace(/\./g, ':');
  if (s.includes(':')) {
    const parts = s.split(':');
    if (parts.length >= 2) {
      const hhStr = parts[0].trim();
      const mmStr = parts[1].trim();

      if (hhStr === '00' && mmStr.length > 3 && !isNaN(mmStr)) {
        numVal = parseFloat(`0.${mmStr}`);
      } else {
        const hh = String(parseInt(hhStr, 10) || 0).padStart(2, '0');
        const mm = String(parseInt(mmStr, 10) || 0).padStart(2, '0');
        return `${hh}:${mm}`;
      }
    }
  } else {
    numVal = parseFloat(s);
  }

  // Konversi angka desimal Excel murni (misal 0.5416666666666666 untuk 13:00)
  if (!isNaN(numVal) && numVal >= 0 && numVal < 1) {
    const totalSeconds = Math.round(numVal * 24 * 3600);
    const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  return s;
}

export function formatSpacedNip(nip) {
  if (!nip || nip === '-') return '';
  const digits = String(nip).replace(/\D/g, '');
  if (digits.length === 18) {
    return digits.replace(/^(\d{8})(\d{6})(\d{1})(\d{3})$/, '$1 $2 $3 $4');
  }
  return nip;
}

export const WALI_CLASS_CHOICES = [
  "X TAV", "X TEI 1", "X TEI 2", "X TPL 1", "X TPL 2", "X TPM 1", "X TPM 2", "X TKR1", "X TKR2", "X TBKR", "X TSM 1", "X TSM 2", "X DKV 1", "X DKV 2", "X DKV 3",
  "XI TAV", "XI TEI 1", "XI TEI 2", "XI TPL 1", "XI TPL 2", "XI TPM 1", "XI TPM 2", "XI TKR1", "XI TKR2", "XI TBKR", "XI TSM 1", "XI TSM 2", "XI DKV 1", "XI DKV 2", "XI DKV 3",
  "XII TAV", "XII TEI 1", "XII TEI 2", "XII TPL 1", "XII TPL 2", "XII TPM 1", "XII TPM 2", "XII TKR1", "XII TKR2", "XII TBKR", "XII TSM 1", "XII TSM 2", "XII DKV 1", "XII DKV 2", "XII DKV 3"
];

export function normalizeWaliClassName(rawClass) {
  if (!rawClass || rawClass === '-') return '';
  const clean = String(rawClass).trim().replace(/\s+/g, ' ');
  const exact = WALI_CLASS_CHOICES.find(c => c.toLowerCase() === clean.toLowerCase());
  if (exact) return exact;

  const simplified = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  const found = WALI_CLASS_CHOICES.find(c => c.toLowerCase().replace(/[^a-z0-9]/g, '') === simplified);
  if (found) return found;

  return clean;
}

export const MONTH_NAMES_INDONESIA_UPPER = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

export function getCurrentMonthNameUpper(now = new Date()) {
  return MONTH_NAMES_INDONESIA_UPPER[now.getMonth()];
}
