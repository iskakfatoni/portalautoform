/**
 * Schedule Resolution and Google Form Pre-filled URL Generator
 * Portal AutoForm - SMKN 1 Jetis Mojokerto
 */

import { INITIAL_FORMS, INITIAL_SCHEDULES } from './initial-data.js';
import { formatTimeString, normalizeDayName, normalizeFormClassName, INDONESIAN_DAYS } from './formatters.js';

export function getActiveTeacherSchedule(teacher, now = new Date(), currentSchedules = []) {
  if (!teacher) return null;
  const teacherNipDigits = (teacher.nip || '').replace(/\D/g, '');
  const teacherCleanName = (teacher.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const schedules = (currentSchedules && currentSchedules.length > 0) ? currentSchedules : INITIAL_SCHEDULES;
  const teacherSchedules = schedules.filter(s => {
    const sNipDigits = (s.nip || '').replace(/\D/g, '');
    if (sNipDigits && teacherNipDigits && sNipDigits === teacherNipDigits) return true;
    
    const sCleanName = (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sCleanName && teacherCleanName) {
      if (sCleanName === teacherCleanName) return true;
      if (sCleanName.includes(teacherCleanName) || teacherCleanName.includes(sCleanName)) return true;
    }
    return false;
  });

  if (teacherSchedules.length === 0) return null;

  const currentDayIndex = now.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const currentDay = INDONESIAN_DAYS[currentDayIndex];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // ATURAN AKHIR PEKAN (Sabtu & Minggu): Libur KBM, HANYA isi Nama Guru & NIP
  if (currentDayIndex === 0 || currentDayIndex === 6) {
    return null;
  }

  // 1. Filter jadwal untuk hari aktif ini (Senin - Jumat) dengan normalisasi ejaan hari
  const todaySchedules = teacherSchedules.filter(s => normalizeDayName(s.hari) === currentDay);

  if (todaySchedules.length > 0) {
    // A. Cek apakah ada jadwal yang sedang aktif saat ini (prioritas sesi yang baru mulai jika tepat di batas waktu)
    const activeSlot = todaySchedules.find(s => {
      const sMulai = formatTimeString(s.jamMulai);
      const sSelesai = formatTimeString(s.jamSelesai);
      if (sMulai && sSelesai) {
        return currentTimeStr >= sMulai && currentTimeStr < sSelesai;
      }
      return false;
    }) || todaySchedules.find(s => {
      const sMulai = formatTimeString(s.jamMulai);
      const sSelesai = formatTimeString(s.jamSelesai);
      return sMulai && sSelesai && currentTimeStr >= sMulai && currentTimeStr <= sSelesai;
    });

    if (activeSlot) return activeSlot;

    // B. Jika belum waktunya pada hari ini, ambil jadwal terdekat berikutnya hari ini
    const upcomingTodaySlots = todaySchedules.filter(s => {
      const sMulai = formatTimeString(s.jamMulai);
      return sMulai && sMulai >= currentTimeStr;
    });
    if (upcomingTodaySlots.length > 0) {
      upcomingTodaySlots.sort((a, b) => formatTimeString(a.jamMulai).localeCompare(formatTimeString(b.jamMulai)));
      return upcomingTodaySlots[0];
    }
  }

  // C. Jika jadwal hari ini sudah terlewati (misal sore/malam hari Senin-Kamis):
  // Cek jadwal hari kerja berikutnya (besok)
  const nextDayIndex = (currentDayIndex + 1) % 7;
  if (nextDayIndex === 0 || nextDayIndex === 6) {
    // Jika besok adalah akhir pekan (Jumat sore -> Sabtu), HANYA isi Nama & NIP
    return null;
  }

  const nextDayName = INDONESIAN_DAYS[nextDayIndex];
  const nextDaySchedules = teacherSchedules.filter(s => normalizeDayName(s.hari) === nextDayName);

  if (nextDaySchedules.length > 0) {
    // Urutkan jadwal hari berikutnya dan ambil yang paling awal
    nextDaySchedules.sort((a, b) => formatTimeString(a.jamMulai).localeCompare(formatTimeString(b.jamMulai)));
    return nextDaySchedules[0];
  }

  // D. Jika hari berikutnya kosong: return null (HANYA isi Nama Guru & NIP)
  return null;
}

export function generateFormUrlForTeacher(form, teacher, now = new Date(), currentSchedules = []) {
  const params = new URLSearchParams();
  params.set('usp', 'pp_url');

  const todaySchedule = getActiveTeacherSchedule(teacher, now, currentSchedules);
  console.log(`[AutoForm] Guru: ${teacher ? teacher.name : 'Unknown'}, Total Jadwal di Memory: ${currentSchedules.length}, Jadwal Terpilih:`, todaySchedule);

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;

  // Helper untuk menstandarkan URL Google Forms ke mode viewform dan menghapus query lama
  const cleanFormUrl = (url) => {
    if (!url) return '';
    let clean = url.trim().split('?')[0];
    clean = clean.replace(/\/edit(\/.*)?$/, '/viewform');
    if (clean.includes('docs.google.com/forms/d/') && !clean.endsWith('/viewform')) {
      clean = clean.replace(/\/+$/, '') + '/viewform';
    }
    return clean;
  };

  // 1. Form Absensi Mengajar Khusus dengan Auto-Fill Jadwal Lengkap
  if (form.id === "form_absensi_guru") {
    const targetUrl = cleanFormUrl(form.baseUrl);
    // Identitas Guru & Tanggal selalu diisi
    if (form.entryGuru && teacher && teacher.name) params.set(form.entryGuru, teacher.name);
    if (form.entryNip && teacher && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);
    if (form.entryTanggal) params.set(form.entryTanggal, isoDate);

    if (todaySchedule) {
      if (form.entryJamKe && todaySchedule.jamKe) {
        params.set(form.entryJamKe, todaySchedule.jamKe);
      }
      if (form.entryKelas && todaySchedule.kelas) {
        params.set(form.entryKelas, normalizeFormClassName(todaySchedule.kelas));
      }
      if (form.entryMapel && todaySchedule.mataPelajaran) {
        params.set(form.entryMapel, todaySchedule.mataPelajaran);
      }
    } else {
      console.log("[AutoForm] Tidak ada jadwal yang cocok/aktif hari ini maupun besok. Jam, Kelas, dan Mapel dikosongkan.");
    }

    return `${targetUrl}?${params.toString()}`;
  }

  // 2. Form Jurnal Mengajar Pribadi Guru dengan Auto-Fill Jadwal Lengkap
  if (form.id === "form_jurnal_mengajar") {
    const rawUrl = (teacher && teacher.journalFormUrl && teacher.journalFormUrl.trim() !== '' && teacher.journalFormUrl !== '-') 
      ? teacher.journalFormUrl.trim() 
      : form.baseUrl;
    if (!rawUrl) return "#";

    const targetUrl = cleanFormUrl(rawUrl);

    // Identitas Guru (jika field entry tersedia)
    if (form.entryGuru && teacher && teacher.name) params.set(form.entryGuru, teacher.name);
    if (form.entryNip && teacher && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);

    // Selalu set tanggal hari ini
    params.set(form.entryTanggal || "entry.1708105874", isoDate);

    // Jika ada jadwal aktif / terdekat: isi Jam Ke, Kelas, dan Mapel
    if (todaySchedule) {
      if (todaySchedule.jamKe) {
        params.set(form.entryJamKe || "entry.585996771", todaySchedule.jamKe);
      }
      if (todaySchedule.kelas) {
        params.set(form.entryKelas || "entry.666017338", normalizeFormClassName(todaySchedule.kelas));
      }
      if (todaySchedule.mataPelajaran) {
        params.set(form.entryMapel || "entry.73505426", todaySchedule.mataPelajaran);
      }
    }

    return `${targetUrl}?${params.toString()}`;
  }

  // 3. Formulir Standar Lainnya
  const targetUrl = cleanFormUrl(form.baseUrl);
  if (form.entryGuru && teacher && teacher.name) params.set(form.entryGuru, teacher.name);
  if (form.entryNip && teacher && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);
  return `${targetUrl}?${params.toString()}`;
}

export function sortAndNormalizeForms(formsList) {
  const list = (!formsList || formsList.length === 0) ? INITIAL_FORMS : formsList;
  const canonicalPiketUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeqL7g8V929dSqE1t_3y8oRgZe_fUJ_mC-V1rlroRzVWcns2w/viewform";

  const normalized = list.map(f => {
    if (f.id === "form_absensi_piket") {
      return { ...f, baseUrl: canonicalPiketUrl };
    }
    return f;
  });

  return [...normalized].sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
}
