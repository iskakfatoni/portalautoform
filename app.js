/**
 * PORTAL:AutoForm - Multi-User Cloud Application
 * Integrasi Firebase Auth, Cloud Firestore, dan Auto-Fill Parameter Engine
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

// Master Data Awal (94 Guru)
const INITIAL_TEACHERS = [
  { name: "MUCHAMAD ISKAK FATONI, S.Pd.", nip: "198109092022211004", class: "XII TEI 2", role: "Walikelas" },
  { name: "HERMAWANTO, S.Pd., M.Psi", nip: "-", class: "X TAV", role: "Walikelas" },
  { name: "NURUL HIDAYATI, S.Pd., M.Psi", nip: "-", class: "X TEI 1", role: "Walikelas" },
  { name: "Drs. MOEHAIMIN", nip: "-", class: "X TEI 2", role: "Walikelas" },
  { name: "DHURROTUL FARIDAH, S.Pd", nip: "-", class: "X TPL 1", role: "Walikelas" },
  { name: "SRI WINARTI, S.Pd", nip: "-", class: "X TPL 2", role: "Walikelas" },
  { name: "MUNASRI, S.Pd.", nip: "-", class: "X TPM 1", role: "Walikelas" },
  { name: "NUR HAYATI, S.Psi, M.Pd.", nip: "-", class: "X TPM 2", role: "Walikelas" },
  { name: "DWI RETNO TUGAS ERNAWATI, S.Pd", nip: "-", class: "X TKR1", role: "Walikelas" },
  { name: "KASIATIN, S.Pd", nip: "-", class: "X TKR2", role: "Walikelas" },
  { name: "SUHARTO DWI SUHERNOWO, ST", nip: "-", class: "X TBKR", role: "Walikelas" },
  { name: "ARSYL NOVA ARIRI, ST, M.Pd.", nip: "-", class: "X TSM 1", role: "Walikelas" },
  { name: "LAILA FITRIYA, S.Pd.I", nip: "-", class: "X TSM 2", role: "Walikelas" },
  { name: "EKA PRAMITASARI, S.Pd. M.Pd.", nip: "-", class: "X DKV 1", role: "Walikelas" },
  { name: "MISBAHUR ROSYIDIN, S.Pd.", nip: "-", class: "X DKV 2", role: "Walikelas" },
  { name: "Dra. DYAH CHUSNUL CHOTIMAH", nip: "-", class: "X DKV 3", role: "Walikelas" },
  { name: "WAWAN SISWANTO, SS", nip: "-", class: "XI TAV", role: "Walikelas" },
  { name: "R.A. RATNA KARTIKAWATI, S.Pd", nip: "-", class: "XI TEI 1", role: "Walikelas" },
  { name: "HERI SUBYANTORO, ST, M.Pd.", nip: "-", class: "XI TEI 2", role: "Walikelas" },
  { name: "NURUL HUDA, ST, M.Si.", nip: "-", class: "XI TPL 1", role: "Walikelas" },
  { name: "NUR 'AFIIFAH, M.Pd.", nip: "-", class: "XI TPL 2", role: "Walikelas" },
  { name: "TRIBUDI HARTONO, S.Pd", nip: "-", class: "XI TPM 1", role: "Walikelas" },
  { name: "DEDY HENDRIANA, S.Pd. M.Pd.", nip: "-", class: "XI TPM 2", role: "Walikelas" },
  { name: "AGUS HIDAYAT, S.Pd", nip: "-", class: "XI TKR1", role: "Walikelas" },
  { name: "SAMSUL HADI, M.Pd.", nip: "-", class: "XI TKR2", role: "Walikelas" },
  { name: "HISBULLOH HUDA, M.Pd.", nip: "-", class: "XI TBKR", role: "Walikelas" },
  { name: "DWI SANTOSO, S.Pd", nip: "-", class: "XI TSM 1", role: "Walikelas" },
  { name: "AGUS HARIYANTO, ST. M.Pd", nip: "-", class: "XI TSM 2", role: "Walikelas" },
  { name: "ZAINUL ARIFIN, M.Pd.", nip: "-", class: "XI DKV 1", role: "Walikelas" },
  { name: "BAMBANG SUJATMIKO, S.Pd", nip: "-", class: "XI DKV 2", role: "Walikelas" },
  { name: "HARTONO, S.Pd", nip: "-", class: "XI DKV 3", role: "Walikelas" },
  { name: "SIGIT EKO PRAMONO, S.Pd", nip: "-", class: "XII TAV", role: "Walikelas" },
  { name: "AGUNG RAKHMANDA, S.Kom.", nip: "-", class: "XII TEI 1", role: "Walikelas" },
  { name: "MOHAMAD ARIEF PRIYO UTOMO, S.Pd", nip: "-", class: "XII TPL 1", role: "Walikelas" },
  { name: "RIRIN DIYANNITA SASANTI, M.Pd.", nip: "-", class: "XII TPL 2", role: "Walikelas" },
  { name: "SULIADI, S.Pd", nip: "-", class: "XII TPM 1", role: "Walikelas" },
  { name: "TUTIK QOMARIYAH, S.Si", nip: "-", class: "XII TPM 2", role: "Walikelas" },
  { name: "IMAM SUFERI, ST.", nip: "-", class: "XII TKR1", role: "Walikelas" },
  { name: "FIRMAN ARDIANSYAH, S.Pd.", nip: "-", class: "XII TKR2", role: "Walikelas" },
  { name: "AZIZ CAHYA PRADANA, S.Pd.", nip: "-", class: "XII TBKR", role: "Walikelas" },
  { name: "WAHYU ROFIUL AMIN, S.Pd.", nip: "-", class: "XII TSM 1", role: "Walikelas" },
  { name: "ROHMA EKA INDRI AHADIAH, S.Pd, Gr", nip: "-", class: "XII TSM 2", role: "Walikelas" },
  { name: "EFRIDA ISBANDRIYAH, S.T.", nip: "-", class: "XII DKV 1", role: "Walikelas" },
  { name: "SOTYA BAYUNTARA, S.Pd.", nip: "-", class: "XII DKV 2", role: "Walikelas" },
  { name: "SRIGATI, SE", nip: "-", class: "XII DKV 3", role: "Walikelas" },
  { name: "HARI PURWANTO, ST", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "ESTI WIDHIARNI, S.T", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "EKO FAJAR KURNIAWAN, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "ETIK SULISTYOWATI, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "NOVAN EKO SETYAWAN, S.Kom.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "YAYUK NURNANINGSIH, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "KHOIRUL AMIN, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "REZA ZULKARNAIN ARIFIN, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "KHOIRUZEN, ST", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "HEPPY LUCKITO, SST", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "SRI PURWANINGSIH, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "DARIS UMAMI, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "AKHMAD ROFI SAFUAT, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "SIDHARTHA BUDI SUMEDHA, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "ASYITAH  ALMUFIDAH, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "SUDARMONO, ST", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "ROHMAN, S.T.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "ANDRI YUDHI PRASETYO, ST", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "HARIS ALI MUHYIDIN, S.T", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "MAMIEK ZUHRIYAH. S.Hum", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "UMI RU'YATIN, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "YEFI WULANDARI, SE", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "SARI NURHIDAYATI, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "SUWOYO, S.Kom", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "AAN SUSANTO, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "YUNITA DWI WIRANTI, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "NUR FAUZIYAH, S.Ag.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "SUYANTI, S.Kom.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "MIANTO, S.Kom.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "YUNIAR DWI LISTYANTO, ST", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "BENY WIJAYANTO, SS", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "NURUL JAMILAH, S.Hum.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "ENDANG MULYANI, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "AGUS IRIANTO, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "SAMUJI, S.Ag", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "IKA UMAYA MARDIANA, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "NUR KHOLIFAH, S.Pd.", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "AIDA QONITATILLAH, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "YULI ANDRIYANI,  S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "VITA EKA RAHAYU, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "AKHMAD VICKRI HIDAYATULLAH, S.Pd", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "HERI SUGIANTORO, S.Ag", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "AKBAR ILHAM BAGASKARA PRATAMA, S.T", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "DELIA NURUL AFIFAH", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "CAHYA ISKANDAR", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "EVY KUSHARDIANY", nip: "-", class: "-", role: "Guru Pengajar" },
  { name: "HUDAN RHARA ANGGRIADI", nip: "-", class: "-", role: "Guru Pengajar" }
];

// Master Data Kelas
const ALL_CLASSES = [
  "X TAV", "X TEI 1", "X TEI 2", "X TPL 1", "X TPL 2", "X TPM 1", "X TPM 2", "X TKR1", "X TKR2", "X TBKR", "X TSM 1", "X TSM 2", "X DKV 1", "X DKV 2", "X DKV 3",
  "XI TAV", "XI TEI 1", "XI TEI 2", "XI TPL 1", "XI TPL 2", "XI TPM 1", "XI TPM 2", "XI TKR1", "XI TKR2", "XI TBKR", "XI TSM 1", "XI TSM 2", "XI DKV 1", "XI DKV 2", "XI DKV 3",
  "XII TAV", "XII TEI 1", "XII TEI 2", "XII TPL 1", "XII TPL 2", "XII TPM 1", "XII TPM 2", "XII TKR1", "XII TKR2", "XII TBKR", "XII TSM 1", "XII TSM 2", "XII DKV 1", "XII DKV 2", "XII DKV 3",
  "-"
];

// Master Data Formulir Awal
const INITIAL_FORMS = [
  {
    id: "pengumpulan_bulanan_walikelas",
    name: "PENGUMPULAN BULANAN WALIKELAS",
    category: "Walikelas",
    description: "Laporan bulanan rutin administrasi walikelas ke sistem sekolah.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryKelas: "entry.591543822",
    isActive: true
  }
];

// State Aplikasi
let currentTeachers = [...INITIAL_TEACHERS];
let currentForms = [...INITIAL_FORMS];
let activeTeacher = {
  name: "MUCHAMAD ISKAK FATONI, S.Pd.",
  nip: "198109092022211004",
  class: "XII TEI 2",
  role: "Walikelas"
};
let currentUser = null;
const ADMIN_EMAIL = "iskakfatoni@gmail.com";

// Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNavigation();
  initModals();
  initLiveClock();
  
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
});

/* ==========================================================================
   1. Inisialisasi Firebase & State Management
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
    if (demoAdmin === ADMIN_EMAIL) {
      handleAdminLoginState(ADMIN_EMAIL, "Iskak Fatoni (Demo)");
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
   2. Auth & Admin Roles
   ========================================================================== */

function handleAdminLoginState(email, displayName) {
  currentUser = { email, displayName };
  const isAdmin = email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const authBtn = document.getElementById('btn-show-login-modal');
  const userProfile = document.getElementById('admin-user-profile');
  const emailDisplay = document.getElementById('admin-user-email');
  const adminLockIcon = document.getElementById('admin-lock-icon');

  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (authBtn) authBtn.classList.add('hidden');
  if (userProfile) userProfile.classList.remove('hidden');
  if (emailDisplay) emailDisplay.textContent = email;

  if (isAdmin) {
    if (adminLockIcon) adminLockIcon.innerHTML = `<i class="fa-solid fa-unlock text-green"></i>`;
    if (adminLockedView) adminLockedView.classList.add('hidden');
    if (adminDashboardView) adminDashboardView.classList.remove('hidden');
    renderAdminTables();
    showToast(`Selamat datang Administrator (${email})!`);
  } else {
    showToast(`Login berhasil sebagai ${email}`);
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
   3. Portal Guru (Pencarian NIP & Render Formulir)
   ========================================================================== */

function setupUserPortal() {
  const searchInput = document.getElementById('portal-nip-search');
  const guruSelect = document.getElementById('portal-guru-select');
  const suggestionsBox = document.getElementById('search-suggestions');

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

function setActiveTeacher(teacher) {
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
  showToast(`Profil aktif: ${teacher.name}`);
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
    // Generate auto-fill URL
    const params = new URLSearchParams();
    params.set('usp', 'pp_url');
    if (form.entryGuru && activeTeacher.name) params.set(form.entryGuru, activeTeacher.name);
    if (form.entryNip && activeTeacher.nip && activeTeacher.nip !== '-') params.set(form.entryNip, activeTeacher.nip);
    if (form.entryKelas && activeTeacher.class && activeTeacher.class !== '-') params.set(form.entryKelas, activeTeacher.class);

    const generatedUrl = `${form.baseUrl}?${params.toString()}`;

    return `
      <article class="form-card">
        <div class="card-top">
          <div class="card-icon-box">
            <i class="fa-solid fa-file-signature"></i>
          </div>
          <div class="card-tags">
            <span class="pill-badge pill-auto"><i class="fa-solid fa-check-double"></i> Auto-Fill Siap</span>
            <span class="pill-badge pill-role">${form.category || 'Formulir'}</span>
          </div>
        </div>

        <div class="card-body">
          <h4 class="card-title">${form.name}</h4>
          <p class="card-desc">${form.description || 'Laporan administrasi berkala.'}</p>

          <div class="data-preview-box">
            <div class="data-preview-title">
              <i class="fa-solid fa-circle-info"></i> Isian Otomatis Guru:
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
   4. Admin Panel & CRUD
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

  let filtered = currentTeachers;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = currentTeachers.filter(t => t.name.toLowerCase().includes(q) || (t.nip && t.nip.includes(q)));
  }

  tbody.innerHTML = filtered.map((t, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${t.name}</strong></td>
      <td class="font-mono">${t.nip || '-'}</td>
      <td><span class="badge-class">${t.class || '-'}</span></td>
      <td>${t.role || 'Guru'}</td>
      <td>
        <div class="action-btns-row">
          <button class="btn-icon-action btn-edit-teacher" data-nip="${t.nip}" data-name="${t.name}" title="Edit Data">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon-action btn-del btn-del-teacher" data-name="${t.name}" title="Hapus Guru">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

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

  // Save to Firestore if connected
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
   5. Form Builder (Tab 2)
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

      const params = new URLSearchParams();
      params.set('usp', 'pp_url');
      if (targetForm.entryGuru) params.set(targetForm.entryGuru, guruVal);
      if (targetForm.entryNip) params.set(targetForm.entryNip, nipVal);
      if (targetForm.entryKelas) params.set(targetForm.entryKelas, kelasVal);

      const fullUrl = `${targetForm.baseUrl}?${params.toString()}`;

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
   6. UI Modals & Navigation
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

      await saveTeacherHandler({ name, nip, class: cls, role });
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

  if (teacher) {
    title.innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Data Guru`;
    nameInp.value = teacher.name;
    nameInp.readOnly = true; // Primary key identifier
    nipInp.value = teacher.nip && teacher.nip !== '-' ? teacher.nip : '';
    classInp.value = teacher.class || '-';
    roleInp.value = teacher.role || 'Walikelas';
  } else {
    title.innerHTML = `<i class="fa-solid fa-user-plus"></i> Tambah Data Guru`;
    nameInp.value = '';
    nameInp.readOnly = false;
    nipInp.value = '';
    classInp.value = 'XII TEI 2';
    roleInp.value = 'Walikelas';
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
   7. Helper Utilities (Toast, Clipboard, Theme, Clock)
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
