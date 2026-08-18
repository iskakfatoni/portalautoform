/**
 * Master Data Initial Configuration & Fallback
 * Portal AutoForm - SMKN 1 Jetis Mojokerto
 */

export const INITIAL_TEACHERS = [];

export const INITIAL_FORMS = [
  {
    id: "form_absensi_guru",
    name: "1. Form Absensi Mengajar Guru (KBM)",
    category: "Presensi & KBM",
    icon: "fa-solid fa-clipboard-user",
    description: "Absensi kehadiran guru saat mengajar di kelas sesuai jadwal KBM harian.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdfJ5r2-8fO4H0H4N9M6K7l9vL9Q5e_W-N905qV_0055_W1-Q/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryTanggal: "entry.1708105874",
    entryJamKe: "entry.585996771",
    entryKelas: "entry.666017338",
    entryMapel: "entry.73505426",
    isActive: true,
    orderIndex: 1
  },
  {
    id: "form_jurnal_mengajar",
    name: "2. Jurnal Mengajar Guru (KBM)",
    category: "Jurnal & KBM",
    icon: "fa-solid fa-book-bookmark",
    description: "Jurnal mengajar harian guru untuk merekam materi, kelas, dan kehadiran siswa.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryTanggal: "entry.1708105874",
    entryJamKe: "entry.585996771",
    entryKelas: "entry.666017338",
    entryMapel: "entry.73505426",
    isActive: true,
    orderIndex: 2
  },
  {
    id: "form_absensi_piket",
    name: "3. Absensi Guru Piket Harian",
    category: "Piket & Presensi",
    icon: "fa-solid fa-user-clock",
    description: "Laporan presensi dan pemantauan ketertiban KBM harian oleh Guru Piket.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeqL7g8V929dSqE1t_3y8oRgZe_fUJ_mC-V1rlroRzVWcns2w/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    isActive: true,
    orderIndex: 3
  },
  {
    id: "form_wali_kelas",
    name: "4. Pelaporan Administrasi Wali Kelas",
    category: "Wali Kelas",
    icon: "fa-solid fa-chalkboard-user",
    description: "Formulir rekapitulasi, pembinaan siswa, dan laporan bulanan Wali Kelas.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeVYQG1tPodad-cUyHW5Mzx3CmO3L8GOx8AzWXajJqYkqbkBg/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    isActive: true,
    orderIndex: 4
  },
  {
    id: "form_guru_wali",
    name: "5. Pendampingan & Konseling Guru Wali",
    category: "Guru Wali",
    icon: "fa-solid fa-heart-pulse",
    description: "Catatan pendampingan karakter dan bimbingan siswa oleh Guru Wali.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeVYQG1tPodad-cUyHW5Mzx3CmO3L8GOx8AzWXajJqYkqbkBg/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    isActive: true,
    orderIndex: 5
  }
];

export const INITIAL_SCHEDULES = [];
export const FORM_CLASS_OPTIONS = [];
export const ALL_CLASSES = [];
