/**
 * PORTAL:AutoForm - Multi-User Cloud Application
 * Integrasi Firebase Auth, Cloud Firestore, Personal URL Routing (?nip=...), dan Import/Export Engine
 */

import {
  initFirebase,
  auth,
  db,
  getDb,
  googleProvider,
  isFirebaseActive,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from './firebase-config.js';



import {
  INITIAL_TEACHERS,
  INITIAL_FORMS,
  INITIAL_SCHEDULES
} from './modules/initial-data.js';

import {
  normalizeFormClassName,
  normalizeDayName,
  formatTimeString,
  INDONESIAN_DAYS
} from './modules/formatters.js';

import {
  getActiveTeacherSchedule as getActiveTeacherScheduleModule,
  generateFormUrlForTeacher as generateFormUrlForTeacherModule,
  sortAndNormalizeForms
} from './modules/schedule-resolver.js';

// Helper wrappers to preserve signatures
function getActiveTeacherSchedule(teacher, now = new Date()) {
  return getActiveTeacherScheduleModule(teacher, now, currentSchedules);
}

function generateFormUrlForTeacher(form, teacher) {
  return generateFormUrlForTeacherModule(form, teacher, new Date(), currentSchedules);
}

// State Aplikasi
let currentTeachers = [...INITIAL_TEACHERS];
let currentForms = [...INITIAL_FORMS];
let currentSchedules = [...INITIAL_SCHEDULES];
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

  // Bersihkan cache lokal usang agar data 100% murni memori & Cloud Firestore
  localStorage.removeItem('portal_teachers_data');
  localStorage.removeItem('portal_forms_data');
  localStorage.removeItem('portal_schedule_data');

  // Setup Portal Guru (Attach MASUK button and NIP listeners immediately!)
  setupUserPortal();

  // Setup Form Builder
  setupFormBuilder();

  // Check URL Query Parameter (?nip=...)
  checkUrlParamsForTeacher();

  // Inisialisasi Firebase & Auth Listener
  setupFirebaseConnection();
});

/* ==========================================================================
   1. Tab Navigation & URL Routing Khusus per Guru (?nip=...)
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

      if (targetId === 'tab-admin') {
        renderAdminTables();
      } else if (targetId === 'tab-portal') {
        renderUserPortal();
      }
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

      if (targetId === 'subtab-schedule') {
        renderScheduleTable();
      } else if (targetId === 'subtab-forms') {
        renderFormsTable();
      } else if (targetId === 'subtab-teachers') {
        renderTeachersTable();
      }
    });
  });

  // Admin Schedule Search Listener
  const scheduleSearchInput = document.getElementById('admin-schedule-search');
  if (scheduleSearchInput) {
    scheduleSearchInput.addEventListener('input', (e) => {
      renderScheduleTable(e.target.value.trim());
    });
  }

  // Tombol Admin di Header
  const btnAdminHeader = document.getElementById('btn-show-login-modal');
  if (btnAdminHeader) {
    btnAdminHeader.addEventListener('click', (e) => {
      e.preventDefault();
      switchToAdminPanel();
    });
  }

  // Profil Admin di Header
  const adminProfile = document.getElementById('admin-user-profile');
  if (adminProfile) {
    adminProfile.addEventListener('click', (e) => {
      if (e.target.closest('#btn-admin-logout')) return;
      e.preventDefault();
      switchToAdminPanel();
    });
  }

  // Logout Button in Portal Header
  const btnPortalLogout = document.getElementById('btn-portal-logout');
  if (btnPortalLogout) {
    btnPortalLogout.addEventListener('click', async () => {
      localStorage.removeItem('portal_logged_nip');
      sessionStorage.removeItem('portal_demo_admin');
      if (auth && isFirebaseActive) {
        try { await signOut(auth); } catch (e) {}
      }
      window.location.href = '../../index.html';
    });
  }

  // Tombol Kembali ke Portal Guru di dalam Admin Dashboard
  const btnBackPortal = document.getElementById('btn-admin-back-to-portal');
  if (btnBackPortal) {
    btnBackPortal.addEventListener('click', (e) => {
      e.preventDefault();
      switchToPortalView();
    });
  }

  // Admin Search Guru
  const adminSearch = document.getElementById('admin-teacher-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', () => {
      renderTeachersTable(adminSearch.value.trim());
    });
  }

  // Admin Search Jadwal Mengajar
  const adminSchedSearch = document.getElementById('admin-schedule-search');
  if (adminSchedSearch) {
    adminSchedSearch.addEventListener('input', () => {
      renderScheduleTable(adminSchedSearch.value.trim());
    });
  }
}

export function switchToAdminPanel() {
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === 'tab-admin');
  });

  const adminTab = document.getElementById('tab-admin');
  if (adminTab) {
    adminTab.classList.add('active');
  }

  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (currentUser && currentUser.email) {
    if (adminLockedView) adminLockedView.classList.add('hidden');
    if (adminDashboardView) adminDashboardView.classList.remove('hidden');
    renderAdminTables();
  } else {
    if (adminLockedView) adminLockedView.classList.remove('hidden');
    if (adminDashboardView) adminDashboardView.classList.add('hidden');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function switchToPortalView() {
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === 'tab-user-portal');
  });

  const portalTab = document.getElementById('tab-user-portal');
  if (portalTab) {
    portalTab.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkUrlParamsForTeacher() {
  const params = new URLSearchParams(window.location.search);
  const nipParam = params.get('nip');
  const adminParam = params.get('admin');
  const teachersList = (currentTeachers && currentTeachers.length > 0) ? currentTeachers : INITIAL_TEACHERS;

  // Jika URL mengarah ke admin mode
  if (adminParam === 'true') {
    switchToAdminPanel();
    return;
  }

  // 1. Cek dari URL Query Parameter (?nip=...)
  if (nipParam && nipParam !== '-') {
    const cleanNip = nipParam.replace(/[\s\.\-]+/g, '');
    const found = teachersList.find(t => t.nip && t.nip.replace(/[\s\.\-]+/g, '') === cleanNip);
    if (found) {
      localStorage.setItem('portal_logged_nip', found.nip);
      showPortalView(found);
      showToast(`Selamat datang kembali, ${found.name}!`);
      return;
    }
  }

  // 2. Cek dari Sesi Tersimpan di Browser Guru (LocalStorage)
  const savedNip = localStorage.getItem('portal_logged_nip');
  if (savedNip && savedNip !== '-') {
    const cleanSavedNip = savedNip.replace(/[\s\.\-]+/g, '');
    const foundSaved = teachersList.find(t => t.nip && t.nip.replace(/[\s\.\-]+/g, '') === cleanSavedNip);
    if (foundSaved) {
      const newUrl = `${window.location.pathname}?nip=${encodeURIComponent(cleanSavedNip)}`;
      window.history.replaceState({ nip: foundSaved.nip }, '', newUrl);
      showPortalView(foundSaved);
      showToast(`Selamat datang kembali, ${foundSaved.name}!`);
      return;
    }
  }

  // 3. Cek apakah ada sesi admin di sessionStorage
  const demoAdmin = sessionStorage.getItem('portal_demo_admin');
  if (demoAdmin) {
    switchToAdminPanel();
    return;
  }

  // 4. Default Fallback: Tampilkan guru pertama / default jika tidak ada parameter agar dashboard selalu terisi
  const defaultTeacher = teachersList.find(t => t.nip === "198109092022211004") || teachersList[0];
  if (defaultTeacher) {
    showPortalView(defaultTeacher);
  }
}

function showPortalView(teacher) {
  if (!teacher) return;
  activeTeacher = teacher;
  
  // Update profil banner
  const nameEl = document.getElementById('active-teacher-name');
  const nipEl = document.getElementById('active-teacher-nip');
  const classEl = document.getElementById('active-teacher-class');
  const roleEl = document.getElementById('active-teacher-role');

  if (nameEl) nameEl.textContent = teacher.name;
  if (nipEl) nipEl.textContent = teacher.nip || '-';
  if (classEl) classEl.textContent = teacher.class || '-';
  if (roleEl) roleEl.textContent = teacher.role || 'Guru';

  renderUserPortal();
}

function getPersonalPortalUrl(teacher) {
  const base = window.location.origin + window.location.pathname;
  if (teacher.nip && teacher.nip !== '-') {
    return `${base}?nip=${encodeURIComponent(teacher.nip.replace(/[\s\.\-]+/g, ''))}`;
  }
  return `${base}?nip=${encodeURIComponent(teacher.name)}`;
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
    if (cloudBadgeDot) cloudBadgeDot.classList.add('online');
    if (cloudBadgeText) cloudBadgeText.textContent = "Firebase Online";
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
    if (cloudBadgeDot) cloudBadgeDot.classList.remove('online');
    if (cloudBadgeText) cloudBadgeText.textContent = "Mode Demo Lokal";
    if (statDbStatus) statDbStatus.textContent = "Lokal (Offline)";

    // Cek demo session di sessionStorage
    const demoAdmin = sessionStorage.getItem('portal_demo_admin');
    if (demoAdmin) {
      handleAdminLoginState(demoAdmin, "Administrator");
    } else {
      handleAdminLogoutState();
    }

    renderAdminTables();
  }
}

async function fetchFirestoreData() {
  const activeDb = getDb();
  if (!activeDb) {
    console.warn("⚠️ activeDb belum tersedia saat fetchFirestoreData dipanggil.");
    return;
  }

  // 1. Fetch Teachers
  try {
    const teachersSnapshot = await getDocs(collection(activeDb, "teachers"));
    if (!teachersSnapshot.empty) {
      const fetched = [];
      teachersSnapshot.forEach(doc => {
        fetched.push(doc.data());
      });
      currentTeachers = fetched;
      console.log(`[Firestore] ✅ ${fetched.length} guru berhasil dimuat.`);
    }
  } catch (err) {
    console.error("❌ Error membaca koleksi 'teachers':", err);
  }

  // 2. Fetch Forms (Sinkronisasi dan Kunci Urutan Resmi)
  try {
    const formsSnapshot = await getDocs(collection(activeDb, "forms"));
    if (!formsSnapshot.empty) {
      const fetchedForms = [];
      formsSnapshot.forEach(doc => {
        fetchedForms.push({ id: doc.id, ...doc.data() });
      });
      currentForms = sortAndNormalizeForms(fetchedForms);
      console.log(`[Firestore] ✅ ${fetchedForms.length} formulir berhasil dimuat.`);
    }
  } catch (err) {
    console.error("❌ Error membaca koleksi 'forms':", err);
  }

  // 3. Fetch Schedules (Sinkronisasi Jadwal Mengajar ke Semua Device / APK)
  try {
    const schedulesSnapshot = await getDocs(collection(activeDb, "schedules"));
    if (!schedulesSnapshot.empty) {
      const fetchedSchedules = [];
      schedulesSnapshot.forEach(doc => {
        const item = doc.data();
        fetchedSchedules.push({
          ...item,
          jamMulai: formatTimeString(item.jamMulai),
          jamSelesai: formatTimeString(item.jamSelesai)
        });
      });
      currentSchedules = fetchedSchedules;
      console.log(`[Firestore] ✅ ${fetchedSchedules.length} jadwal berhasil dimuat.`);
    } else {
      console.warn("[Firestore] ⚠️ Koleksi 'schedules' di Firestore kosong (0 dokumen).");
    }
  } catch (err) {
    console.error("❌ Error membaca koleksi 'schedules':", err);
  }

  // Re-check URL parameter and re-render forms with canonical order
  const adminTab = document.getElementById('tab-admin');
  if (adminTab && adminTab.classList.contains('active')) {
    renderAdminTables();
  } else {
    checkUrlParamsForTeacher();
    renderUserPortal();
    renderAdminTables();
  }
}

/* ==========================================================================
   3. Auth & Strict Admin Security
   ========================================================================== */

const AUTHORIZED_ADMIN_EMAILS = [
  "iskakfatoni@gmail.com"
];

function isAuthorizedAdminEmail(email) {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === String(email).trim().toLowerCase());
}

async function handleAdminLoginState(email, displayName) {
  if (!email || !isAuthorizedAdminEmail(email)) {
    console.warn("Percobaan akses akun non-admin:", email);
    if (auth && isFirebaseActive) {
      try { await signOut(auth); } catch (e) {}
    }
    handleAdminLogoutState();
    if (email) {
      alert(`⛔ AKSES DITOLAK!\n\nAkun Google "${email}" bukan Administrator terdaftar.\n\nHalaman Panel Admin hanya dapat diakses oleh akun resmi: iskakfatoni@gmail.com`);
      showToast('Akses ditolak: Akun bukan Administrator.');
    }
    return;
  }

  currentUser = { email, displayName };

  const authBtn = document.getElementById('btn-show-login-modal');
  const userProfile = document.getElementById('admin-user-profile');
  const emailDisplay = document.getElementById('admin-user-email');

  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (authBtn) authBtn.classList.add('hidden');
  if (userProfile) userProfile.classList.remove('hidden');
  if (emailDisplay) emailDisplay.textContent = email;

  if (adminLockedView) adminLockedView.classList.add('hidden');
  if (adminDashboardView) adminDashboardView.classList.remove('hidden');
  renderAdminTables();
  showToast(`Selamat datang Admin (${email})!`);

  // Ambil data Firestore terbaru setelah autentikasi admin berhasil
  await fetchFirestoreData();

  // Auto-sync urutan & nama resmi formulir ke Cloud Firestore
  syncCanonicalFormsToFirestore();

  // Auto-sync data guru & Long URL Google Form ke Cloud Firestore
  syncCanonicalTeachersToFirestore();
}

async function syncCanonicalFormsToFirestore() {
  const activeDb = getDb();
  if (!activeDb || !currentUser || !isAuthorizedAdminEmail(currentUser.email)) return;
  try {
    for (const form of INITIAL_FORMS) {
      await setDoc(doc(activeDb, "forms", form.id), {
        name: form.name,
        category: form.category,
        icon: form.icon,
        description: form.description,
        baseUrl: form.baseUrl,
        entryGuru: form.entryGuru || "",
        entryNip: form.entryNip || "",
        entryTanggal: form.entryTanggal || "",
        entryJamKe: form.entryJamKe || "",
        entryKelas: form.entryKelas || "",
        entryMapel: form.entryMapel || "",
        isActive: form.isActive !== false,
        orderIndex: form.orderIndex,
        statusBadge: form.statusBadge
      }, { merge: true });
    }
    console.log("Urutan & teks resmi formulir berhasil diperbarui di Cloud Firestore.");
  } catch (err) {
    console.warn("Sinkronisasi formulir ke Firestore dilewati:", err);
  }
}

async function syncCanonicalTeachersToFirestore() {
  const activeDb = getDb();
  if (!activeDb || !currentUser || !isAuthorizedAdminEmail(currentUser.email)) return;
  try {
    const batch = writeBatch(activeDb);
    let count = 0;

    INITIAL_TEACHERS.forEach(t => {
      const docId = t.nip && t.nip !== '-' ? t.nip : t.name.replace(/[^a-zA-Z0-9]/g, '_');
      const ref = doc(activeDb, "teachers", docId);
      batch.set(ref, t, { merge: true });
      count++;
    });

    await batch.commit();
    console.log("🔥 [Firestore] Berhasil menyimpan " + count + " Master Data Guru & Long URL ke Cloud Firestore!");
  } catch (err) {
    console.warn("⚠️ Gagal sinkronisasi data guru ke Firestore:", err);
  }
}

function handleAdminLogoutState() {
  currentUser = null;

  const authBtn = document.getElementById('btn-show-login-modal');
  const userProfile = document.getElementById('admin-user-profile');
  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (authBtn) authBtn.classList.remove('hidden');
  if (userProfile) userProfile.classList.add('hidden');
  if (adminLockedView) adminLockedView.classList.remove('hidden');
  if (adminDashboardView) adminDashboardView.classList.add('hidden');
}

/* ==========================================================================
   4. Landing Page NIP Gate & Portal Guru
   ========================================================================== */

function setupUserPortal() {
  const formLandingNip = document.getElementById('form-landing-nip');
  const landingNipInput = document.getElementById('landing-nip-input');
  const landingError = document.getElementById('landing-nip-error');
  const btnLandingGo = document.getElementById('btn-landing-go');
  const btnBackToLanding = document.getElementById('btn-back-to-landing-nip');
  const btnLandingAdmin = document.getElementById('btn-landing-admin-gate');

  // Core NIP Verification Logic
  const processLandingNipSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!landingNipInput) return;

    const rawVal = landingNipInput.value || '';
    const cleanVal = rawVal.trim().replace(/[\s\.\-]+/g, '');

    if (!cleanVal) {
      if (landingError) {
        landingError.classList.remove('hidden');
        landingError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Silakan ketik NIP Anda terlebih dahulu.`;
      }
      landingNipInput.focus();
      return;
    }

    // Pastikan master data tersedia (fallback ke INITIAL_TEACHERS jika currentTeachers kosong)
    const teachersList = (currentTeachers && currentTeachers.length > 0) ? currentTeachers : INITIAL_TEACHERS;

    // 1. Cari guru berdasarkan NIP (membersihkan format spasi/tanda baca)
    let found = teachersList.find(t => {
      if (!t.nip || t.nip === '-') return false;
      const teacherCleanNip = String(t.nip).trim().replace(/[\s\.\-]+/g, '');
      return teacherCleanNip === cleanVal;
    });

    // 2. Fallback cerdas: jika tidak ditemukan dengan NIP, cari berdasarkan nama guru (jika guru mengetik nama)
    if (!found) {
      const searchName = rawVal.trim().toLowerCase();
      if (searchName.length >= 3) {
        found = teachersList.find(t => t.name.toLowerCase().includes(searchName) && t.nip && t.nip !== '-');
      }
    }

    if (found) {
      if (landingError) landingError.classList.add('hidden');
      
      // Simpan sesi NIP di LocalStorage agar tidak perlu ketik berulang kali
      localStorage.setItem('portal_logged_nip', found.nip);

      // Update URL query tanpa reload browser
      const cleanTeacherNip = String(found.nip).trim().replace(/[\s\.\-]+/g, '');
      const newUrl = `${window.location.pathname}?nip=${encodeURIComponent(cleanTeacherNip)}`;
      window.history.pushState({ nip: found.nip }, '', newUrl);
      
      // Buka Layar 2 (Dashboard Link Formulir)
      showPortalView(found);
      showToast(`Selamat datang, ${found.name}!`);
    } else {
      if (landingError) {
        landingError.classList.remove('hidden');
        landingError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> NIP <strong>${rawVal}</strong> tidak ditemukan di database guru. Pastikan 18 digit NIP sudah benar.`;
      }
      landingNipInput.focus();
    }
  };

  // Event Listeners untuk Form Submit, Klik Tombol MASUK, dan Tekan Enter
  if (formLandingNip) {
    formLandingNip.addEventListener('submit', processLandingNipSubmit);
  }
  if (btnLandingGo) {
    btnLandingGo.addEventListener('click', processLandingNipSubmit);
  }
  if (landingNipInput) {
    landingNipInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        processLandingNipSubmit(e);
      }
    });
  }

  // 2. Tombol Theme Toggle di Landing Page
  const btnLandingTheme = document.getElementById('btn-landing-theme-toggle');
  if (btnLandingTheme) {
    btnLandingTheme.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      document.body.classList.toggle('dark-mode', !isDark);
      document.body.classList.toggle('light-mode', isDark);
      localStorage.setItem('portal_theme', isDark ? 'light' : 'dark');
    });
  }

  // 3. Tombol "Ganti NIP / Keluar" di Layar 2
  if (btnBackToLanding) {
    btnBackToLanding.addEventListener('click', () => {
      localStorage.removeItem('portal_logged_nip');
      window.history.pushState({}, '', window.location.pathname);
      showLandingView();
      showToast('Sesi NIP ditutup. Silakan masukkan NIP lain.');
    });
  }
}

function setActiveTeacher(teacher) {
  showPortalView(teacher);
}



function renderUserPortal() {
  const container = document.getElementById('portal-forms-grid');
  const weekendBanner = document.getElementById('weekend-holiday-banner');
  if (!container) return;

  // Cek Hari Sabtu / Minggu (0 = Minggu, 6 = Sabtu)
  const now = new Date();
  const dayIndex = now.getDay();
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  if (weekendBanner) {
    if (isWeekend) {
      weekendBanner.classList.remove('hidden');
    } else {
      weekendBanner.classList.add('hidden');
    }
  }

  const normalized = sortAndNormalizeForms(currentForms);
  const activeForms = normalized.filter(f => f.isActive !== false);

  if (activeForms.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Belum ada formulir aktif yang tersedia.</p></div>`;
    return;
  }

  container.innerHTML = activeForms.map((form, idx) => {
    const generatedUrl = generateFormUrlForTeacher(form, activeTeacher);
    const formIcon = form.icon || "fa-solid fa-file-signature";
    const themeIndex = (idx % 5) + 1;

    return `
      <a href="${generatedUrl}" target="_blank" rel="noopener noreferrer" class="form-direct-card card-theme-${themeIndex}" title="Buka ${form.name}">
        <div class="form-card-left">
          <div class="form-card-icon-box">
            <i class="${formIcon}"></i>
          </div>
          <div class="form-card-title-box">
            <span class="form-card-number">${idx + 1}.</span>
            <span class="form-card-title">${form.name}</span>
          </div>
        </div>
        <div class="form-card-right-icon">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </div>
      </a>
    `;
  }).join('');
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
  renderScheduleTable();
}

function renderScheduleTable(filterQuery = '') {
  const tbody = document.getElementById('schedule-table-body');
  if (!tbody) return;

  const schedules = (currentSchedules && currentSchedules.length > 0) ? currentSchedules : INITIAL_SCHEDULES;
  let filtered = schedules;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = schedules.filter(s => 
      (s.hari && s.hari.toLowerCase().includes(q)) ||
      (s.kelas && s.kelas.toLowerCase().includes(q)) ||
      (s.mataPelajaran && s.mataPelajaran.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.nip && s.nip.includes(q))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Tidak ada jadwal mengajar yang cocok.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((s, idx) => {
    const timeRange = (s.jamMulai && s.jamSelesai) ? `${s.jamMulai} - ${s.jamSelesai}` : '-';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.hari || '-'}</strong></td>
        <td><span class="badge-class">${s.jamKe || '-'}</span></td>
        <td class="font-mono">${timeRange}</td>
        <td><strong>${s.kelas || '-'}</strong></td>
        <td>${s.mataPelajaran || '-'}</td>
        <td>${s.name || '-'}</td>
        <td class="font-mono">${s.nip || '-'}</td>
        <td>
          <div class="action-btns-row">
            <button class="btn-icon-action btn-del btn-del-schedule" data-index="${idx}" title="Hapus Jadwal">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-del-schedule').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (confirm('Yakin ingin menghapus jadwal ini?')) {
        deleteScheduleHandler(idx);
      }
    });
  });
}

async function deleteScheduleHandler(index) {
  if (currentSchedules && currentSchedules[index]) {
    const item = currentSchedules[index];
    currentSchedules.splice(index, 1);
    renderScheduleTable();

    if (db && isFirebaseActive) {
      try {
        const cleanNip = (item.nip || '').trim().replace(/[\s\.\-]+/g, '') || 'nonip';
        const cleanName = (item.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cleanHari = (item.hari || '').trim().toLowerCase();
        const cleanJam = (item.jamKe || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanKelas = (item.kelas || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const docId = item.id || `sch_${cleanNip}_${cleanName}_${cleanHari}_${cleanJam}_${cleanKelas}`.substring(0, 100);
        await deleteDoc(doc(db, "schedules", docId));
      } catch (e) {
        console.warn("Gagal hapus jadwal dari Firestore:", e);
      }
    }
    showToast('Jadwal berhasil dihapus.');
  }
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
    let journalStatusBadge = '<span class="pill-badge" style="background:rgba(150,150,150,0.15);color:var(--text-muted);font-size:0.75rem;">Default Base</span>';
    if (t.journalFormUrl) {
      if (t.journalFormUrl.includes('docs.google.com/forms/d/')) {
        journalStatusBadge = `<a href="${t.journalFormUrl}" target="_blank" rel="noopener noreferrer" class="pill-badge pill-auto" style="text-decoration:none;font-size:0.75rem;" title="${t.journalFormUrl}"><i class="fa-solid fa-circle-check"></i> URL Panjang</a>`;
      } else if (t.journalFormUrl.includes('forms.gle/')) {
        journalStatusBadge = `<span class="pill-badge" style="background:rgba(234,179,8,0.2);color:#eab308;font-size:0.75rem;" title="Shortlink forms.gle tidak mendukung autofill. Silakan edit dan ubah ke URL viewform!"><i class="fa-solid fa-triangle-exclamation"></i> forms.gle</span>`;
      } else {
        journalStatusBadge = `<span class="pill-badge pill-auto" style="font-size:0.75rem;">Kustom</span>`;
      }
    }

    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${t.name}</strong></td>
        <td class="font-mono">${t.nip || '-'}</td>
        <td>${t.role || 'Guru'}</td>
        <td>${journalStatusBadge}</td>
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

  const activeDb = getDb();
  if (activeDb) {
    try {
      const docId = teacherData.nip && teacherData.nip !== '-' ? teacherData.nip : teacherData.name.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(activeDb, "teachers", docId), teacherData);
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

  const activeDb = getDb();
  if (activeDb && teacher) {
    try {
      const docId = teacher.nip && teacher.nip !== '-' ? teacher.nip : teacher.name.replace(/[^a-zA-Z0-9]/g, '_');
      await deleteDoc(doc(activeDb, "teachers", docId));
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
  const masterNames = INITIAL_TEACHERS.map(t => t.name.toLowerCase());
  return [...teachers].sort((a, b) => {
    const idxA = masterNames.indexOf(a.name.toLowerCase());
    const idxB = masterNames.indexOf(b.name.toLowerCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.orderIndex || 999) - (b.orderIndex || 999);
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

  // Global click delegation for export & sync buttons
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-do-export-excel') || e.target.closest('#btn-export-teachers-quick') || e.target.closest('#btn-export-excel')) {
      e.preventDefault();
      exportTeachersToExcel();
    }
    if (e.target.closest('#btn-do-export-json')) {
      e.preventDefault();
      exportTeachersToJSON();
    }
    if (e.target.closest('#btn-sync-master-teachers')) {
      e.preventDefault();
      seedMasterTeachersToFirestore();
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

  // Impor Jadwal Mengajar Excel / CSV
  const inputImportSchedule = document.getElementById('input-import-schedule-excel');
  if (inputImportSchedule) {
    inputImportSchedule.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const xlsxLib = window.XLSX;
      if (!xlsxLib) {
        showToast('Library Excel belum selesai dimuat. Silakan coba sesaat lagi.');
        return;
      }

      showToast(`Membaca jadwal dari ${file.name}...`);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = xlsxLib.read(data, { type: 'array' });
          
          // Cari sheet yang berisi data jadwal
          let targetSheet = workbook.Sheets[workbook.SheetNames[0]];
          for (const name of workbook.SheetNames) {
            if (name.toLowerCase().includes('jadwal')) {
              targetSheet = workbook.Sheets[name];
              break;
            }
          }

          const rows = xlsxLib.utils.sheet_to_json(targetSheet, { header: 1, raw: false, dateNF: 'HH:mm' });
          await processImportedScheduleRows(rows);
        } catch (err) {
          console.error("Gagal membaca file Excel Jadwal:", err);
          showToast(`❌ Gagal membaca file jadwal: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
      inputImportSchedule.value = '';
    });
  }
}

async function processImportedScheduleRows(rows) {
  if (!rows || rows.length <= 1) {
    showToast("❌ File jadwal kosong atau tidak memiliki baris data.");
    return;
  }

  // Deteksi letak baris Header secara dinamis (mencari baris yang memiliki kata 'hari', 'kelas', 'mapel', 'jam', dsb)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rowStr = (rows[i] || []).map(c => String(c || '').toLowerCase()).join(' ');
    if (rowStr.includes('hari') || rowStr.includes('kelas') || rowStr.includes('mapel') || rowStr.includes('jam')) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = (rows[headerRowIdx] || []).map(h => String(h || '').trim().toLowerCase());
  
  let nipIdx = headerRow.findIndex(h => h.includes("nip"));
  let nameIdx = headerRow.findIndex(h => h.includes("nama") || h.includes("guru"));
  let hariIdx = headerRow.findIndex(h => h.includes("hari"));
  let jamKeIdx = headerRow.findIndex(h => h.includes("jam_ke") || h.includes("jam ke") || h.includes("sesi"));
  let jamMulaiIdx = headerRow.findIndex(h => h.includes("jam_mulai") || h.includes("jam mulai") || h.includes("mulai"));
  let jamSelesaiIdx = headerRow.findIndex(h => h.includes("jam_selesai") || h.includes("jam selesai") || h.includes("selesai"));
  let kelasIdx = headerRow.findIndex(h => h.includes("kelas"));
  let mapelIdx = headerRow.findIndex(h => h.includes("mapel") || h.includes("pelajaran"));
  let ketIdx = headerRow.findIndex(h => h.includes("ket") || h.includes("ruang"));

  if (nipIdx === -1) nipIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (hariIdx === -1) hariIdx = 2;
  if (jamKeIdx === -1) jamKeIdx = 3;
  if (jamMulaiIdx === -1) jamMulaiIdx = 4;
  if (jamSelesaiIdx === -1) jamSelesaiIdx = 5;
  if (kelasIdx === -1) kelasIdx = 6;
  if (mapelIdx === -1) mapelIdx = 7;
  if (ketIdx === -1) ketIdx = 8;

  const newSchedules = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const nip = String(r[nipIdx] || '').trim();
    const name = String(r[nameIdx] || '').trim();
    const rawHari = String(r[hariIdx] || '').trim();
    const hari = normalizeDayName(rawHari) || rawHari;
    const jamKe = String(r[jamKeIdx] || '').trim();
    const jamMulai = formatTimeString(r[jamMulaiIdx] || '');
    const jamSelesai = formatTimeString(r[jamSelesaiIdx] || '');
    const kelas = String(r[kelasIdx] || '').trim();
    const mataPelajaran = String(r[mapelIdx] || '').trim();
    const keterangan = String(r[ketIdx] || '').trim();

    if (!hari && !kelas && !name) continue;

    newSchedules.push({
      nip,
      name,
      hari,
      jamKe,
      jamMulai,
      jamSelesai,
      kelas,
      mataPelajaran,
      keterangan
    });
  }

  if (newSchedules.length > 0) {
    currentSchedules = newSchedules;
    renderScheduleTable();

    // Sinkronisasi ke Cloud Firestore dengan batch commit
    const activeDb = getDb();
    if (activeDb) {
      try {
        const batch = writeBatch(activeDb);
        newSchedules.forEach((s) => {
          const cleanNip = (s.nip || '').trim().replace(/[\s\.\-]+/g, '') || 'nonip';
          const cleanName = (s.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
          const cleanHari = (s.hari || '').trim().toLowerCase();
          const cleanJam = (s.jamKe || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
          const cleanKelas = (s.kelas || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
          const docId = `sch_${cleanNip}_${cleanName}_${cleanHari}_${cleanJam}_${cleanKelas}`.substring(0, 100);
          batch.set(doc(activeDb, "schedules", docId), s);
        });
        await batch.commit();
        console.log("🔥 Berhasil mengunggah", newSchedules.length, "jadwal ke Cloud Firestore!");
        showToast(`✅ Berhasil mengimpor & sinkron ${newSchedules.length} jadwal ke Cloud Firestore!`);
      } catch (e) {
        console.error("Gagal sync jadwal ke Firestore:", e);
        showToast(`✅ Berhasil mengimpor ${newSchedules.length} data jadwal ke memori! (Cloud sync error: ${e.message})`);
      }
    } else {
      showToast(`✅ Berhasil mengimpor ${newSchedules.length} data jadwal mengajar!`);
    }
  } else {
    showToast("⚠️ Tidak ada data jadwal valid yang terbaca dari file.");
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

  if (builderForm) {
    builderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formId = formSelect.value;
      const targetForm = currentForms.find(f => f.id === formId) || currentForms[0];
      const guruVal = guruSelect.value;
      const nipVal = document.getElementById('builder-nip-input').value.trim();

      if (!targetForm || !guruVal || !nipVal) return;

      const fullUrl = generateFormUrlForTeacher(targetForm, { name: guruVal, nip: nipVal });

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

function populateGuruSelect(selectElem) {
  if (!selectElem) return;
  const list = (currentTeachers && currentTeachers.length > 0) ? currentTeachers : [];
  selectElem.innerHTML = '<option value="">-- Pilih Guru --</option>' + 
    list.map(t => `<option value="${t.name}">${t.name} (${t.nip !== '-' ? t.nip : ''})</option>`).join('');
}

/* ==========================================================================
   8. UI Modals
   ========================================================================== */

function initModals() {
  // 1. Admin Email & Password Login Form
  const adminEmailPwdForm = document.getElementById('admin-email-password-form');
  const btnLogout = document.getElementById('btn-admin-logout');

  if (adminEmailPwdForm) {
    adminEmailPwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-login-email').value.trim();
      const password = document.getElementById('admin-login-password').value;

      if (!email || !password) {
        alert("Silakan masukkan email dan password admin.");
        return;
      }

      if (!isAuthorizedAdminEmail(email)) {
        alert(`⛔ AKSES DITOLAK!\n\nEmail "${email}" bukan akun Administrator resmi (iskakfatoni@gmail.com).`);
        return;
      }

      if (!auth || !isFirebaseActive) {
        alert("Firebase Auth belum aktif atau sedang offline.");
        return;
      }

      try {
        showToast("⏳ Sedang memverifikasi akun Admin...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleAdminLoginState(userCredential.user.email, userCredential.user.displayName || "Admin");
        switchToAdminPanel();
      } catch (error) {
        console.error("Gagal Login Email/Password:", error);
        let msg = error.message;
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          msg = "Password salah atau kredensial tidak valid. Silakan periksa kembali password akun Firebase Anda.";
        } else if (error.code === 'auth/user-not-found') {
          msg = "Pengguna belum terdaftar di Firebase Auth. Silakan daftarkan email ini di Firebase Console > Authentication > Users.";
        } else if (error.code === 'auth/too-many-requests') {
          msg = "Terlalu banyak percobaan login gagal. Silakan coba lagi beberapa saat lagi.";
        }
        alert(`⚠️ Gagal Masuk Admin:\n\n${msg}`);
        showToast(`Login gagal: ${error.code || 'Password salah'}`);
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (auth && isFirebaseActive) {
        await signOut(auth);
      }
      handleAdminLogoutState();
      switchToPortalView();
      showToast('Anda telah keluar dari akun Admin.');
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
      const role = document.getElementById('edit-teacher-role').value;
      const journalFormUrl = document.getElementById('edit-teacher-journal-url').value.trim();

      await saveTeacherHandler({ name, nip, role, journalFormUrl });
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

      await saveFormHandler({
        id,
        name,
        category,
        baseUrl,
        description: desc,
        entryGuru,
        entryNip,
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
  const roleInp = document.getElementById('edit-teacher-role');
  const journalInp = document.getElementById('edit-teacher-journal-url');

  if (teacher) {
    title.innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Data Guru`;
    nameInp.value = teacher.name;
    nameInp.readOnly = true;
    nipInp.value = teacher.nip && teacher.nip !== '-' ? teacher.nip : '';
    roleInp.value = teacher.role || 'Walikelas';
    if (journalInp) journalInp.value = teacher.journalFormUrl || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-user-plus"></i> Tambah Data Guru`;
    nameInp.value = '';
    nameInp.readOnly = false;
    nipInp.value = '';
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

  if (form) {
    title.innerHTML = `<i class="fa-solid fa-file-pen"></i> Edit Formulir`;
    idInp.value = form.id;
    nameInp.value = form.name;
    catInp.value = form.category || '';
    urlInp.value = form.baseUrl;
    descInp.value = form.description || '';
    guruInp.value = form.entryGuru || '';
    nipInp.value = form.entryNip || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-file-circle-plus"></i> Tambah Formulir Baru`;
    idInp.value = '';
    nameInp.value = '';
    catInp.value = 'Walikelas';
    urlInp.value = '';
    descInp.value = '';
    guruInp.value = 'entry.1599393498';
    nipInp.value = 'entry.65154558';
  }
  modal.classList.remove('hidden');
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

  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('portal_theme', newTheme);
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
