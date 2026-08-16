/**
 * PORTAL:AutoForm - Multi-User Cloud Application
 * Integrasi Firebase Auth, Cloud Firestore, Personal URL Routing (?nip=...), dan Import/Export Engine
 */

import {
  initFirebase,
  auth,
  db,
  googleProvider,
  isFirebaseActive,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from './firebase-config.js';

/// Master Data Awal (Urutan Resmi Sesuai Database / Google Form Sekolah)
const MASTER_TEACHER_NAMES_ORDER = [
  "HERMAWANTO, S.Pd., M.Psi",
  "NURUL HIDAYATI, S.Pd., M.Psi",
  "Drs. MOEHAIMIN",
  "NUR HAYATI, S.Psi, M.Pd.",
  "ARSYL NOVA ARIRI, ST, M.Pd.",
  "EKA PRAMITASARI, S.Pd. M.Pd.",
  "DWI RETNO TUGAS ERNAWATI, S.Pd",
  "DHURROTUL FARIDAH, S.Pd",
  "MISBAHUR ROSYIDIN, S.Pd.",
  "Dra. DYAH CHUSNUL CHOTIMAH",
  "KASIATIN, S.Pd",
  "MUNASRI, S.Pd.",
  "NURUL HUDA, ST, M.Si.",
  "SRI WINARTI, S.Pd",
  "SUHARTO DWI SUHERNOWO, ST",
  "DWI SANTOSO, S.Pd",
  "AGUS HARIYANTO, ST. M.Pd",
  "LAILA FITRIYA, S.Pd.I",
  "WAWAN SISWANTO, SS",
  "R.A. RATNA KARTIKAWATI, S.Pd",
  "AGUS HIDAYAT, S.Pd",
  "HERI SUBYANTORO, ST, M.Pd.",
  "NUR 'AFIIFAH, M.Pd.",
  "SAMSUL HADI, M.Pd.",
  "TRIBUDI HARTONO, S.Pd",
  "HISBULLOH HUDA, M.Pd.",
  "DEDY HENDRIANA, S.Pd. M.Pd.",
  "HARTONO, S.Pd",
  "MOHAMAD ARIEF PRIYO UTOMO, S.Pd",
  "ZAINUL ARIFIN, M.Pd.",
  "BAMBANG SUJATMIKO, S.Pd",
  "Dr. RIRIN DIYANNITA SASANTI, M.Pd.",
  "SIGIT EKO PRAMONO, S.Pd",
  "AGUNG RAKHMANDA, S.Kom.",
  "SULIADI, S.Pd",
  "TUTIK QOMARIYAH, S.Si",
  "IMAM SUFERI, ST.",
  "FIRMAN ARDIANSYAH, S.Pd.",
  "AZIZ CAHYA PRADANA, S.Pd.",
  "WAHYU ROFIUL AMIN, S.Pd.",
  "EFRIDA ISBANDRIYAH, S.T.",
  "ROHMA EKA INDRI AHADIAH, S.Pd, Gr",
  "SOTYA BAYUNTARA, S.Pd.",
  "SRIGATI, SE",
  "HARI PURWANTO, ST",
  "ESTI WIDHIARNI, S.T",
  "MUCHAMAD ISKAK FATONI, S.Pd.",
  "EKO FAJAR KURNIAWAN, S.Pd",
  "ETIK SULISTYOWATI, S.Pd.",
  "NOVAN EKO SETYAWAN, S.Kom.",
  "YAYUK NURNANINGSIH, S.Pd",
  "KHOIRUL AMIN, S.Pd",
  "REZA ZULKARNAIN ARIFIN, S.Pd.",
  "KHOIRUZEN, ST",
  "HEPPY LUCKITO, SST",
  "SRI PURWANINGSIH, S.Pd",
  "DARIS UMAMI, S.Pd.",
  "AKHMAD ROFI SAFUAT, S.Pd.",
  "SIDHARTHA BUDI SUMEDHA, S.Pd",
  "ASYITAH  ALMUFIDAH, S.Pd",
  "SUDARMONO, ST",
  "ROHMAN, S.T.",
  "ANDRI YUDHI PRASETYO, ST",
  "MIANTO, S.Kom.",
  "HARIS ALI MUHYIDIN, S.T",
  "MAMIEK ZUHRIYAH. S.Hum",
  "UMI RU'YATIN, S.Pd",
  "YEFI WULANDARI, SE",
  "SARI NURHIDAYATI, S.Pd.",
  "SUWOYO, S.Kom",
  "AAN SUSANTO, S.Pd.",
  "YUNITA DWI WIRANTI, S.Pd",
  "NUR FAUZIYAH, S.Ag.",
  "SUYANTI, S.Kom.",
  "DELIA NURUL AFIFAH, S.Pd",
  "CAHYA ISKANDAR, S.T",
  "EVY KUSHARDIANY, S.Pd",
  "HUDAN RHARA ANGGRIADI, S.Pd",
  "YUNIAR DWI LISTYANTO, ST",
  "BENY WIJAYANTO, SS",
  "NURUL JAMILAH, S.Hum.",
  "ENDANG MULYANI, S.Pd.",
  "AGUS IRIANTO, S.Pd",
  "SAMUJI, S.Ag",
  "IKA UMAYA MARDIANA, S.Pd",
  "NUR KHOLIFAH, S.Pd.",
  "AIDA QONITATILLAH, S.Pd",
  "YULI ANDRIYANI,  S.Pd",
  "VITA EKA RAHAYU, S.Pd",
  "AKHMAD VICKRI HIDAYATULLAH, S.Pd",
  "HERI SUGIANTORO, S.Ag",
  "AKBAR ILHAM BAGASKARA PRATAMA, S.T"
];

// Master Data Awal (92 Guru Terurut Rapi)
const INITIAL_TEACHERS = MASTER_TEACHER_NAMES_ORDER.map((name, idx) => {
  if (name === "MUCHAMAD ISKAK FATONI, S.Pd.") {
    return {
      orderIndex: idx + 1,
      name: "MUCHAMAD ISKAK FATONI, S.Pd.",
      nip: "198109092022211004",
      class: "XII TEI 2",
      role: "Walikelas",
      journalFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform"
    };
  }

  // Walikelas mapping bawaan
  const walikelasMap = {
    "HERMAWANTO, S.Pd., M.Psi": "X TAV",
    "NURUL HIDAYATI, S.Pd., M.Psi": "X TEI 1",
    "Drs. MOEHAIMIN": "X TEI 2",
    "DHURROTUL FARIDAH, S.Pd": "X TPL 1",
    "SRI WINARTI, S.Pd": "X TPL 2",
    "MUNASRI, S.Pd.": "X TPM 1",
    "NUR HAYATI, S.Psi, M.Pd.": "X TPM 2",
    "DWI RETNO TUGAS ERNAWATI, S.Pd": "X TKR1",
    "KASIATIN, S.Pd": "X TKR2",
    "SUHARTO DWI SUHERNOWO, ST": "X TBKR",
    "ARSYL NOVA ARIRI, ST, M.Pd.": "X TSM 1",
    "LAILA FITRIYA, S.Pd.I": "X TSM 2",
    "EKA PRAMITASARI, S.Pd. M.Pd.": "X DKV 1",
    "MISBAHUR ROSYIDIN, S.Pd.": "X DKV 2",
    "Dra. DYAH CHUSNUL CHOTIMAH": "X DKV 3",
    "WAWAN SISWANTO, SS": "XI TAV",
    "R.A. RATNA KARTIKAWATI, S.Pd": "XI TEI 1",
    "HERI SUBYANTORO, ST, M.Pd.": "XI TEI 2",
    "NURUL HUDA, ST, M.Si.": "XI TPL 1",
    "NUR 'AFIIFAH, M.Pd.": "XI TPL 2",
    "TRIBUDI HARTONO, S.Pd": "XI TPM 1",
    "DEDY HENDRIANA, S.Pd. M.Pd.": "XI TPM 2",
    "AGUS HIDAYAT, S.Pd": "XI TKR1",
    "SAMSUL HADI, M.Pd.": "XI TKR2",
    "HISBULLOH HUDA, M.Pd.": "XI TBKR",
    "DWI SANTOSO, S.Pd": "XI TSM 1",
    "AGUS HARIYANTO, ST. M.Pd": "XI TSM 2",
    "ZAINUL ARIFIN, M.Pd.": "XI DKV 1",
    "BAMBANG SUJATMIKO, S.Pd": "XI DKV 2",
    "HARTONO, S.Pd": "XI DKV 3",
    "SIGIT EKO PRAMONO, S.Pd": "XII TAV",
    "AGUNG RAKHMANDA, S.Kom.": "XII TEI 1",
    "MOHAMAD ARIEF PRIYO UTOMO, S.Pd": "XII TPL 1",
    "Dr. RIRIN DIYANNITA SASANTI, M.Pd.": "XII TPL 2",
    "SULIADI, S.Pd": "XII TPM 1",
    "TUTIK QOMARIYAH, S.Si": "XII TPM 2",
    "IMAM SUFERI, ST.": "XII TKR1",
    "FIRMAN ARDIANSYAH, S.Pd.": "XII TKR2",
    "AZIZ CAHYA PRADANA, S.Pd.": "XII TBKR",
    "WAHYU ROFIUL AMIN, S.Pd.": "XII TSM 1",
    "ROHMA EKA INDRI AHADIAH, S.Pd, Gr": "XII TSM 2",
    "EFRIDA ISBANDRIYAH, S.T.": "XII DKV 1",
    "SOTYA BAYUNTARA, S.Pd.": "XII DKV 2",
    "SRIGATI, SE": "XII DKV 3"
  };

  const assignedClass = walikelasMap[name] || "-";
  const role = assignedClass !== "-" ? "Walikelas" : "Guru Pengajar";

  return {
    orderIndex: idx + 1,
    name,
    nip: "-",
    class: assignedClass,
    role,
    journalFormUrl: ""
  };
});

// Master Data Kelas
const ALL_CLASSES = [
  "X TAV", "X TEI 1", "X TEI 2", "X TPL 1", "X TPL 2", "X TPM 1", "X TPM 2", "X TKR1", "X TKR2", "X TBKR", "X TSM 1", "X TSM 2", "X DKV 1", "X DKV 2", "X DKV 3",
  "XI TAV", "XI TEI 1", "XI TEI 2", "XI TPL 1", "XI TPL 2", "XI TPM 1", "XI TPM 2", "XI TKR1", "XI TKR2", "XI TBKR", "XI TSM 1", "XI TSM 2", "XI DKV 1", "XI DKV 2", "XI DKV 3",
  "XII TAV", "XII TEI 1", "XII TEI 2", "XII TPL 1", "XII TPL 2", "XII TPM 1", "XII TPM 2", "XII TKR1", "XII TKR2", "XII TBKR", "XII TSM 1", "XII TSM 2", "XII DKV 1", "XII DKV 2", "XII DKV 3",
  "-"
];

// Master Data 5 Jenis Formulir
const INITIAL_FORMS = [
  {
    id: "pengumpulan_bulanan_walikelas",
    name: "Laporan Bulanan Walikelas",
    category: "Walikelas",
    icon: "fa-solid fa-folder-open",
    description: "Pengumpulan rutin berkas administrasi dan laporan bulanan walikelas (Auto-fill: Nama Guru & NIP).",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryKelas: "",
    isActive: true,
    statusBadge: "Aktif & Terhubung"
  },
  {
    id: "form_absensi_guru",
    name: "Form Absen Mengajar",
    category: "Presensi",
    icon: "fa-solid fa-clipboard-user",
    description: "Presensi dan laporan kegiatan mengajar harian (Auto-fill: Nama Guru & NIP).",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfrm87oC00zamhQQBP4LS5BcwxSHa97M9plvLpYUHQ7dR-ybQ/viewform",
    entryGuru: "entry.691754896",
    entryNip: "entry.65154558",
    entryKelas: "entry.666017338",
    isActive: true,
    statusBadge: "Aktif & Terhubung"
  },
  {
    id: "form_jurnal_mengajar",
    name: "Form Jurnal Mengajar",
    category: "Akademik",
    icon: "fa-solid fa-book-open-reader",
    description: "Jurnal agenda kegiatan mengajar harian, materi pembelajaran, dan catatan kelas.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryKelas: "entry.591543822",
    isActive: true,
    statusBadge: "Spesifik Guru"
  },
  {
    id: "form_absensi_piket",
    name: "Form Absensi & Laporan Piket",
    category: "Piket",
    icon: "fa-solid fa-shield-halved",
    description: "Laporan catatan ketertiban dan presensi tugas piket guru harian.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryKelas: "entry.591543822",
    isActive: true,
    statusBadge: "Auto-Fill Siap"
  },
  {
    id: "form_guru_wali",
    name: "Laporan Bulanan Guru Wali",
    category: "Guru Wali",
    icon: "fa-solid fa-hands-holding-child",
    description: "Pengumpulan rutin berkas administrasi dan laporan bulanan guru wali (Auto-fill: Nama & NIP).",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeVYQG1tPodad-cUyHW5Mzx3CmO3L8GOx8AzWXajJqYkqbkBg/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryKelas: "",
    isActive: true,
    statusBadge: "Aktif & Terhubung"
  }
];

// State Aplikasi
let currentTeachers = [...INITIAL_TEACHERS];
let currentForms = [...INITIAL_FORMS];
let activeTeacher = {
  name: "MUCHAMAD ISKAK FATONI, S.Pd.",
  nip: "198109092022211004",
  class: "XII TEI 2",
  role: "Walikelas",
  journalFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform"
};
let currentUser = null;
const ADMIN_EMAIL = "iskakfatoni@gmail.com";

// Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNavigation();
  initModals();
  initLiveClock();
  initImportExport();
  
  // Setup dropdown kelas di modal
  populateClassDropdowns();

  // Load dataset lokal tersimpan (jika ada)
  loadLocalState();

  // Inisialisasi Firebase & Auth Listener
  setupFirebaseConnection();

  // Setup Portal Guru
  setupUserPortal();

  // Setup Form Builder
  setupFormBuilder();

  // Check URL Query Parameter (?nip=... atau ?guru=...)
  checkUrlParamsForTeacher();
});

/* ==========================================================================
   1. URL Routing Khusus per Guru (?nip=... atau ?guru=...)
   ========================================================================== */

function checkUrlParamsForTeacher() {
  const params = new URLSearchParams(window.location.search);
  const nipParam = params.get('nip');
  const guruParam = params.get('guru');

  if (nipParam && nipParam !== '-') {
    const found = currentTeachers.find(t => t.nip === nipParam);
    if (found) {
      setActiveTeacher(found, false);
      showToast(`Link personal aktif untuk: ${found.name}`);
      return;
    }
  }

  if (guruParam) {
    const found = currentTeachers.find(t => t.name.toLowerCase() === guruParam.toLowerCase());
    if (found) {
      setActiveTeacher(found, false);
      showToast(`Link personal aktif untuk: ${found.name}`);
      return;
    }
  }
}

function getPersonalPortalUrl(teacher) {
  const base = window.location.origin + window.location.pathname;
  if (teacher.nip && teacher.nip !== '-') {
    return `${base}?nip=${encodeURIComponent(teacher.nip)}`;
  }
  return `${base}?guru=${encodeURIComponent(teacher.name)}`;
}

/* ==========================================================================
   2. Inisialisasi Firebase & State Management
   ========================================================================== */

function setupFirebaseConnection() {
  const { isFirebaseActive: active } = initFirebase();
  const cloudBadgeDot = document.getElementById('cloud-status-dot');
  const cloudBadgeText = document.getElementById('cloud-status-text');
  const statDbStatus = document.getElementById('stat-db-status');

  if (active && auth) {
    cloudBadgeDot.classList.add('online');
    cloudBadgeText.textContent = "Firebase Online";
    if (statDbStatus) statDbStatus.textContent = "Firebase Cloud";

    // Listener Auth Firebase
    onAuthStateChanged(auth, (user) => {
      if (user) {
        handleAdminLoginState(user.email, user.displayName);
      } else {
        handleAdminLogoutState();
      }
    });

    // Ambil data Firestore
    fetchFirestoreData();
  } else {
    cloudBadgeDot.classList.remove('online');
    cloudBadgeText.textContent = "Mode Demo Lokal";
    if (statDbStatus) statDbStatus.textContent = "Lokal (Offline)";

    // Cek demo session di sessionStorage
    const demoAdmin = sessionStorage.getItem('portal_demo_admin');
    if (demoAdmin) {
      handleAdminLoginState(demoAdmin, "Administrator");
    } else {
      handleAdminLogoutState();
    }

    renderUserPortal();
    renderAdminTables();
  }
}

async function fetchFirestoreData() {
  if (!db) return;
  try {
    // 1. Fetch Teachers
    const teachersSnapshot = await getDocs(collection(db, "teachers"));
    if (!teachersSnapshot.empty) {
      const fetched = [];
      teachersSnapshot.forEach(doc => {
        fetched.push(doc.data());
      });
      currentTeachers = fetched;
      saveLocalTeachers();
    }

    // 2. Fetch Forms
    const formsSnapshot = await getDocs(collection(db, "forms"));
    if (!formsSnapshot.empty) {
      const fetchedForms = [];
      formsSnapshot.forEach(doc => {
        fetchedForms.push({ id: doc.id, ...doc.data() });
      });
      currentForms = fetchedForms;
      saveLocalForms();
    }

    // Re-check URL parameter after fetching cloud data
    checkUrlParamsForTeacher();

    renderUserPortal();
    renderAdminTables();
  } catch (error) {
    console.warn("Gagal memuat data dari Firestore:", error);
  }
}

function loadLocalState() {
  const savedTeachers = localStorage.getItem('portal_teachers_data');
  if (savedTeachers) {
    try { currentTeachers = JSON.parse(savedTeachers); } catch (e) {}
  }
  const savedForms = localStorage.getItem('portal_forms_data');
  if (savedForms) {
    try { currentForms = JSON.parse(savedForms); } catch (e) {}
  }
}

function saveLocalTeachers() {
  localStorage.setItem('portal_teachers_data', JSON.stringify(currentTeachers));
}

function saveLocalForms() {
  localStorage.setItem('portal_forms_data', JSON.stringify(currentForms));
}

/* ==========================================================================
   3. Auth & Admin Roles
   ========================================================================== */

function handleAdminLoginState(email, displayName) {
  currentUser = { email, displayName };
  const isAdmin = Boolean(email);

  const authBtn = document.getElementById('btn-show-login-modal');
  const userProfile = document.getElementById('admin-user-profile');
  const emailDisplay = document.getElementById('admin-user-email');
  const adminLockIcon = document.getElementById('admin-lock-icon');

  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (authBtn) authBtn.classList.add('hidden');
  if (userProfile) userProfile.classList.remove('hidden');
  if (emailDisplay) emailDisplay.textContent = email || "Admin";

  if (isAdmin) {
    if (adminLockIcon) adminLockIcon.innerHTML = `<i class="fa-solid fa-unlock text-green"></i>`;
    if (adminLockedView) adminLockedView.classList.add('hidden');
    if (adminDashboardView) adminDashboardView.classList.remove('hidden');
    renderAdminTables();
    showToast(`Selamat datang Admin (${email})!`);
  }
}

function handleAdminLogoutState() {
  currentUser = null;
  sessionStorage.removeItem('portal_demo_admin');

  const authBtn = document.getElementById('btn-show-login-modal');
  const userProfile = document.getElementById('admin-user-profile');
  const adminLockIcon = document.getElementById('admin-lock-icon');
  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (authBtn) authBtn.classList.remove('hidden');
  if (userProfile) userProfile.classList.add('hidden');
  if (adminLockIcon) adminLockIcon.innerHTML = `<i class="fa-solid fa-lock"></i>`;
  if (adminLockedView) adminLockedView.classList.remove('hidden');
  if (adminDashboardView) adminDashboardView.classList.add('hidden');
}

/* ==========================================================================
   4. Portal Guru (Pencarian NIP & Render Formulir)
   ========================================================================== */

function setupUserPortal() {
  const searchInput = document.getElementById('portal-nip-search');
  const guruSelect = document.getElementById('portal-guru-select');
  const suggestionsBox = document.getElementById('search-suggestions');
  const btnCopyPortalUrl = document.getElementById('btn-copy-personal-portal-url');
  const btnQuickMyProfile = document.getElementById('btn-quick-my-profile');

  // Quick switch "Profil Saya" in header
  if (btnQuickMyProfile) {
    btnQuickMyProfile.addEventListener('click', () => {
      const myProfile = currentTeachers.find(t => t.name.includes("MUCHAMAD ISKAK FATONI")) || {
        name: "MUCHAMAD ISKAK FATONI, S.Pd.",
        nip: "198109092022211004",
        class: "XII TEI 2",
        role: "Walikelas"
      };
      setActiveTeacher(myProfile);
      
      // Switch to tab user portal
      document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-target="tab-user-portal"]').classList.add('active');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'tab-user-portal'));
    });
  }

  // Copy personal portal URL button
  if (btnCopyPortalUrl) {
    btnCopyPortalUrl.addEventListener('click', () => {
      const link = getPersonalPortalUrl(activeTeacher);
      copyToClipboard(link);
      showToast(`Link personal untuk ${activeTeacher.name} disalin!`);
    });
  }

  // Populate select dropdown
  populateGuruSelect(guruSelect);

  // Event Change Guru Select
  guruSelect.addEventListener('change', () => {
    const selectedName = guruSelect.value;
    if (!selectedName) return;
    const found = currentTeachers.find(t => t.name === selectedName);
    if (found) {
      setActiveTeacher(found);
    }
  });

  // Autocomplete search
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      suggestionsBox.classList.add('hidden');
      return;
    }

    const matches = currentTeachers.filter(t => 
      t.name.toLowerCase().includes(query) || (t.nip && t.nip.includes(query))
    );

    if (matches.length === 0) {
      suggestionsBox.innerHTML = `<div class="suggestion-item"><span class="suggestion-meta">Tidak ada guru ditemukan</span></div>`;
    } else {
      suggestionsBox.innerHTML = matches.slice(0, 8).map(t => `
        <div class="suggestion-item" data-name="${t.name}">
          <div>
            <div class="suggestion-name">${t.name}</div>
            <div class="suggestion-meta">NIP: ${t.nip || '-'} &bull; Kelas: ${t.class || '-'}</div>
          </div>
          <i class="fa-solid fa-chevron-right" style="font-size:0.75rem;opacity:0.6;"></i>
        </div>
      `).join('');

      suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const name = item.getAttribute('data-name');
          const found = currentTeachers.find(t => t.name === name);
          if (found) {
            setActiveTeacher(found);
            searchInput.value = '';
            suggestionsBox.classList.add('hidden');
          }
        });
      });
    }
    suggestionsBox.classList.remove('hidden');
  });

  // Close suggestions if click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-field-box')) {
      suggestionsBox.classList.add('hidden');
    }
  });

  // Quick preset pills
  document.querySelectorAll('.quick-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const nip = pill.getAttribute('data-nip');
      const name = pill.getAttribute('data-name');
      const cls = pill.getAttribute('data-class');
      const found = currentTeachers.find(t => t.nip === nip) || { name, nip, class: cls, role: "Walikelas" };
      setActiveTeacher(found);

      document.querySelectorAll('.quick-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  renderUserPortal();
}

function setActiveTeacher(teacher, updateUrl = true) {
  activeTeacher = teacher;
  
  // Update banner
  document.getElementById('active-teacher-name').textContent = teacher.name;
  document.getElementById('active-teacher-nip').textContent = teacher.nip || '-';
  document.getElementById('active-teacher-class').textContent = teacher.class || '-';
  document.getElementById('active-teacher-role').textContent = teacher.role || 'Guru';

  // Sync select dropdown if exists
  const select = document.getElementById('portal-guru-select');
  if (select) select.value = teacher.name;

  renderUserPortal();
}

function populateGuruSelect(selectElem) {
  if (!selectElem) return;
  selectElem.innerHTML = '<option value="">-- Pilih Guru --</option>';
  currentTeachers.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.name;
    opt.textContent = `${t.name} (${t.nip !== '-' ? t.nip : t.class})`;
    selectElem.appendChild(opt);
  });
}

function generateFormUrlForTeacher(form, teacher) {
  // Jika form adalah Jurnal Mengajar pribadi guru
  if (form.id === "form_jurnal_mengajar") {
    if (teacher.journalFormUrl) {
      return teacher.journalFormUrl;
    }
  }

  const params = new URLSearchParams();
  params.set('usp', 'pp_url');
  if (form.entryGuru && teacher.name) params.set(form.entryGuru, teacher.name);
  if (form.entryNip && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);
  if (form.entryKelas && teacher.class && teacher.class !== '-') {
    let classVal = teacher.class;
    // Format khusus Absen Mengajar jika menggunakan spasi ganda (misal "XII  TEI 2")
    if (form.id === "form_absensi_guru" && classVal.includes("XII ")) {
      classVal = classVal.replace("XII ", "XII  ");
    } else if (form.id === "form_absensi_guru" && classVal.includes("XI ")) {
      classVal = classVal.replace("XI ", "XI  ");
    } else if (form.id === "form_absensi_guru" && classVal.includes("X ")) {
      classVal = classVal.replace("X ", "X  ");
    }
    params.set(form.entryKelas, classVal);
  }
  return `${form.baseUrl}?${params.toString()}`;
}

function renderUserPortal() {
  const container = document.getElementById('portal-forms-grid');
  const countBadge = document.getElementById('active-forms-count');
  if (!container) return;

  const activeForms = currentForms.filter(f => f.isActive !== false);
  if (countBadge) countBadge.textContent = `${activeForms.length} Formulir Aktif`;

  if (activeForms.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Belum ada formulir aktif yang tersedia.</p></div>`;
    return;
  }

  container.innerHTML = activeForms.map(form => {
    const generatedUrl = generateFormUrlForTeacher(form, activeTeacher);
    const formIcon = form.icon || "fa-solid fa-file-signature";
    
    let statusBadge = form.statusBadge || "Auto-Fill Siap";
    let customDesc = form.description || 'Laporan administrasi berkala.';

    if (form.id === "form_jurnal_mengajar") {
      if (activeTeacher.journalFormUrl) {
        statusBadge = "Jurnal Pribadi Aktif";
        customDesc = `Formulir jurnal mengajar harian khusus milik <strong>${activeTeacher.name}</strong>.`;
      } else {
        statusBadge = "Belum Ada Link";
        customDesc = "Link jurnal khusus guru ini belum ditambahkan oleh Admin.";
      }
    }

    return `
      <article class="form-card">
        <div class="card-top">
          <div class="card-icon-box">
            <i class="${formIcon}"></i>
          </div>
          <div class="card-tags">
            <span class="pill-badge pill-auto"><i class="fa-solid fa-check-double"></i> ${statusBadge}</span>
            <span class="pill-badge pill-role">${form.category || 'Formulir'}</span>
          </div>
        </div>

        <div class="card-body">
          <h4 class="card-title">${form.name}</h4>
          <p class="card-desc">${customDesc}</p>

          <div class="data-preview-box">
            <div class="data-preview-title">
              <i class="fa-solid fa-circle-info"></i> Data Terhubung:
            </div>
            <ul class="data-items-list">
              <li>
                <span class="label">Nama Guru</span>
                <span class="value">${activeTeacher.name}</span>
              </li>
              <li>
                <span class="label">NIP</span>
                <span class="value font-mono">${activeTeacher.nip || '-'}</span>
              </li>
              <li>
                <span class="label">Kelas</span>
                <span class="value highlight-val">${activeTeacher.class || '-'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="card-footer">
          <a href="${generatedUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Google Form
          </a>
          <button class="btn btn-secondary btn-copy-card" data-url="${generatedUrl}" title="Salin Tautan Form">
            <i class="fa-solid fa-copy"></i> Salin Link
          </button>
        </div>
      </article>
    `;
  }).join('');

  // Attach copy events to card buttons
  container.querySelectorAll('.btn-copy-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) copyToClipboard(url);
    });
  });
}

/* ==========================================================================
   5. Admin Panel & CRUD
   ========================================================================== */

function renderAdminTables() {
  const statTeachers = document.getElementById('stat-total-teachers');
  const statForms = document.getElementById('stat-total-forms');
  if (statTeachers) statTeachers.textContent = currentTeachers.length;
  if (statForms) statForms.textContent = currentForms.length;

  renderTeachersTable();
  renderFormsTable();
}

function renderTeachersTable(filterQuery = '') {
  const tbody = document.getElementById('teachers-table-body');
  if (!tbody) return;

  let sorted = sortTeachersByMasterOrder(currentTeachers);
  let filtered = sorted;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = sorted.filter(t => t.name.toLowerCase().includes(q) || (t.nip && t.nip.includes(q)));
  }

  tbody.innerHTML = filtered.map((t, idx) => {
    const personalLink = getPersonalPortalUrl(t);
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${t.name}</strong></td>
        <td class="font-mono">${t.nip || '-'}</td>
        <td><span class="badge-class">${t.class || '-'}</span></td>
        <td>${t.role || 'Guru'}</td>
        <td>
          <button class="btn btn-secondary btn-sm btn-copy-teacher-link" data-url="${personalLink}" title="Salin Link Personal Portal Guru">
            <i class="fa-solid fa-link"></i> Salin Link
          </button>
        </td>
        <td>
          <div class="action-btns-row">
            <button class="btn-icon-action btn-edit-teacher" data-name="${t.name}" title="Edit Data">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icon-action btn-del btn-del-teacher" data-name="${t.name}" title="Hapus Guru">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach copy teacher personal link
  tbody.querySelectorAll('.btn-copy-teacher-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        copyToClipboard(url);
        showToast('Link personal guru berhasil disalin!');
      }
    });
  });

  // Attach Edit & Delete Teacher handlers
  tbody.querySelectorAll('.btn-edit-teacher').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const teacher = currentTeachers.find(t => t.name === name);
      if (teacher) openTeacherModal(teacher);
    });
  });

  tbody.querySelectorAll('.btn-del-teacher').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-name');
      if (confirm(`Yakin ingin menghapus data guru "${name}"?`)) {
        await deleteTeacherHandler(name);
      }
    });
  });
}

function renderFormsTable() {
  const tbody = document.getElementById('forms-table-body');
  if (!tbody) return;

  tbody.innerHTML = currentForms.map((f) => `
    <tr>
      <td><strong>${f.name}</strong></td>
      <td>${f.category || 'Umum'}</td>
      <td class="font-mono">${f.entryGuru || '-'}</td>
      <td class="font-mono">${f.entryNip || '-'}</td>
      <td class="font-mono">${f.entryKelas || '-'}</td>
      <td><span class="pill-badge pill-auto">${f.isActive !== false ? 'Aktif' : 'Non-Aktif'}</span></td>
      <td>
        <div class="action-btns-row">
          <button class="btn-icon-action btn-edit-form" data-id="${f.id}" title="Edit Form">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon-action btn-del btn-del-form" data-id="${f.id}" title="Hapus Form">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach Edit & Delete Form handlers
  tbody.querySelectorAll('.btn-edit-form').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const form = currentForms.find(f => f.id === id);
      if (form) openFormModal(form);
    });
  });

  tbody.querySelectorAll('.btn-del-form').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Yakin ingin menghapus formulir ini?')) {
        await deleteFormHandler(id);
      }
    });
  });
}

// Teacher Save & Delete Handlers
async function saveTeacherHandler(teacherData) {
  const existingIdx = currentTeachers.findIndex(t => t.name === teacherData.name);
  if (existingIdx >= 0) {
    currentTeachers[existingIdx] = teacherData;
  } else {
    currentTeachers.unshift(teacherData);
  }

  saveLocalTeachers();

  if (db && isFirebaseActive) {
    try {
      const docId = teacherData.nip && teacherData.nip !== '-' ? teacherData.nip : teacherData.name.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, "teachers", docId), teacherData);
    } catch (e) {
      console.warn("Firestore sync warning:", e);
    }
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
  showToast(`Data guru "${teacherData.name}" berhasil disimpan!`);
}

async function deleteTeacherHandler(teacherName) {
  const teacher = currentTeachers.find(t => t.name === teacherName);
  currentTeachers = currentTeachers.filter(t => t.name !== teacherName);
  saveLocalTeachers();

  if (db && isFirebaseActive && teacher) {
    try {
      const docId = teacher.nip && teacher.nip !== '-' ? teacher.nip : teacher.name.replace(/[^a-zA-Z0-9]/g, '_');
      await deleteDoc(doc(db, "teachers", docId));
    } catch (e) {
      console.warn("Firestore delete warning:", e);
    }
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
  showToast(`Data guru "${teacherName}" dihapus.`);
}

// Form Save & Delete Handlers
async function saveFormHandler(formData) {
  const existingIdx = currentForms.findIndex(f => f.id === formData.id);
  if (existingIdx >= 0) {
    currentForms[existingIdx] = formData;
  } else {
    currentForms.push(formData);
  }

  saveLocalForms();

  if (db && isFirebaseActive) {
    try {
      await setDoc(doc(db, "forms", formData.id), formData);
    } catch (e) {
      console.warn("Firestore form sync warning:", e);
    }
  }

  renderAdminTables();
  renderUserPortal();
  showToast(`Formulir "${formData.name}" berhasil disimpan!`);
}

async function deleteFormHandler(formId) {
  currentForms = currentForms.filter(f => f.id !== formId);
  saveLocalForms();

  if (db && isFirebaseActive) {
    try {
      await deleteDoc(doc(db, "forms", formId));
    } catch (e) {
      console.warn("Firestore form delete warning:", e);
    }
  }

  renderAdminTables();
  renderUserPortal();
  showToast("Formulir telah dihapus.");
}

// 🚀 Seed 94 Master Teachers to Firestore
async function seedMasterTeachersToFirestore() {
  if (!confirm("Upload 94 data guru bawaan ke Firestore Cloud? Data yang sudah ada dengan nama yang sama akan diperbarui.")) return;

  showToast("Mengunggah master data guru ke Firestore...");
  currentTeachers = [...INITIAL_TEACHERS];
  saveLocalTeachers();

  if (db && isFirebaseActive) {
    try {
      const batch = writeBatch(db);
      INITIAL_TEACHERS.forEach(t => {
        const docId = t.nip && t.nip !== '-' ? t.nip : t.name.replace(/[^a-zA-Z0-9]/g, '_');
        const ref = doc(db, "teachers", docId);
        batch.set(ref, t);
      });
      await batch.commit();
      showToast("🚀 94 Master Data Guru berhasil diunggah ke Cloud Firestore!");
    } catch (err) {
      console.error("Gagal batch upload:", err);
      showToast("Gagal mengunggah ke Firestore. Pastikan izin Firestore Rules sudah diatur.");
    }
  } else {
    showToast("94 Master Guru dimuat ke penyimpanan lokal browser.");
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
}

/* ==========================================================================
   6. Impor & Ekspor Excel (.xlsx / .xls / JSON)
   ========================================================================== */

function sortTeachersByMasterOrder(teachers) {
  return [...teachers].sort((a, b) => {
    const idxA = MASTER_TEACHER_NAMES_ORDER.indexOf(a.name);
    const idxB = MASTER_TEACHER_NAMES_ORDER.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function exportTeachersToExcel() {
  const xlsxLib = window.XLSX;
  if (!xlsxLib) {
    showToast("Library Excel sedang dimuat, silakan coba 1 detik lagi.");
    return;
  }

  const defaultForm = currentForms[0] || INITIAL_FORMS[0];
  const sortedTeachers = sortTeachersByMasterOrder(currentTeachers);

  try {
    const excelData = sortedTeachers.map((t, idx) => ({
      "No": idx + 1,
      "Nama Guru": t.name,
      "NIP": t.nip || "-",
      "Kelas Binaan": t.class || "-",
      "Peran": t.role || "Guru",
      "URL Jurnal Pribadi": t.journalFormUrl || "",
      "Link Portal Guru": getPersonalPortalUrl(t),
      "Link Form Walikelas": defaultForm ? generateFormUrlForTeacher(defaultForm, t) : ""
    }));

    const worksheet = xlsxLib.utils.json_to_sheet(excelData);
    
    // Lebar kolom rapi di Excel
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 36 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 45 },
      { wch: 55 },
      { wch: 55 }
    ];

    const workbook = xlsxLib.utils.book_new();
    xlsxLib.utils.book_append_sheet(workbook, worksheet, "Data Guru & Link");
    
    xlsxLib.writeFile(workbook, "data_link_guru_portal_autoform.xlsx");
    showToast("File Excel (.xlsx) berhasil diunduh dengan urutan database!");
  } catch (err) {
    console.error("Gagal export Excel .xlsx:", err);
    showToast("Gagal export Excel: " + err.message);
  }
}

export function exportTeachersToJSON() {
  const exportData = {
    generatedAt: new Date().toISOString(),
    totalTeachers: currentTeachers.length,
    teachers: currentTeachers.map(t => ({
      ...t,
      personalPortalUrl: getPersonalPortalUrl(t)
    }))
  };
  const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  downloadBlob(jsonBlob, "data_guru_portal_autoform.json");
  showToast("File JSON berhasil diunduh!");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

// Expose to window for direct HTML onclick access
window.exportTeachersToExcel = exportTeachersToExcel;
window.exportTeachersToJSON = exportTeachersToJSON;

function initImportExport() {
  const inputFileExcel = document.getElementById('input-file-excel');
  const statusDiv = document.getElementById('import-preview-status');

  // Global click delegation for export buttons
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-do-export-excel') || e.target.closest('#btn-export-teachers-quick')) {
      e.preventDefault();
      exportTeachersToExcel();
    }
    if (e.target.closest('#btn-do-export-json')) {
      e.preventDefault();
      exportTeachersToJSON();
    }
  });

  if (inputFileExcel) {
    inputFileExcel.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const xlsxLib = window.XLSX;
      if (!xlsxLib) {
        showToast('Library Excel belum selesai dimuat. Silakan coba sesaat lagi.');
        return;
      }

      if (statusDiv) statusDiv.textContent = `Membaca file ${file.name}...`;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = xlsxLib.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = xlsxLib.utils.sheet_to_json(firstSheet, { header: 1 });
          await processImportedExcelRows(rows, statusDiv);
        } catch (err) {
          console.error("Gagal membaca file Excel:", err);
          if (statusDiv) statusDiv.textContent = `❌ Gagal membaca file Excel: ${err.message}`;
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
}

async function processImportedExcelRows(rows, statusDiv) {
  if (!rows || rows.length <= 1) {
    if (statusDiv) statusDiv.textContent = "❌ File Excel kosong atau tidak memiliki baris data.";
    return;
  }

  const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
  
  // Cari index kolom secara dinamis berdasarkan nama header
  let nameIdx = headerRow.findIndex(h => h.includes("nama"));
  let nipIdx = headerRow.findIndex(h => h.includes("nip"));
  let classIdx = headerRow.findIndex(h => h.includes("kelas"));
  let roleIdx = headerRow.findIndex(h => h.includes("peran") || h.includes("role"));
  let journalIdx = headerRow.findIndex(h => h.includes("jurnal") || h.includes("journal"));

  // Fallback index default jika header tidak bernama
  if (nameIdx === -1) nameIdx = 1;
  if (nipIdx === -1) nipIdx = 2;
  if (classIdx === -1) classIdx = 3;
  if (roleIdx === -1) roleIdx = 4;
  if (journalIdx === -1) journalIdx = 5;

  const importedList = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = String(row[nameIdx] || '').trim();
    if (!name) continue;

    const nip = String(row[nipIdx] || '-').trim();
    const cls = String(row[classIdx] || '-').trim();
    const role = String(row[roleIdx] || 'Walikelas').trim();
    const journalFormUrl = String(row[journalIdx] || '').trim();

    importedList.push({
      name,
      nip: nip || '-',
      class: cls || '-',
      role: role || 'Walikelas',
      journalFormUrl: journalFormUrl || ''
    });
  }

  if (importedList.length === 0) {
    if (statusDiv) statusDiv.textContent = "❌ Tidak ada data guru valid yang ditemukan di file Excel.";
    return;
  }

  // Gabungkan ke currentTeachers
  importedList.forEach(imported => {
    const idx = currentTeachers.findIndex(t => t.name.toLowerCase() === imported.name.toLowerCase());
    if (idx >= 0) {
      currentTeachers[idx] = { ...currentTeachers[idx], ...imported };
    } else {
      currentTeachers.push(imported);
    }
  });

  saveLocalTeachers();

  // Sinkronisasi ke Cloud Firestore
  if (db && isFirebaseActive) {
    try {
      const batch = writeBatch(db);
      importedList.forEach(t => {
        const docId = t.nip && t.nip !== '-' ? t.nip : t.name.replace(/[^a-zA-Z0-9]/g, '_');
        batch.set(doc(db, "teachers", docId), t);
      });
      await batch.commit();
      if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--success);">✅ Berhasil mengimpor <strong>${importedList.length} guru</strong> ke Cloud Firestore!</span>`;
    } catch (e) {
      if (statusDiv) statusDiv.textContent = `Disimpan lokal (Gagal sync cloud: ${e.message})`;
    }
  } else {
    if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--success);">✅ Berhasil mengimpor <strong>${importedList.length} guru</strong> ke penyimpanan browser!</span>`;
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
  showToast(`Impor ${importedList.length} data guru dari Excel berhasil!`);
}

/* ==========================================================================
   7. Form Builder (Tab 2)
   ========================================================================== */

function setupFormBuilder() {
  const formSelect = document.getElementById('builder-form-select');
  const guruSelect = document.getElementById('builder-guru-select');
  const kelasSelect = document.getElementById('builder-kelas-select');
  const builderForm = document.getElementById('custom-link-form');

  const emptyState = document.getElementById('result-empty-state');
  const resultContent = document.getElementById('result-content');
  const generatedText = document.getElementById('generated-url-text');
  const btnTest = document.getElementById('btn-test-generated-url');
  const btnCopy = document.getElementById('btn-copy-generated-url');

  // Populate Forms
  if (formSelect) {
    formSelect.innerHTML = currentForms.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  }

  // Populate Gurus
  if (guruSelect) {
    populateGuruSelect(guruSelect);
  }

  // Populate Kelas
  if (kelasSelect) {
    kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>' + 
      ALL_CLASSES.filter(c => c !== '-').map(c => `<option value="${c}">${c}</option>`).join('');
  }

  if (builderForm) {
    builderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formId = formSelect.value;
      const targetForm = currentForms.find(f => f.id === formId) || currentForms[0];
      const guruVal = guruSelect.value;
      const nipVal = document.getElementById('builder-nip-input').value.trim();
      const kelasVal = kelasSelect.value;

      if (!targetForm || !guruVal || !nipVal || !kelasVal) return;

      const fullUrl = generateFormUrlForTeacher(targetForm, { name: guruVal, nip: nipVal, class: kelasVal });

      generatedText.value = fullUrl;
      btnTest.href = fullUrl;

      emptyState.style.display = 'none';
      resultContent.style.display = 'block';
      showToast('Tautan kustom berhasil dibuat!');
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (generatedText.value) copyToClipboard(generatedText.value);
    });
  }
}

/* ==========================================================================
   8. UI Modals & Navigation
   ========================================================================== */

function initNavigation() {
  // Main Tab Navigation
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === targetId);
      });
    });
  });

  // Admin Subtabs Navigation
  document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-subtarget');
      document.querySelectorAll('.admin-subtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.admin-subpane').forEach(pane => {
        pane.classList.toggle('active', pane.id === targetId);
      });
    });
  });

  // Admin Search
  const adminSearch = document.getElementById('admin-teacher-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', () => {
      renderTeachersTable(adminSearch.value.trim());
    });
  }

  // Seed Button
  const seedBtn = document.getElementById('btn-seed-teachers');
  if (seedBtn) seedBtn.addEventListener('click', seedMasterTeachersToFirestore);
}

function initModals() {
  // 1. Login Modal
  const modalLogin = document.getElementById('modal-login-admin');
  const btnOpenLogin = document.getElementById('btn-show-login-modal');
  const btnCloseLogin = document.getElementById('btn-close-login-modal');
  const btnTriggerLogin = document.getElementById('btn-admin-login-trigger');
  const btnGoogleSignIn = document.getElementById('btn-google-sign-in');
  const demoLoginForm = document.getElementById('demo-login-form');
  const btnLogout = document.getElementById('btn-admin-logout');

  if (btnOpenLogin) btnOpenLogin.addEventListener('click', () => modalLogin.classList.remove('hidden'));
  if (btnTriggerLogin) btnTriggerLogin.addEventListener('click', () => modalLogin.classList.remove('hidden'));
  if (btnCloseLogin) btnCloseLogin.addEventListener('click', () => modalLogin.classList.add('hidden'));

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (auth && isFirebaseActive) {
        await signOut(auth);
      }
      handleAdminLogoutState();
      showToast('Anda telah keluar dari akun Admin.');
    });
  }

  if (btnGoogleSignIn) {
    btnGoogleSignIn.addEventListener('click', async () => {
      if (auth && isFirebaseActive && googleProvider) {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          modalLogin.classList.add('hidden');
          handleAdminLoginState(result.user.email, result.user.displayName);
        } catch (error) {
          console.error("Gagal Google Login:", error);
          showToast(`Login gagal: ${error.message}`);
        }
      } else {
        // Fallback demo
        sessionStorage.setItem('portal_demo_admin', ADMIN_EMAIL);
        modalLogin.classList.add('hidden');
        handleAdminLoginState(ADMIN_EMAIL, "Iskak Fatoni (Demo)");
      }
    });
  }

  if (demoLoginForm) {
    demoLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-demo-email').value.trim();
      sessionStorage.setItem('portal_demo_admin', email);
      modalLogin.classList.add('hidden');
      handleAdminLoginState(email, "Administrator");
    });
  }

  // 2. Teacher Modal
  const modalTeacher = document.getElementById('modal-teacher-form');
  const btnOpenTeacher = document.getElementById('btn-modal-add-teacher');
  const btnCloseTeacher = document.getElementById('btn-close-teacher-modal');
  const formTeacher = document.getElementById('form-manage-teacher');

  if (btnOpenTeacher) {
    btnOpenTeacher.addEventListener('click', () => {
      openTeacherModal();
    });
  }
  if (btnCloseTeacher) btnCloseTeacher.addEventListener('click', () => modalTeacher.classList.add('hidden'));

  if (formTeacher) {
    formTeacher.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-teacher-name').value.trim();
      const nip = document.getElementById('edit-teacher-nip').value.trim();
      const cls = document.getElementById('edit-teacher-class').value;
      const role = document.getElementById('edit-teacher-role').value;
      const journalFormUrl = document.getElementById('edit-teacher-journal-url').value.trim();

      await saveTeacherHandler({ name, nip, class: cls, role, journalFormUrl });
      modalTeacher.classList.add('hidden');
    });
  }

  // 3. Form Modal
  const modalForm = document.getElementById('modal-form-manage');
  const btnOpenForm = document.getElementById('btn-modal-add-form');
  const btnCloseForm = document.getElementById('btn-close-form-modal');
  const formManageForm = document.getElementById('form-manage-form');

  if (btnOpenForm) btnOpenForm.addEventListener('click', () => openFormModal());
  if (btnCloseForm) btnCloseForm.addEventListener('click', () => modalForm.classList.add('hidden'));

  if (formManageForm) {
    formManageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-form-id').value || 'form_' + Date.now();
      const name = document.getElementById('edit-form-name').value.trim();
      const category = document.getElementById('edit-form-category').value.trim();
      const baseUrl = document.getElementById('edit-form-url').value.trim();
      const desc = document.getElementById('edit-form-desc').value.trim();
      const entryGuru = document.getElementById('edit-entry-guru').value.trim();
      const entryNip = document.getElementById('edit-entry-nip').value.trim();
      const entryKelas = document.getElementById('edit-entry-kelas').value.trim();

      await saveFormHandler({
        id,
        name,
        category,
        baseUrl,
        description: desc,
        entryGuru,
        entryNip,
        entryKelas,
        isActive: true
      });

      modalForm.classList.add('hidden');
    });
  }

  // 4. Firebase Config Settings Form
  const cfgForm = document.getElementById('firebase-config-form');
  const btnResetCfg = document.getElementById('btn-reset-firebase-config');

  if (cfgForm) {
    cfgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiKey = document.getElementById('cfg-api-key').value.trim();
      const projectId = document.getElementById('cfg-project-id').value.trim();
      const authDomain = document.getElementById('cfg-auth-domain').value.trim();
      const appId = document.getElementById('cfg-app-id').value.trim();

      if (!apiKey || !projectId) {
        showToast('API Key dan Project ID wajib diisi!');
        return;
      }

      const customConfig = {
        apiKey,
        projectId,
        authDomain: authDomain || `${projectId}.firebaseapp.com`,
        storageBucket: `${projectId}.appspot.com`,
        appId: appId || ""
      };

      localStorage.setItem('portal_custom_firebase_config', JSON.stringify(customConfig));
      showToast('Konfigurasi Firebase disimpan! Memuat ulang sistem...');
      setTimeout(() => window.location.reload(), 1500);
    });
  }

  if (btnResetCfg) {
    btnResetCfg.addEventListener('click', () => {
      localStorage.removeItem('portal_custom_firebase_config');
      showToast('Konfigurasi Firebase direset.');
      setTimeout(() => window.location.reload(), 1000);
    });
  }
}

function openTeacherModal(teacher = null) {
  const modal = document.getElementById('modal-teacher-form');
  const title = document.getElementById('modal-teacher-title');
  const nameInp = document.getElementById('edit-teacher-name');
  const nipInp = document.getElementById('edit-teacher-nip');
  const classInp = document.getElementById('edit-teacher-class');
  const roleInp = document.getElementById('edit-teacher-role');
  const journalInp = document.getElementById('edit-teacher-journal-url');

  if (teacher) {
    title.innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Data Guru`;
    nameInp.value = teacher.name;
    nameInp.readOnly = true;
    nipInp.value = teacher.nip && teacher.nip !== '-' ? teacher.nip : '';
    classInp.value = teacher.class || '-';
    roleInp.value = teacher.role || 'Walikelas';
    if (journalInp) journalInp.value = teacher.journalFormUrl || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-user-plus"></i> Tambah Data Guru`;
    nameInp.value = '';
    nameInp.readOnly = false;
    nipInp.value = '';
    classInp.value = 'XII TEI 2';
    roleInp.value = 'Walikelas';
    if (journalInp) journalInp.value = '';
  }
  modal.classList.remove('hidden');
}

function openFormModal(form = null) {
  const modal = document.getElementById('modal-form-manage');
  const title = document.getElementById('modal-form-title');
  const idInp = document.getElementById('edit-form-id');
  const nameInp = document.getElementById('edit-form-name');
  const catInp = document.getElementById('edit-form-category');
  const urlInp = document.getElementById('edit-form-url');
  const descInp = document.getElementById('edit-form-desc');
  const guruInp = document.getElementById('edit-entry-guru');
  const nipInp = document.getElementById('edit-entry-nip');
  const kelasInp = document.getElementById('edit-entry-kelas');

  if (form) {
    title.innerHTML = `<i class="fa-solid fa-file-pen"></i> Edit Formulir`;
    idInp.value = form.id;
    nameInp.value = form.name;
    catInp.value = form.category || '';
    urlInp.value = form.baseUrl;
    descInp.value = form.description || '';
    guruInp.value = form.entryGuru || '';
    nipInp.value = form.entryNip || '';
    kelasInp.value = form.entryKelas || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-file-circle-plus"></i> Tambah Formulir Baru`;
    idInp.value = '';
    nameInp.value = '';
    catInp.value = 'Walikelas';
    urlInp.value = '';
    descInp.value = '';
    guruInp.value = 'entry.1599393498';
    nipInp.value = 'entry.65154558';
    kelasInp.value = 'entry.591543822';
  }
  modal.classList.remove('hidden');
}

function populateClassDropdowns() {
  const editClassSelect = document.getElementById('edit-teacher-class');
  if (editClassSelect) {
    editClassSelect.innerHTML = ALL_CLASSES.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

/* ==========================================================================
   9. Helper Utilities (Toast, Clipboard, Theme, Clock)
   ========================================================================= */

function showToast(message) {
  const toast = document.getElementById('toast');
  const msgElem = document.getElementById('toast-message');
  if (!toast) return;
  if (msgElem) msgElem.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Tautan berhasil disalin ke clipboard!');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  try {
    document.execCommand('copy');
    showToast('Tautan berhasil disalin ke clipboard!');
  } catch (err) {
    showToast('Gagal menyalin tautan.');
  }
  document.body.removeChild(el);
}

function initTheme() {
  const btn = document.getElementById('theme-toggle-btn');
  const saved = localStorage.getItem('portal_theme') || 'dark';
  if (saved === 'light') {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  }
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      document.body.classList.toggle('dark-mode', !isDark);
      document.body.classList.toggle('light-mode', isDark);
      localStorage.setItem('portal_theme', isDark ? 'light' : 'dark');
    });
  }
}

function initLiveClock() {
  const timeElem = document.getElementById('current-time');
  if (!timeElem) return;
  const update = () => {
    timeElem.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false }) + " WIB";
  };
  update();
  setInterval(update, 1000);
}
