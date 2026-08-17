/**
 * PORTAL:AutoForm - Login Module
 * Mengelola proses autentikasi Guru (NIP) dan Administrator (Firebase Auth)
 */

import {
  initFirebase,
  auth,
  db,
  googleProvider,
  isFirebaseActive,
  signInWithPopup,
  signInWithEmailAndPassword,
  collection,
  getDocs
} from './firebase-config.js';

// Master Data Guru Awal (Fallback jika belum ada di cache/cloud)
const INITIAL_TEACHERS = [
  { orderIndex: 1, name: "HERMAWANTO, S.Pd., M.Psi", nip: "196706281992031005", class: "X TAV", role: "Walikelas", journalFormUrl: "https://forms.gle/BeJzAbXvcmBDChdM7" },
  { orderIndex: 2, name: "NURUL HIDAYATI, S.Pd., M.Psi", nip: "197004301998022004", class: "X TEI 1", role: "Walikelas", journalFormUrl: "https://forms.gle/UttCqb2kxt4LevCA8" },
  { orderIndex: 3, name: "Drs. MOEHAIMIN", nip: "196709041997031005", class: "X TEI 2", role: "Walikelas", journalFormUrl: "https://forms.gle/ekQJWbDbi72DSNHX9" },
  { orderIndex: 4, name: "DHURROTUL FARIDAH, S.Pd", nip: "196707142006042005", class: "X TPL 1", role: "Walikelas", journalFormUrl: "https://forms.gle/EAzSZTbK6kUfrX8C6" },
  { orderIndex: 5, name: "SRI WINARTI, S.Pd", nip: "197307112007012008", class: "X TPL 2", role: "Walikelas", journalFormUrl: "https://forms.gle/8ZEBkkUCnKsji4o86" },
  { orderIndex: 6, name: "MUNASRI, S.Pd.", nip: "197003282008012013", class: "X TPM 1", role: "Walikelas", journalFormUrl: "https://forms.gle/FzjMqjr2bhYB4mFGA" },
  { orderIndex: 7, name: "NUR HAYATI, S.Psi, M.Pd.", nip: "197310152009012003", class: "X TPM 2", role: "Walikelas", journalFormUrl: "https://forms.gle/tjdYkQqDwhcY3s9M8" },
  { orderIndex: 8, name: "DWI RETNO TUGAS ERNAWATI, S.Pd", nip: "196702142008012009", class: "X TKR1", role: "Walikelas", journalFormUrl: "https://forms.gle/hpaJmjc4TSuY21187" },
  { orderIndex: 9, name: "KASIATIN, S.Pd", nip: "196908112007012019", class: "X TKR2", role: "Walikelas", journalFormUrl: "https://forms.gle/zCXw2UY7hgtbguuc6" },
  { orderIndex: 10, name: "SUHARTO DWI SUHERNOWO, ST", nip: "197803262009011007", class: "X TBKR", role: "Walikelas", journalFormUrl: "https://forms.gle/8SMDhw8YpsNPPHPK7" },
  { orderIndex: 11, name: "ARSYL NOVA ARIRI, ST, M.Pd.", nip: "197811142009012007", class: "X TSM 1", role: "Walikelas", journalFormUrl: "https://forms.gle/sZ2Rff4sL9N4FTrh9" },
  { orderIndex: 12, name: "LAILA FITRIYA, S.Pd.I", nip: "198506172009012006", class: "X TSM 2", role: "Walikelas", journalFormUrl: "https://forms.gle/pBf7DjQupFLXH6nWA" },
  { orderIndex: 13, name: "EKA PRAMITASARI, S.Pd. M.Pd.", nip: "198710302010012005", class: "X DKV 1", role: "Walikelas", journalFormUrl: "https://forms.gle/AxyndhftR6gYSVmB8" },
  { orderIndex: 14, name: "MISBAHUR ROSYIDIN, S.Pd.", nip: "196802112008011008", class: "X DKV 2", role: "Walikelas", journalFormUrl: "https://forms.gle/qAKh9HhWnrVaF9188" },
  { orderIndex: 15, name: "Dra. DYAH CHUSNUL CHOTIMAH", nip: "196802142007012016", class: "X DKV 3", role: "Walikelas", journalFormUrl: "https://forms.gle/vSrCTQDTrywzDCFr9" },
  { orderIndex: 16, name: "WAWAN SISWANTO, SS", nip: "196904012007011025", class: "XI TAV", role: "Walikelas", journalFormUrl: "https://forms.gle/ghNaoJYp7o2SbkjS8" },
  { orderIndex: 17, name: "R.A. RATNA KARTIKAWATI, S.Pd", nip: "196905132008012023", class: "XI TEI 1", role: "Walikelas", journalFormUrl: "https://forms.gle/bPxWzjgFDES2StGo6" },
  { orderIndex: 18, name: "HERI SUBYANTORO, ST, M.Pd.", nip: "196910102008011021", class: "XI TEI 2", role: "Walikelas", journalFormUrl: "https://forms.gle/vmr8h5S4bZUgpuSDA" },
  { orderIndex: 19, name: "NURUL HUDA, ST, M.Si.", nip: "197102162008011009", class: "XI TPL 1", role: "Walikelas", journalFormUrl: "https://forms.gle/aaS7YNQQ97713C18A" },
  { orderIndex: 20, name: "NUR 'AFIIFAH, M.Pd.", nip: "197208052007012020", class: "XI TPL 2", role: "Walikelas", journalFormUrl: "https://forms.gle/6YPzECievjrGJZBnA" },
  { orderIndex: 21, name: "TRIBUDI HARTONO, S.Pd", nip: "197511052003121004", class: "XI TPM 1", role: "Walikelas", journalFormUrl: "https://forms.gle/2mog9vghqCw6TSTw7" },
  { orderIndex: 22, name: "DEDY HENDRIANA, S.Pd. M.Pd.", nip: "197904072010011002", class: "XI TPM 2", role: "Walikelas", journalFormUrl: "https://forms.gle/b1RueY7nPpt15x8E8" },
  { orderIndex: 23, name: "AGUS HIDAYAT, S.Pd", nip: "196907272007011018", class: "XI TKR1", role: "Walikelas", journalFormUrl: "https://forms.gle/wxgwNDGd29eJQ2KN9" },
  { orderIndex: 24, name: "SAMSUL HADI, M.Pd.", nip: "197509262008011011", class: "XI TKR2", role: "Walikelas", journalFormUrl: "https://forms.gle/DSDoMKgI8XxbcPr78" },
  { orderIndex: 25, name: "HISBULLOH HUDA, M.Pd.", nip: "197602072010011006", class: "XI TBKR", role: "Walikelas", journalFormUrl: "https://forms.gle/jVwhLYXebas1GSZQJ6" },
  { orderIndex: 26, name: "DWI SANTOSO, S.Pd", nip: "197908082006041019", class: "XI TSM 1", role: "Walikelas", journalFormUrl: "https://forms.gle/onVhbyPNBtqyXoKF6" },
  { orderIndex: 27, name: "AGUS HARIYANTO, ST. M.Pd", nip: "198010032010011010", class: "XI TSM 2", role: "Walikelas", journalFormUrl: "https://forms.gle/r3mekFxufrTcJjgRA" },
  { orderIndex: 28, name: "ZAINUL ARIFIN, M.Pd.", nip: "198210112010011009", class: "XI DKV 1", role: "Walikelas", journalFormUrl: "https://forms.gle/7qv6Sn6oyDoiWaJRA" },
  { orderIndex: 29, name: "BAMBANG SUJATMIKO, S.Pd", nip: "198211222006041009", class: "XI DKV 2", role: "Walikelas", journalFormUrl: "https://forms.gle/ZmqK8UTBjk5rB5Nr6" },
  { orderIndex: 30, name: "HARTONO, S.Pd", nip: "198205122009011009", class: "XI DKV 3", role: "Walikelas", journalFormUrl: "https://forms.gle/TCrTxrXy19UmQ7v57" },
  { orderIndex: 31, name: "SIGIT EKO PRAMONO, S.Pd", nip: "198301122009011006", class: "XII TAV", role: "Walikelas", journalFormUrl: "https://forms.gle/PSXtPwi7yQN3Mfi8" },
  { orderIndex: 32, name: "AGUNG RAKHMANDA, S.Kom.", nip: "198303272009031002", class: "XII TEI 1", role: "Walikelas", journalFormUrl: "https://forms.gle/QmYRNR3BmhgENtQM7" },
  { orderIndex: 33, name: "MOHAMAD ARIEF PRIYO UTOMO, S.Pd", nip: "198209292010011011", class: "XII TPL 1", role: "Walikelas", journalFormUrl: "https://forms.gle/ESlazXu6aQ3PklsD9" },
  { orderIndex: 34, name: "Dr. RIRIN DIYANNITA SASANTI, M.Pd.", nip: "198212022014062003", class: "XII TPL 2", role: "Walikelas", journalFormUrl: "https://forms.gle/KwfitQjMYbtsnr4UZV6" },
  { orderIndex: 35, name: "SULIADI, S.Pd", nip: "198403262010011008", class: "XII TPM 1", role: "Walikelas", journalFormUrl: "https://forms.gle/DStwfQQGe3W3gc73A" },
  { orderIndex: 36, name: "TUTIK QOMARIYAH, S.Si", nip: "198504032010012014", class: "XII TPM 2", role: "Walikelas", journalFormUrl: "https://forms.gle/8Z33XXUnWmhZCY9S9" },
  { orderIndex: 37, name: "IMAM SUFERI, ST.", nip: "197712302008011013", class: "XII TKR1", role: "Walikelas", journalFormUrl: "https://forms.gle/J6EiPd2GAwQZ6wFW6" },
  { orderIndex: 38, name: "FIRMAN ARDIANSYAH, S.Pd.", nip: "198706172011011010", class: "XII TKR2", role: "Walikelas", journalFormUrl: "https://forms.gle/iGQNqJij1huPUYbk8" },
  { orderIndex: 39, name: "AZIZ CAHYA PRADANA, S.Pd.", nip: "199103072019031014", class: "XII TBKR", role: "Walikelas", journalFormUrl: "https://forms.gle/RvBNnww2vjNe3gNo76" },
  { orderIndex: 40, name: "WAHYU ROFIUL AMIN, S.Pd.", nip: "199311072019031004", class: "XII TSM 1", role: "Walikelas", journalFormUrl: "https://forms.gle/eSTVKcrx2NqqFGR28" },
  { orderIndex: 41, name: "ROHMA EKA INDRI AHADIAH, S.Pd, Gr", nip: "199410092019032012", class: "XII TSM 2", role: "Walikelas", journalFormUrl: "https://forms.gle/gD3Zpk5RKHD7V7w47" },
  { orderIndex: 42, name: "EFRIDA ISBANDRIYAH, S.T.", nip: "199511062019032010", class: "XII DKV 1", role: "Walikelas", journalFormUrl: "https://forms.gle/wtPkKSjFyF5RRwop8" },
  { orderIndex: 43, name: "SOTYA BAYUNTARA, S.Pd.", nip: "196906252022211004", class: "XII DKV 2", role: "Walikelas", journalFormUrl: "https://forms.gle/Abmd97JBpyFbDuCh8" },
  { orderIndex: 44, name: "SRIGATI, SE", nip: "197505052022212013", class: "XII DKV 3", role: "Walikelas", journalFormUrl: "https://forms.gle/eHzdCy8ZxZBVz3Z49" },
  { orderIndex: 45, name: "HARI PURWANTO, ST", nip: "197711242022211006", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/VATdTt1di5mEdH4h6" },
  { orderIndex: 46, name: "ESTI WIDHIARNI, S.T", nip: "197906032022212022", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/1favQB463JKk2h9M6" },
  { orderIndex: 47, name: "MUCHAMAD ISKAK FATONI, S.Pd.", nip: "198109092022211004", class: "XII TEI 2", role: "Walikelas", journalFormUrl: "https://forms.gle/8gJnGjMNeycVPU138" },
  { orderIndex: 48, name: "EKO FAJAR KURNIAWAN, S.Pd", nip: "198212102022211017", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/oXfsP7gNDGJ4XmPx5" },
  { orderIndex: 49, name: "ETIK SULISTYOWATI, S.Pd.", nip: "198304282022212026", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/U9F3SKAciwAgqt8S6" },
  { orderIndex: 50, name: "NOVAN EKO SETYAWAN, S.Kom.", nip: "198404192022211018", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/5ukkAKPa1f6AFkZc7" },
  { orderIndex: 51, name: "YAYUK NURNANINGSIH, S.Pd", nip: "198607052022212052", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/55GCWMt4rvFq8Tpl9" },
  { orderIndex: 52, name: "KHOIRUL AMIN, S.Pd", nip: "198701192022211009", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/P6MqNKLpvStsk3rh6" },
  { orderIndex: 53, name: "REZA ZULKARNAIN ARIFIN, S.Pd.", nip: "198712072022211015", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/5d5N1oRaKt7F4rju9" },
  { orderIndex: 54, name: "KHOIRUZEN, ST", nip: "197107222023211002", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/ZNeYDpDbGFZanGsy9" },
  { orderIndex: 55, name: "HEPPY LUCKITO, SST", nip: "198110272023211008", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/Aw8wRNdvhxJR8evv7" },
  { orderIndex: 56, name: "SRI PURWANINGSIH, S.Pd", nip: "198203022023212020", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/zV8nWBL4Qu79ExRU6" },
  { orderIndex: 57, name: "DARIS UMAMI, S.Pd.", nip: "198205042023212026", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/JSRwHajfSJNBKxr9" },
  { orderIndex: 58, name: "AKHMAD ROFI SAFUAT, S.Pd.", nip: "198808072023211018", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/wDAYP8evmdZCEvHr7" },
  { orderIndex: 59, name: "SIDHARTHA BUDI SUMEDHA, S.Pd", nip: "199410282023211012", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/H5SUvtQMCcwgcz449" },
  { orderIndex: 60, name: "ASYITAH  ALMUFIDAH, S.Pd", nip: "199606142023212026", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/byFX3UbYfSVMGRUx5" },
  { orderIndex: 61, name: "SUDARMONO, ST", nip: "197206202024211005", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/1DCZSoKurcAwXyia8" },
  { orderIndex: 62, name: "ROHMAN, S.T.", nip: "197509042024211002", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/cVgvkziCBW5ZqSoT9" },
  { orderIndex: 63, name: "ANDRI YUDHI PRASETYO, ST", nip: "197907232024211002", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/z5unoXhPisrFHYQe6" },
  { orderIndex: 64, name: "MIANTO, S.Kom.", nip: "198005222024211005", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/St3Fvko6Q8Rk5P1N6" },
  { orderIndex: 65, name: "HARIS ALI MUHYIDIN, S.T", nip: "198103052024211008", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/y2hUPpv4QgWmHGQLA" },
  { orderIndex: 66, name: "MAMIEK ZUHRIYAH. S.Hum", nip: "198112142024212008", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/6SoaEmuGWvds11M57" },
  { orderIndex: 67, name: "UMI RU'YATIN, S.Pd", nip: "198201062024212001", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/f1Bak224cs2fbQWv6" },
  { orderIndex: 68, name: "YEFI WULANDARI, SE", nip: "198204272024212014", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/uRdDxC8DuaGwexXS6" },
  { orderIndex: 69, name: "SARI NURHIDAYATI, S.Pd.", nip: "198209202024212008", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/RinuqtFA6SvqSL1k8" },
  { orderIndex: 70, name: "SUWOYO, S.Kom", nip: "198403072024211011", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/NmaYT6ANim76pNy46" },
  { orderIndex: 71, name: "AAN SUSANTO, S.Pd.", nip: "198410082024211016", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/2jd7m3sU49ECFWps7" },
  { orderIndex: 72, name: "YUNITA DWI WIRANTI, S.Pd", nip: "198606052024212013", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/pcpQzaMSk9Stp7cg7" },
  { orderIndex: 73, name: "NUR FAUZIYAH, S.Ag.", nip: "197411202025212006", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/QFV7LBCezjEd89jM8" },
  { orderIndex: 74, name: "SUYANTI, S.Kom.", nip: "198206012025212027", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/fgP9YYo9hxHuTtXj6" },
  { orderIndex: 75, name: "DELIA NURUL AFIFAH, S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/DyU5ZXtraYh9wYc29" },
  { orderIndex: 76, name: "CAHYA ISKANDAR, S.T", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/8KWy3ThrXyDPFYky6" },
  { orderIndex: 77, name: "EVY KUSHARDIANY, S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/5VYu1RujWovmBBU3A" },
  { orderIndex: 78, name: "HUDAN RHARA ANGGRIADI, S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/EQA5C4ZDb5KDbYm66" },
  { orderIndex: 79, name: "YUNIAR DWI LISTYANTO, ST", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/WXzam8yR3fYQFFGPA" },
  { orderIndex: 80, name: "BENY WIJAYANTO, SS", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/2d2erB3kRKMkYt7U7" },
  { orderIndex: 81, name: "NURUL JAMILAH, S.Hum.", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/wsT14LzF1YIGLA4f6" },
  { orderIndex: 82, name: "ENDANG MULYANI, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/Auiix31BCC39d3827" },
  { orderIndex: 83, name: "AGUS IRIANTO, S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/9ox7839w57zhmph37" },
  { orderIndex: 84, name: "SAMUJI, S.Ag", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/xaxakR9EjF5QRACyv8" },
  { orderIndex: 85, name: "IKA UMAYA MARDIANA, S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/FdBUf1m2wrFUJUXW7" },
  { orderIndex: 86, name: "NUR KHOLIFAH, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/Ps6RZKhprMF7norc8" },
  { orderIndex: 87, name: "AIDA QONITATILLAH, S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/iTp6ejZeufb9GjdD6" },
  { orderIndex: 88, name: "YULI ANDRIYANI,  S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/zNoEfcKBWk4cLrSw6" },
  { orderIndex: 89, name: "VITA EKA RAHAYU, S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/w4dULz23fLn5t2FS6" },
  { orderIndex: 90, name: "AKHMAD VICKRI HIDAYATULLAH, S.Pd", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/6TgNh6sxM84WUHKe9" },
  { orderIndex: 91, name: "HERI SUGIANTORO, S.Ag", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/FP6TDKV278Clj95X7" },
  { orderIndex: 92, name: "AKBAR ILHAM BAGASKARA PRATAMA, S.T", nip: "-", class: "-", role: "Guru Pengajar", journalFormUrl: "https://forms.gle/ECwx7SMeMMkf7RfN6" }
];

const AUTHORIZED_ADMIN_EMAILS = [
  "iskakfatoni@gmail.com"
];

let teachersData = [...INITIAL_TEACHERS];

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadSavedTeachers();
  initLoginTabs();
  initTeacherLogin();
  initAdminLogin();
  initFirebaseLogin();

  // Auto-redirect jika sudah ada sesi NIP tersimpan
  checkExistingSession();
});

// 1. Theme Management (Auto System Detection + Manual Override)
function getPreferredTheme() {
  const saved = localStorage.getItem('portal_theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  // Auto detect dari pengaturan HP/OS pengguna
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  }
}

function initTheme() {
  applyTheme(getPreferredTheme());

  // Listener perubahan tema HP secara real-time
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('portal_theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('portal_theme', newTheme);
    });
  }
}

// 2. Load Real-Time Teachers from Cloud Firestore / Memory
async function loadSavedTeachers() {
  localStorage.removeItem('portal_teachers_data');
  teachersData = [...INITIAL_TEACHERS];

  try {
    const { isFirebaseActive: active } = initFirebase();
    if (active && db) {
      const snapshot = await getDocs(collection(db, "teachers"));
      if (!snapshot.empty) {
        const fetched = [];
        snapshot.forEach(doc => fetched.push(doc.data()));
        teachersData = fetched;
      }
    }
  } catch (e) {
    console.warn("Firestore fetch error di halaman login:", e);
  }
}

// 3. Check Existing Active Session
function checkExistingSession() {
  const params = new URLSearchParams(window.location.search);
  const nipParam = params.get('nip');
  const adminParam = params.get('admin');

  if (nipParam) {
    const cleanNip = nipParam.replace(/[\s\.\-]+/g, '');
    const found = teachersData.find(t => t.nip && t.nip.replace(/[\s\.\-]+/g, '') === cleanNip);
    if (found) {
      localStorage.setItem('portal_logged_nip', found.nip);
      window.location.href = `asset/pages/portal.html?nip=${encodeURIComponent(cleanNip)}`;
      return;
    }
  }

  if (adminParam === 'true') {
    window.location.href = `asset/pages/portal.html?admin=true`;
    return;
  }

  const savedNip = localStorage.getItem('portal_logged_nip');
  if (savedNip && savedNip !== '-') {
    const cleanNip = savedNip.replace(/[\s\.\-]+/g, '');
    const found = teachersData.find(t => t.nip && t.nip.replace(/[\s\.\-]+/g, '') === cleanNip);
    if (found) {
      window.location.href = `asset/pages/portal.html?nip=${encodeURIComponent(cleanNip)}`;
    }
  }
}

// 4. Tab Switcher (Guru vs Admin)
function initLoginTabs() {
  const tabBtns = document.querySelectorAll('.auth-tab-btn');
  const tabPanes = document.querySelectorAll('.auth-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// 5. Guru NIP Login
function initTeacherLogin() {
  const form = document.getElementById('form-landing-nip');
  const inputNip = document.getElementById('landing-nip-input');
  const errorMsg = document.getElementById('landing-nip-error');

  if (!form || !inputNip) return;

  const handleNipSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const rawVal = inputNip.value || '';
    const cleanVal = rawVal.trim().replace(/[\s\.\-]+/g, '');

    if (!cleanVal) {
      showError(errorMsg, 'Silakan masukkan NIP Anda.');
      inputNip.focus();
      return;
    }

    // 1. Cari NIP
    let found = teachersData.find(t => {
      if (!t.nip || t.nip === '-') return false;
      return String(t.nip).trim().replace(/[\s\.\-]+/g, '') === cleanVal;
    });

    // 2. Fallback pencarian nama
    if (!found && rawVal.trim().length >= 3) {
      const searchName = rawVal.trim().toLowerCase();
      found = teachersData.find(t => t.name.toLowerCase().includes(searchName) && t.nip && t.nip !== '-');
    }

    if (found) {
      hideError(errorMsg);
      localStorage.setItem('portal_logged_nip', found.nip);
      const cleanTeacherNip = String(found.nip).trim().replace(/[\s\.\-]+/g, '');
      window.location.href = `asset/pages/portal.html?nip=${encodeURIComponent(cleanTeacherNip)}`;
    } else {
      showError(errorMsg, `NIP <strong>${rawVal}</strong> tidak ditemukan di database guru.`);
      inputNip.focus();
    }
  };

  form.addEventListener('submit', handleNipSubmit);
}

// 6. Admin Email/Password Login
function initAdminLogin() {
  const form = document.getElementById('admin-login-form');
  const emailInput = document.getElementById('admin-login-email');
  const passInput = document.getElementById('admin-login-password');
  const errorMsg = document.getElementById('admin-login-error');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!isAuthorizedAdminEmail(email)) {
      showError(errorMsg, 'Akun ini bukan Administrator yang berwenang.');
      return;
    }

    try {
      if (isFirebaseActive && auth) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Mode Demo Offline
        sessionStorage.setItem('portal_demo_admin', email);
      }
      window.location.href = `asset/pages/portal.html?admin=true`;
    } catch (err) {
      showError(errorMsg, `Gagal login: ${err.message || 'Periksa email dan password Anda.'}`);
    }
  });
}

// 7. Admin Google Login
function initFirebaseLogin() {
  const btnGoogle = document.getElementById('btn-login-google');
  const errorMsg = document.getElementById('admin-login-error');

  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      const { isFirebaseActive: active } = initFirebase();
      if (!active || !auth || !googleProvider) {
        // Demo Fallback
        sessionStorage.setItem('portal_demo_admin', 'iskakfatoni@gmail.com');
        window.location.href = `asset/pages/portal.html?admin=true`;
        return;
      }

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        if (user && isAuthorizedAdminEmail(user.email)) {
          window.location.href = `asset/pages/portal.html?admin=true`;
        } else {
          showError(errorMsg, `Email ${user.email} bukan Administrator terdaftar.`);
        }
      } catch (error) {
        showError(errorMsg, `Login Google Gagal: ${error.message}`);
      }
    });
  }
}

function isAuthorizedAdminEmail(email) {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === String(email).trim().toLowerCase());
}

function showError(el, htmlMsg) {
  if (el) {
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${htmlMsg}`;
    el.classList.remove('hidden');
  }
}

function hideError(el) {
  if (el) el.classList.add('hidden');
}
