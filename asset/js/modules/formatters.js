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

  // Cek string dengan titik/titik dua (misal "00:2916666666666667" atau "07:00" atau "7.00")
  s = s.replace(/\./g, ':');
  if (s.includes(':')) {
    const parts = s.split(':');
    if (parts.length >= 2) {
      const hhStr = parts[0].trim();
      const mmStr = parts[1].trim();

      // Kasus khusus: Angka pecahan desimal Excel yang terlanjur diubah menjadi "00:2916666666666667"
      if (mmStr.length > 3 && !isNaN(mmStr)) {
        const fraction = parseFloat(`0.${mmStr}`);
        const totalMinutes = Math.round(fraction * 24 * 60);
        const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
        const mm = String(totalMinutes % 60).padStart(2, '0');
        return `${hh}:${mm}`;
      }

      const hh = String(parseInt(hhStr, 10) || 0).padStart(2, '0');
      const mm = String(parseInt(mmStr, 10) || 0).padStart(2, '0');
      return `${hh}:${mm}`;
    }
  }

  // Jika berupa angka desimal Excel murni (misal 0.2916666666666667 untuk 07:00)
  const num = parseFloat(s);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
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
