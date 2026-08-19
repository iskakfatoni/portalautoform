/**
 * PORTAL:AutoForm - Multi-User Cloud Application (Refactored Modular Engine)
 * Integrasi Firebase Auth, Cloud Firestore, Personal URL Routing (?nip=...), dan Import/Export Engine
 */

import {
  initFirebase,
  auth,
  isFirebaseActive,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from './firebase-config.js';

import {
  fetchTeachers,
  fetchForms,
  fetchSchedules,
  saveTeacherToFirestore,
  deleteTeacherFromFirestore,
  saveFormToFirestore,
  deleteFormFromFirestore,
  saveFormSubmission,
  checkFormSubmission
} from './modules/firestore-service.js';

import {
  formatTimeString
} from './modules/formatters.js';

import {
  getActiveTeacherSchedule as getActiveTeacherScheduleModule,
  generateFormUrlForTeacher as generateFormUrlForTeacherModule,
  sortAndNormalizeForms
} from './modules/schedule-resolver.js';

import { initTheme } from './modules/theme-manager.js';
import { isAuthorizedAdminEmail } from './modules/auth-manager.js';
import {
  exportTeachersToExcel as exportExcelService,
  exportTeachersToJSON as exportJSONService,
  processImportedExcelRows,
  processImportedScheduleRows,
  getPersonalPortalUrl
} from './modules/excel-service.js';

import {
  renderUserPortal,
  renderTeachersTable,
  renderFormsTable,
  renderScheduleTable
} from './modules/ui-renderers.js';

// Helper wrappers to preserve signatures
function getActiveTeacherSchedule(teacher, now = new Date()) {
  return getActiveTeacherScheduleModule(teacher, now, currentSchedules);
}

function generateFormUrlForTeacher(form, teacher) {
  return generateFormUrlForTeacherModule(form, teacher, new Date(), currentSchedules);
}

// State Aplikasi (100% Murni Dimuat Real-Time dari Cloud Firestore)
let currentTeachers = [];
let currentForms = [];
let currentSchedules = [];
let activeTeacher = null;
let currentUser = null;

// Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', async () => {
  if (!navigator.onLine) {
    window.location.href = 'offline.html';
    return;
  }

  initTheme('theme-toggle-btn');
  initNavigation();
  initModals();
  initLiveClock();
  initImportExport();

  // Bersihkan cache lokal usang agar data 100% murni memori & Cloud Firestore
  localStorage.removeItem('portal_teachers_data');
  localStorage.removeItem('portal_forms_data');
  localStorage.removeItem('portal_schedule_data');

  // Setup Portal Guru & Form Builder
  setupUserPortal();
  setupFormBuilder();

  // 1. Muat data langsung dari Cloud Firestore
  await fetchFirestoreData();

  // 2. Inisialisasi Firebase & Auth Listener
  setupFirebaseConnection();
});

/* ==========================================================================
   1. Tab Navigation & URL Routing Khusus per Guru (?nip=...)
   ========================================================================== */

function initNavigation() {
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
        renderUserPortalApp();
      }
    });
  });

  document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-subtarget');
      document.querySelectorAll('.admin-subtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.admin-subpane').forEach(pane => {
        pane.classList.toggle('active', pane.id === targetId);
      });

      if (targetId === 'subtab-schedule') {
        renderScheduleTableApp();
      } else if (targetId === 'subtab-forms') {
        renderFormsTableApp();
      } else if (targetId === 'subtab-teachers') {
        renderTeachersTableApp();
      }
    });
  });

  const scheduleSearchInput = document.getElementById('admin-schedule-search');
  if (scheduleSearchInput) {
    scheduleSearchInput.addEventListener('input', (e) => {
      renderScheduleTableApp(e.target.value.trim());
    });
  }

  const btnAdminHeader = document.getElementById('btn-show-login-modal');
  if (btnAdminHeader) {
    btnAdminHeader.addEventListener('click', (e) => {
      e.preventDefault();
      switchToAdminPanel();
    });
  }

  const adminProfile = document.getElementById('admin-user-profile');
  if (adminProfile) {
    adminProfile.addEventListener('click', (e) => {
      if (e.target.closest('#btn-admin-logout')) return;
      e.preventDefault();
      switchToAdminPanel();
    });
  }

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

  const btnBackPortal = document.getElementById('btn-admin-back-to-portal');
  if (btnBackPortal) {
    btnBackPortal.addEventListener('click', (e) => {
      e.preventDefault();
      switchToPortalView();
    });
  }

  const adminSearch = document.getElementById('admin-teacher-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', () => {
      renderTeachersTableApp(adminSearch.value.trim());
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
  const teachersList = (currentTeachers && currentTeachers.length > 0) ? currentTeachers : [];

  if (adminParam === 'true') {
    switchToAdminPanel();
    return;
  }

  if (nipParam && nipParam !== '-') {
    const cleanNip = nipParam.replace(/[\s\.\-]+/g, '');
    const found = teachersList.find(t => t.nip && t.nip.replace(/[\s\.\-]+/g, '') === cleanNip);
    if (found) {
      localStorage.setItem('portal_logged_nip', found.nip);
      localStorage.setItem('portal_remember_nip', found.nip);
      showPortalView(found);
      showToast(`Selamat datang kembali, ${found.name}!`);
      return;
    }
  }

  const savedNip = localStorage.getItem('portal_logged_nip') || localStorage.getItem('portal_remember_nip');
  if (savedNip && savedNip !== '-') {
    const cleanSavedNip = savedNip.replace(/[\s\.\-]+/g, '');
    const foundSaved = teachersList.find(t => t.nip && t.nip.replace(/[\s\.\-]+/g, '') === cleanSavedNip);
    if (foundSaved) {
      localStorage.setItem('portal_logged_nip', foundSaved.nip);
      localStorage.setItem('portal_remember_nip', foundSaved.nip);
      const newUrl = `${window.location.pathname}?nip=${encodeURIComponent(cleanSavedNip)}`;
      window.history.replaceState({ nip: foundSaved.nip }, '', newUrl);
      showPortalView(foundSaved);
      showToast(`Selamat datang kembali, ${foundSaved.name}!`);
      return;
    }
  }

  const demoAdmin = sessionStorage.getItem('portal_demo_admin');
  if (demoAdmin) {
    switchToAdminPanel();
    return;
  }

  const defaultTeacher = teachersList.find(t => t.nip === "198109092022211004") || teachersList[0];
  if (defaultTeacher) {
    showPortalView(defaultTeacher);
  }
}

function showPortalView(teacher) {
  if (!teacher) return;
  activeTeacher = teacher;
  
  const nameEl = document.getElementById('active-teacher-name');
  const nipEl = document.getElementById('active-teacher-nip');
  const classEl = document.getElementById('active-teacher-class');
  const roleEl = document.getElementById('active-teacher-role');

  if (nameEl) nameEl.textContent = teacher.name;
  if (nipEl) nipEl.textContent = teacher.nip || '-';
  if (classEl) classEl.textContent = teacher.class || '-';
  if (roleEl) roleEl.textContent = teacher.role || 'Guru';

  renderUserPortalApp();
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

    onAuthStateChanged(auth, (user) => {
      if (user) {
        handleAdminLoginState(user.email, user.displayName);
      } else {
        handleAdminLogoutState();
      }
    });

    fetchFirestoreData();
  } else {
    if (cloudBadgeDot) cloudBadgeDot.classList.remove('online');
    if (cloudBadgeText) cloudBadgeText.textContent = "Mode Demo Lokal";
    if (statDbStatus) statDbStatus.textContent = "Lokal (Offline)";

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
  try {
    const [teachers, forms, schedules] = await Promise.all([
      fetchTeachers(),
      fetchForms(),
      fetchSchedules()
    ]);

    if (teachers && teachers.length > 0) {
      currentTeachers = teachers;
    }
    if (forms && forms.length > 0) {
      currentForms = sortAndNormalizeForms(forms);
    }
    if (schedules && schedules.length > 0) {
      currentSchedules = schedules;
    }

    console.log(`🔥 [App] Dimuat dari Firestore: ${currentTeachers.length} Guru, ${currentForms.length} Form, ${currentSchedules.length} Jadwal`);
  } catch (err) {
    console.error("❌ Error memuat data Firestore:", err);
  }

  const adminTab = document.getElementById('tab-admin');
  if (adminTab && adminTab.classList.contains('active')) {
    renderAdminTables();
  } else {
    checkUrlParamsForTeacher();
    renderUserPortalApp();
    renderAdminTables();
  }
}

/* ==========================================================================
   3. Auth & Strict Admin Security
   ========================================================================== */

async function handleAdminLoginState(email, displayName) {
  if (!email || !isAuthorizedAdminEmail(email)) {
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

  await fetchFirestoreData();
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

    const teachersList = (currentTeachers && currentTeachers.length > 0) ? currentTeachers : [];

    let found = teachersList.find(t => {
      if (!t.nip || t.nip === '-') return false;
      const teacherCleanNip = String(t.nip).trim().replace(/[\s\.\-]+/g, '');
      return teacherCleanNip === cleanVal;
    });

    if (!found) {
      const searchName = rawVal.trim().toLowerCase();
      if (searchName.length >= 3) {
        found = teachersList.find(t => t.name.toLowerCase().includes(searchName) && t.nip && t.nip !== '-');
      }
    }

    if (found) {
      if (landingError) landingError.classList.add('hidden');
      localStorage.setItem('portal_logged_nip', found.nip);
      const cleanTeacherNip = String(found.nip).trim().replace(/[\s\.\-]+/g, '');
      const newUrl = `${window.location.pathname}?nip=${encodeURIComponent(cleanTeacherNip)}`;
      window.history.pushState({ nip: found.nip }, '', newUrl);
      
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

  if (formLandingNip) formLandingNip.addEventListener('submit', processLandingNipSubmit);
  if (btnLandingGo) btnLandingGo.addEventListener('click', processLandingNipSubmit);
  if (landingNipInput) {
    landingNipInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') processLandingNipSubmit(e);
    });
  }

  if (btnBackToLanding) {
    btnBackToLanding.addEventListener('click', () => {
      localStorage.removeItem('portal_logged_nip');
      window.history.pushState({}, '', window.location.pathname);
      showToast('Sesi NIP ditutup. Silakan masukkan NIP lain.');
    });
  }
}

function renderUserPortalApp() {
  renderUserPortal(currentForms, activeTeacher, generateFormUrlForTeacher);
}

/* ==========================================================================
   5. Form Submission Logic & Android Bridge
   ========================================================================== */

// Intercept Klik Form untuk Cek Riwayat di Firestore
window.handleFormClick = async (event, formId, formName, generatedUrl) => {
  if (event) event.preventDefault();

  if (!activeTeacher || !activeTeacher.nip) {
    window.open(generatedUrl, '_blank');
    return;
  }

  const cleanNip = activeTeacher.nip.replace(/[\s\.\-]+/g, '');

  try {
    showToast(`⏳ Mengecek riwayat pengisian...`);
    const history = await checkFormSubmission(cleanNip, formId);

    if (history && history.timestamp) {
      // Jika sudah pernah isi hari ini, tampilkan modal konfirmasi
      const modal = document.getElementById('modal-form-confirm');
      const msgEl = document.getElementById('confirm-modal-msg');
      const btnYes = document.getElementById('btn-confirm-yes');
      const btnCancel = document.getElementById('btn-confirm-cancel');

      const ts = new Date(history.timestamp);
      const formattedDate = ts.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const formattedTime = ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      if (msgEl) {
        msgEl.innerHTML = `Anda sudah mengisi formulir <strong>${formName}</strong> pada <strong>${formattedDate} pukul ${formattedTime} WIB</strong>.<br><br>Apakah Anda ingin mengisi lagi?`;
      }

      if (btnYes) {
        btnYes.href = generatedUrl;
        btnYes.onclick = () => modal.classList.add('hidden');
      }

      if (btnCancel) {
        btnCancel.onclick = () => modal.classList.add('hidden');
      }

      if (modal) modal.classList.remove('hidden');
    } else {
      // Jika belum isi, langsung buka
      window.open(generatedUrl, '_blank');
    }
  } catch (err) {
    console.error("Gagal cek riwayat:", err);
    window.open(generatedUrl, '_blank');
  }
};

// Fungsi yang dipanggil oleh App Android saat Form berhasil dikirim
window.onFormSubmittedSuccessfully = async (formId) => {
  console.log(`🚀 [Bridge] Android mendeteksi form success: ${formId}`);

  if (!activeTeacher || !activeTeacher.nip) return;

  const form = currentForms.find(f => f.id === formId || (f.baseUrl && f.baseUrl.includes(formId)));
  const formName = form ? form.name : "Formulir";
  const cleanNip = activeTeacher.nip.replace(/[\s\.\-]+/g, '');

  try {
    await saveFormSubmission(cleanNip, formId, formName);
    showToast(`✅ Riwayat pengisian ${formName} berhasil dicatat!`);
  } catch (err) {
    console.error("Gagal mencatat riwayat pengisian:", err);
  }
};

/* ==========================================================================
   6. Admin Panel & CRUD Handlers
   ========================================================================== */

function renderAdminTables() {
  const statTeachers = document.getElementById('stat-total-teachers');
  const statForms = document.getElementById('stat-total-forms');
  if (statTeachers) statTeachers.textContent = currentTeachers.length;
  if (statForms) statForms.textContent = currentForms.length;

  renderTeachersTableApp();
  renderFormsTableApp();
  renderScheduleTableApp();
}

function renderTeachersTableApp(filterQuery = '') {
  renderTeachersTable(
    currentTeachers,
    (name) => {
      const teacher = currentTeachers.find(t => t.name === name);
      if (teacher) openTeacherModal(teacher);
    },
    async (name) => {
      if (confirm(`Yakin ingin menghapus data guru "${name}"?`)) {
        await deleteTeacherHandler(name);
      }
    },
    filterQuery
  );
}

function renderFormsTableApp() {
  renderFormsTable(
    currentForms,
    (id) => {
      const form = currentForms.find(f => f.id === id);
      if (form) openFormModal(form);
    },
    async (id) => {
      if (confirm('Yakin ingin menghapus formulir ini?')) {
        await deleteFormHandler(id);
      }
    }
  );
}

function renderScheduleTableApp(filterQuery = '') {
  renderScheduleTable(
    currentSchedules,
    (idx) => {
      if (confirm('Yakin ingin menghapus jadwal ini?')) {
        deleteScheduleHandler(idx);
      }
    },
    filterQuery
  );
}

async function deleteScheduleHandler(index) {
  if (currentSchedules && currentSchedules[index]) {
    const item = currentSchedules[index];
    currentSchedules.splice(index, 1);
    renderScheduleTableApp();

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

async function saveTeacherHandler(teacherData) {
  const existingIdx = currentTeachers.findIndex(t => t.name === teacherData.name);
  if (existingIdx >= 0) {
    currentTeachers[existingIdx] = { ...currentTeachers[existingIdx], ...teacherData };
  } else {
    currentTeachers.unshift(teacherData);
  }

  if (activeTeacher && activeTeacher.name === teacherData.name) {
    activeTeacher = { ...activeTeacher, ...teacherData };
    renderUserPortalApp();
  }

  try {
    await saveTeacherToFirestore(teacherData);
  } catch (e) {
    console.warn("Firestore sync warning:", e);
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
  showToast(`Data guru "${teacherData.name}" berhasil disimpan!`);
}

async function deleteTeacherHandler(teacherName) {
  const teacher = currentTeachers.find(t => t.name === teacherName);
  currentTeachers = currentTeachers.filter(t => t.name !== teacherName);

  if (teacher) {
    try {
      const docId = teacher.nip && teacher.nip !== '-' ? teacher.nip : teacher.name.replace(/[^a-zA-Z0-9]/g, '_');
      await deleteTeacherFromFirestore(docId);
    } catch (e) {
      console.warn("Firestore delete warning:", e);
    }
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
  showToast(`Data guru "${teacherName}" dihapus.`);
}

async function saveFormHandler(formData) {
  const existingIdx = currentForms.findIndex(f => f.id === formData.id);
  if (existingIdx >= 0) {
    currentForms[existingIdx] = formData;
  } else {
    currentForms.push(formData);
  }

  try {
    await saveFormToFirestore(formData);
  } catch (e) {
    console.warn("Firestore form sync warning:", e);
  }

  renderAdminTables();
  renderUserPortalApp();
  showToast(`Formulir "${formData.name}" berhasil disimpan!`);
}

async function deleteFormHandler(formId) {
  currentForms = currentForms.filter(f => f.id !== formId);

  try {
    await deleteFormFromFirestore(formId);
  } catch (e) {
    console.warn("Firestore form delete warning:", e);
  }

  renderAdminTables();
  renderUserPortalApp();
  showToast("Formulir telah dihapus.");
}

async function seedMasterTeachersToFirestore() {
  showToast("Memuat ulang data master dari Cloud Firestore...");
  await fetchFirestoreData();
  showToast("✅ Data Cloud Firestore berhasil disinkronkan ke layar!");
  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
}

/* ==========================================================================
   6. Impor & Ekspor Excel (.xlsx / .xls / JSON)
   ========================================================================== */

export function exportTeachersToExcel() {
  exportExcelService(currentTeachers, currentForms, showToast, generateFormUrlForTeacher);
}

export function exportTeachersToJSON() {
  exportJSONService(currentTeachers, showToast);
}

window.exportTeachersToExcel = exportTeachersToExcel;
window.exportTeachersToJSON = exportTeachersToJSON;

function initImportExport() {
  const inputFileExcel = document.getElementById('input-file-excel');
  const statusDiv = document.getElementById('import-preview-status');

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
          await processImportedExcelRows(rows, currentTeachers, getDb, isFirebaseActive, showToast, (updated) => {
            currentTeachers = updated;
            renderAdminTables();
            populateGuruSelect(document.getElementById('portal-guru-select'));
          }, statusDiv);
        } catch (err) {
          console.error("Gagal membaca file Excel:", err);
          if (statusDiv) statusDiv.textContent = `❌ Gagal membaca file Excel: ${err.message}`;
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

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
          
          let targetSheet = workbook.Sheets[workbook.SheetNames[0]];
          for (const name of workbook.SheetNames) {
            if (name.toLowerCase().includes('jadwal')) {
              targetSheet = workbook.Sheets[name];
              break;
            }
          }

          const rows = xlsxLib.utils.sheet_to_json(targetSheet, { header: 1, raw: false, dateNF: 'HH:mm' });
          await processImportedScheduleRows(rows, getDb, showToast, (newSchedules) => {
            currentSchedules = newSchedules;
            renderScheduleTableApp();
          });
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

/* ==========================================================================
   7. Form Builder
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

  if (formSelect) {
    formSelect.innerHTML = currentForms.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  }

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

  const modalTeacher = document.getElementById('modal-teacher-form');
  const btnOpenTeacher = document.getElementById('btn-modal-add-teacher');
  const btnCloseTeacher = document.getElementById('btn-close-teacher-modal');
  const formTeacher = document.getElementById('form-manage-teacher');

  if (btnOpenTeacher) btnOpenTeacher.addEventListener('click', () => openTeacherModal());
  if (btnCloseTeacher) btnCloseTeacher.addEventListener('click', () => modalTeacher.classList.add('hidden'));

  if (formTeacher) {
    formTeacher.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-teacher-name').value.trim();
      const nip = document.getElementById('edit-teacher-nip').value.trim();
      const role = document.getElementById('edit-teacher-role').value;
      const teacherClass = document.getElementById('edit-teacher-class').value;
      const guruWaliClass = document.getElementById('edit-teacher-guru-wali-class') ? document.getElementById('edit-teacher-guru-wali-class').value : '-';
      const journalFormUrl = document.getElementById('edit-teacher-journal-url').value.trim();

      await saveTeacherHandler({ name, nip, role, class: teacherClass, guruWaliClass, journalFormUrl });
      modalTeacher.classList.add('hidden');
    });
  }

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
  const classInp = document.getElementById('edit-teacher-class');
  const guruWaliClassInp = document.getElementById('edit-teacher-guru-wali-class');
  const journalInp = document.getElementById('edit-teacher-journal-url');

  if (teacher) {
    title.innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Data Guru`;
    nameInp.value = teacher.name;
    nameInp.readOnly = true;
    nipInp.value = teacher.nip && teacher.nip !== '-' ? teacher.nip : '';
    roleInp.value = teacher.role || 'Walikelas';
    if (classInp) classInp.value = teacher.class || '-';
    if (guruWaliClassInp) guruWaliClassInp.value = teacher.guruWaliClass || '-';
    if (journalInp) journalInp.value = teacher.journalFormUrl || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-user-plus"></i> Tambah Data Guru`;
    nameInp.value = '';
    nameInp.readOnly = false;
    nipInp.value = '';
    roleInp.value = 'Walikelas';
    if (classInp) classInp.value = '-';
    if (guruWaliClassInp) guruWaliClassInp.value = '-';
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
   9. Helper Utilities (Toast, Clipboard, Clock)
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

function initLiveClock() {
  const timeElem = document.getElementById('current-time');
  if (!timeElem) return;
  const update = () => {
    timeElem.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false }) + " WIB";
  };
  update();
  setInterval(update, 1000);
}
