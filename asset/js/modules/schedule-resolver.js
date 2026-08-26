/**
 * Schedule Resolution and Google Form Pre-filled URL Generator
 * Portal AutoForm - SMKN 1 Jetis Mojokerto
 */

import { 
  formatTimeString, 
  normalizeDayName, 
  normalizeFormClassName, 
  normalizeWaliClassName,
  getCurrentMonthNameUpper,
  formatSpacedNip, 
  INDONESIAN_DAYS 
} from './formatters.js';

export function getActiveTeacherSchedule(teacher, now = new Date(), currentSchedules = []) {
  if (!teacher) return null;
  const teacherNipDigits = (teacher.nip || '').replace(/\D/g, '');
  const teacherCleanName = (teacher.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const schedules = (currentSchedules && currentSchedules.length > 0) ? currentSchedules : [];
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

export function generateFormUrlForTeacher(form, teacher, now = new Date(), currentSchedules = [], customOptions = {}) {
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

  // 1. Form Absensi Guru (Hanya Identitas Guru & Tanggal)
  if (form.id === "form_absensi_guru") {
    const targetUrl = cleanFormUrl(form.baseUrl);
    if (form.entryGuru && teacher && teacher.name) params.set(form.entryGuru, teacher.name);
    if (form.entryNip && teacher && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);
    if (form.entryTanggal) params.set(form.entryTanggal, isoDate);
    return `${targetUrl}?${params.toString()}`;
  }

  // 2. Form Jurnal Mengajar Pribadi Guru dengan Auto-Fill Jadwal KBM Lengkap (Jam Ke, Kelas, Mapel, Capaian Materi)
  const isJurnalForm = form.id === "form_jurnal_mengajar" || (form.name && form.name.toLowerCase().includes("jurnal")) || form.category === "Jurnal Mengajar";
  if (isJurnalForm) {
    const rawUrl = (teacher && teacher.journalFormUrl && teacher.journalFormUrl.trim() !== '' && teacher.journalFormUrl !== '-') 
      ? teacher.journalFormUrl.trim() 
      : form.baseUrl;
    if (!rawUrl) return "#";

    const targetUrl = cleanFormUrl(rawUrl);

    // Identitas Guru
    if (form.entryGuru && teacher && teacher.name) params.set(form.entryGuru, teacher.name);
    if (form.entryNip && teacher && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);

    // Selalu set tanggal hari ini
    params.set(form.entryTanggal || "entry.1708105874", isoDate);

    // HANYA Jurnal Mengajar yang mengambil rincian Jadwal Mengajar (Jam Ke, Kelas, Mapel)
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

    // Auto-Fill Capaian / Materi Pembelajaran (entry.1059038821)
    const entryMateriKey = form.entryMateri || "entry.1059038821";
    const selectedMateri = (customOptions && customOptions.materi) || (todaySchedule && todaySchedule.materi);
    if (selectedMateri && String(selectedMateri).trim() !== '') {
      params.set(entryMateriKey, String(selectedMateri).trim());
    }

    return `${targetUrl}?${params.toString()}`;
  }

  // 3. Form Wali Kelas / Pengumpulan Bulanan Walikelas
  const isWali = form.id === "pengumpulan_bulanan_walikelas" || form.id === "form_wali_kelas" || (form.name && form.name.toLowerCase().includes("wali kelas"));
  if (isWali) {
    const canonicalWaliUrl = "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform";
    const targetUrl = cleanFormUrl(form.baseUrl || canonicalWaliUrl);

    const entryGuruKey = form.entryGuru || "entry.1599393498";
    const entryNipKey = form.entryNip || "entry.65154558";
    const entryKelasKey = form.entryKelas || "entry.591543822";
    const entryBulanKey = form.entryBulan || "entry.73505426";

    // 1. Nama Guru (Dropdown)
    if (entryGuruKey && teacher && teacher.name) params.set(entryGuruKey, teacher.name);

    // 2. NIP (Teks Bebas)
    if (entryNipKey && teacher && teacher.nip && teacher.nip !== '-') params.set(entryNipKey, teacher.nip);

    // 3. Kelas Binaan Walikelas (Dropdown)
    if (entryKelasKey && teacher && teacher.class && teacher.class !== '-') {
      params.set(entryKelasKey, normalizeWaliClassName(teacher.class));
    }

    // 4. Bulan Berjalan (Dropdown)
    if (entryBulanKey) {
      params.set(entryBulanKey, getCurrentMonthNameUpper(now));
    }

    return `${targetUrl}?${params.toString()}`;
  }

  // 4. Form Guru Wali / Pengumpulan Bulanan Guru Wali
  const isGuruWali = form.id === "form_guru_wali" || (form.name && form.name.toLowerCase().includes("guru wali")) || form.category === "Guru Wali";
  if (isGuruWali) {
    const canonicalGuruWaliUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeVYQG1tPodad-cUyHW5Mzx3CmO3L8GOx8AzWXajJqYkqbkBg/viewform";
    const targetUrl = cleanFormUrl(form.baseUrl || canonicalGuruWaliUrl);

    const entryGuruKey = form.entryGuru || "entry.1599393498";
    const entryNipKey = form.entryNip || "entry.65154558";
    const entryKelasKey = form.entryKelas || "entry.591543822";
    const entryBulanKey = form.entryBulan || "entry.73505426";

    // 1. Nama Guru (Dropdown)
    if (entryGuruKey && teacher && teacher.name) params.set(entryGuruKey, teacher.name);

    // 2. NIP (Teks Bebas)
    if (entryNipKey && teacher && teacher.nip && teacher.nip !== '-') params.set(entryNipKey, teacher.nip);

    // 3. Kelas Binaan Guru Wali (Dropdown) - Mengambil dari guruWaliClass
    const waliClass = (teacher && teacher.guruWaliClass && teacher.guruWaliClass !== '-') 
      ? teacher.guruWaliClass 
      : (teacher ? teacher.class : '');
    if (entryKelasKey && waliClass && waliClass !== '-') {
      params.set(entryKelasKey, normalizeWaliClassName(waliClass));
    }

    // 4. Bulan Berjalan (Dropdown)
    if (entryBulanKey) {
      params.set(entryBulanKey, getCurrentMonthNameUpper(now));
    }

    return `${targetUrl}?${params.toString()}`;
  }

  // 5. Form Absensi Guru Piket & Formulir Standar Lainnya
  const isPiket = form.id === "form_absensi_piket" || (form.name && form.name.toLowerCase().includes("piket")) || form.category === "Piket";
  
  const targetUrl = isPiket 
    ? "https://docs.google.com/forms/d/e/1FAIpQLSeqL7g8V929dSqE1t_3y8oRgZe_fUJ_mC-V1rlroRzVWcns2w/viewform"
    : cleanFormUrl(form.baseUrl);

  const entryGuruKey = isPiket ? "entry.227643322" : form.entryGuru;
  const entryNipKey = isPiket ? "entry.1591970773" : form.entryNip;
  const entryTanggalKey = isPiket ? "entry.965224728" : form.entryTanggal;

  if (entryGuruKey && teacher && teacher.name) params.set(entryGuruKey, teacher.name);
  if (entryNipKey && teacher && teacher.nip && teacher.nip !== '-') {
    const finalNip = isPiket ? formatSpacedNip(teacher.nip) : teacher.nip;
    params.set(entryNipKey, finalNip);
  }
  if (entryTanggalKey) params.set(entryTanggalKey, isoDate);
  if (form.entryKelas && teacher && teacher.class && teacher.class !== '-') {
    params.set(form.entryKelas, normalizeFormClassName(teacher.class));
  }
  return `${targetUrl}?${params.toString()}`;
}

export function sortAndNormalizeForms(formsList) {
  const list = formsList || [];
  const canonicalPiketUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeqL7g8V929dSqE1t_3y8oRgZe_fUJ_mC-V1rlroRzVWcns2w/viewform";
  const canonicalWaliUrl = "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform";
  const canonicalGuruWaliUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeVYQG1tPodad-cUyHW5Mzx3CmO3L8GOx8AzWXajJqYkqbkBg/viewform";

  const normalized = list.map(f => {
    const isPiket = f.id === "form_absensi_piket" || (f.name && f.name.toLowerCase().includes("piket")) || f.category === "Piket";
    if (isPiket) {
      return { 
        ...f, 
        baseUrl: canonicalPiketUrl,
        entryGuru: "entry.227643322",
        entryNip: "entry.1591970773",
        entryTanggal: "entry.965224728"
      };
    }
    const isWali = f.id === "form_wali_kelas" || f.id === "pengumpulan_bulanan_walikelas" || (f.name && f.name.toLowerCase().includes("wali kelas"));
    if (isWali) {
      return { 
        ...f, 
        baseUrl: canonicalWaliUrl,
        entryGuru: "entry.1599393498",
        entryNip: "entry.65154558",
        entryKelas: "entry.591543822",
        entryBulan: "entry.73505426"
      };
    }
    const isGuruWali = f.id === "form_guru_wali" || (f.name && f.name.toLowerCase().includes("guru wali")) || f.category === "Guru Wali";
    if (isGuruWali) {
      return { 
        ...f, 
        baseUrl: canonicalGuruWaliUrl,
        entryGuru: "entry.1599393498",
        entryNip: "entry.65154558",
        entryKelas: "entry.591543822",
        entryBulan: "entry.73505426"
      };
    }
    return f;
  });

  return [...normalized].sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
}
