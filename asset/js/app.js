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
} from './firebase-config.js?v=3.9.5';

import {
  fetchTeachers,
  fetchForms,
  fetchSchedules,
  fetchStudents,
  saveTeacherToFirestore,
  updateTeacherPin,
  deleteTeacherFromFirestore,
  saveFormToFirestore,
  deleteFormFromFirestore,
  saveFormSubmission,
  checkFormSubmission,
  fetchLearningObjectives
} from './modules/firestore-service.js?v=3.9.5';

import {
  formatTimeString
} from './modules/formatters.js?v=3.9.5';

import {
  getActiveTeacherSchedule as getActiveTeacherScheduleModule,
  generateFormUrlForTeacher as generateFormUrlForTeacherModule,
  sortAndNormalizeForms
} from './modules/schedule-resolver.js?v=3.9.5';

import { initTheme } from './modules/theme-manager.js?v=3.9.5';
import { isAuthorizedAdminEmail } from './modules/auth-manager.js?v=3.9.5';
import {
  exportTeachersToExcel as exportExcelService,
  exportTeachersToJSON as exportJSONService,
  processImportedExcelRows,
  processImportedScheduleRows,
  getPersonalPortalUrl
} from './modules/excel-service.js?v=3.9.5';

import {
  renderUserPortal,
  renderTeachersTable,
  renderFormsTable,
  renderScheduleTable
} from './modules/ui-renderers.js?v=3.9.5';

// State Capaian / Tujuan Pembelajaran (TP)
let selectedLearningObjectiveMateri = "";
let learningObjectivesData = null;

// Helper wrappers to preserve signatures
function getActiveTeacherSchedule(teacher, now = new Date()) {
  return getActiveTeacherScheduleModule(teacher, now, currentSchedules);
}

function generateFormUrlForTeacher(form, teacher) {
  const now = new Date();
  const todaySchedule = getActiveTeacherSchedule(teacher, now);
  const currentKelas = todaySchedule ? todaySchedule.kelas : (teacher ? teacher.class : '');
  const teacherCleanNip = teacher && teacher.nip ? String(teacher.nip).replace(/\D/g, '') : '';
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${mm}-${dd}`;

  // Cek jika ada simpanan presensi untuk sesi ini
  const savedAttendStr = localStorage.getItem(`portal_attend_${teacherCleanNip}_${currentKelas}_${dateKey}`);
  let customOpts = {
    materi: selectedLearningObjectiveMateri
  };

  if (savedAttendStr) {
    try {
      const saved = JSON.parse(savedAttendStr);
      customOpts.jumlahHadir = saved.jumlahHadir;
      const isAbsensi = form.id === "form_absensi_guru" || form.id === "form_absensi_mengajar" || (form.name && form.name.toLowerCase().includes("absensi mengajar"));
      customOpts.ketTidakHadir = isAbsensi ? saved.absensiKet : saved.jurnalKet;
    } catch (e) {}
  } else if (currentStudents && currentStudents.length > 0 && currentKelas) {
    const normalizedTargetClass = currentKelas.replace(/\s+/g, ' ').toLowerCase();
    const classCount = currentStudents.filter(s => (s.nama_kelas || '').replace(/\s+/g, ' ').toLowerCase() === normalizedTargetClass).length;
    if (classCount > 0) {
      customOpts.jumlahHadir = classCount;
      customOpts.ketTidakHadir = "Nihil";
    }
  }

  return generateFormUrlForTeacherModule(form, teacher, now, currentSchedules, customOpts);
}

const DEFAULT_MASTER_FORMS = [
  {
    id: "form_absensi_mengajar",
    name: "Form Absensi Mengajar",
    category: "Absensi Mengajar",
    icon: "fa-solid fa-clipboard-user",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfrm87oC00zamhQQBP4LS5BcwxSHa97M9plvLpYUHQ7dR-ybQ/viewform",
    isActive: true,
    order: 1
  },
  {
    id: "form_jurnal_mengajar",
    name: "Form Jurnal Mengajar",
    category: "Jurnal Mengajar",
    icon: "fa-solid fa-book-bookmark",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform",
    isActive: true,
    order: 2
  },
  {
    id: "form_absensi_piket",
    name: "Form Absensi Guru Piket",
    category: "Piket",
    icon: "fa-solid fa-user-shield",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeqL7g8V929dSqE1t_3y8oRgZe_fUJ_mC-V1rlroRzVWcns2w/viewform",
    isActive: true,
    order: 3
  },
  {
    id: "form_wali_kelas",
    name: "Pengumpulan Laporan Wali Kelas",
    category: "Wali Kelas",
    icon: "fa-solid fa-user-tie",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform",
    isActive: true,
    order: 4
  },
  {
    id: "form_guru_wali",
    name: "Form Pendampingan Guru Wali",
    category: "Guru Wali",
    icon: "fa-solid fa-people-roof",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeVYQG1tPodad-cUyHW5Mzx3CmO3L8GOx8AzWXajJqYkqbkBg/viewform",
    isActive: true,
    order: 5
  }
];

// State Aplikasi (100% Murni Dimuat Real-Time dari Cloud Firestore)
let currentTeachers = [];
let currentForms = DEFAULT_MASTER_FORMS;
let currentSchedules = [];
let currentStudents = [];
let activeTeacher = null;
let currentUser = null;

async function bootstrapApp() {
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

  // Render Portal secara langsung tanpa menunggu jaringan
  checkUrlParamsForTeacher();

  // 1. Muat data langsung dari Cloud Firestore di latar belakang
  await fetchFirestoreData();

  // 2. Inisialisasi Firebase & Auth Listener
  setupFirebaseConnection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

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
      localStorage.removeItem('portal_logged_pin');
      sessionStorage.removeItem('portal_demo_admin');
      if (auth && isFirebaseActive) {
        try { await signOut(auth); } catch (e) {}
      }
      // Redirect ke landing page dengan parameter logout agar tidak auto-login
      window.location.href = '../../autoform.html?logout=true';
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

  const savedNip = localStorage.getItem('portal_logged_nip') || localStorage.getItem('portal_remember_nip');
  const savedPin = localStorage.getItem('portal_logged_pin') || localStorage.getItem('portal_remember_pin');

  const fallbackIskak = {
    id: "198109092022211004",
    nip: "198109092022211004",
    name: "MUCHAMAD ISKAK FATONI, S.Pd.",
    class: "XII TEI 2",
    guruWaliClass: "XI TEI 1",
    role: "Walikelas",
    pin: "231008",
    journalFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform"
  };

  const targetNip = (nipParam && nipParam !== '-') ? nipParam : savedNip;

  if (targetNip && targetNip !== '-') {
    const cleanTargetNip = String(targetNip).replace(/\D/g, '');
    let found = teachersList.find(t => {
      if (!t.nip || t.nip === '-') return false;
      const tNipStr = String(t.nip).trim();
      return (cleanTargetNip && tNipStr.replace(/\D/g, '') === cleanTargetNip) || (tNipStr === String(targetNip).trim());
    });

    if (!found && (cleanTargetNip === "198109092022211004" || String(targetNip).toLowerCase().includes("iskak"))) {
      found = fallbackIskak;
    }

    if (!found && targetNip) {
      found = {
        id: targetNip,
        nip: targetNip,
        name: `Guru (${targetNip})`,
        class: "XI TEI 2",
        role: "Guru",
        pin: savedPin || "12345"
      };
    }

    if (found) {
      const expectedPin = (found.pin && String(found.pin).trim() !== '') ? String(found.pin).trim() : '12345';
      const actualPin = savedPin || '12345';

      if (!savedPin || actualPin === expectedPin || expectedPin === '12345' || found.id === "198109092022211004") {
        localStorage.setItem('portal_logged_nip', found.nip);
        if (savedPin) localStorage.setItem('portal_logged_pin', savedPin);

        const newUrl = `${window.location.pathname}?nip=${encodeURIComponent(found.nip)}`;
        if (window.location.search !== `?nip=${encodeURIComponent(found.nip)}`) {
          window.history.replaceState({ nip: found.nip }, '', newUrl);
        }

        showPortalView(found);
        return;
      }
    }
  }

  const demoAdmin = sessionStorage.getItem('portal_demo_admin');
  if (demoAdmin) {
    switchToAdminPanel();
    return;
  }

  // Jika benar-benar tidak ada NIP / Sesi sama sekali:
  // Bersihkan sesi lokal yang rusak agar tidak terjadi loop redirect dengan autoform.html
  localStorage.removeItem('portal_logged_nip');
  localStorage.removeItem('portal_logged_pin');
  window.location.href = '../../autoform.html';
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

// Cache untuk daftar TP multi-tingkat
let learningObjectivesCache = {};

// Metadata konfigurasi Mata Pelajaran & Silabus TP
const MAPEL_TP_CONFIG = {
  koding_ai_xi: {
    id: 'koding_ai_xi',
    title: 'Koding dan Kecerdasan Artifisial',
    label: 'Kelas XI (Koding & AI)',
    totalMeetings: 35,
    formMapelName: 'Koding dan Kecerdasan Artifisial'
  },
  ske_xi: {
    id: 'ske_xi',
    title: 'Mapel Pilihan dan Sistem Kendali Elektronika',
    label: 'Kelas XI (Arduino & Embedded)',
    totalMeetings: 35,
    formMapelName: 'Mapel Pilihan dan Sistem Kendali Elektronika'
  },
  ske_xii: {
    id: 'ske_xii',
    title: 'Mapel Pilihan dan Sistem Kendali Elektronika',
    label: 'Kelas XII (ESP32 & IoT)',
    totalMeetings: 35,
    formMapelName: 'Mapel Pilihan dan Sistem Kendali Elektronika'
  }
};

// Helper Key & Persistence Kehadiran Siswa Hari Ini
function getTodayAttendanceKey(cleanNip, className) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${mm}-${dd}`;
  return `portal_attend_${cleanNip}_${className}_${dateKey}`;
}

function getTodaySavedAttendance(cleanNip, className, totalCount = 36) {
  const key = getTodayAttendanceKey(cleanNip, className);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.absentStudents)) {
        return parsed;
      }
    } catch (e) {}
  }
  return {
    absentStudents: [],
    jumlahHadir: totalCount,
    jumlahTidakHadir: 0,
    absensiKet: "Nihil",
    jurnalKet: "Nihil"
  };
}

function saveTodayAttendance(cleanNip, className, attendObj) {
  const key = getTodayAttendanceKey(cleanNip, className);
  localStorage.setItem(key, JSON.stringify(attendObj));
}

// Helper Filter Siswa berdasarkan Kelas
function getFilteredStudentsByClass(targetClass, studentList) {
  const list = (studentList && studentList.length > 0) ? studentList : [];
  const normalized = String(targetClass || '').replace(/\s+/g, ' ').toLowerCase();
  let filtered = list.filter(s => {
    const sClass = String(s.nama_kelas || '').replace(/\s+/g, ' ').toLowerCase();
    return sClass === normalized || sClass.includes(normalized) || normalized.includes(sClass);
  });
  return filtered.length > 0 ? filtered : list;
}

/* ==========================================================================
   MODAL 1: PRESENSI SISWA DINAMIS KHUSUS FORM ABSENSI MENGAJAR
   ========================================================================== */
async function openAbsensiModal(formId, formName) {
  const modal = document.getElementById('modal-absensi-siswa');
  const btnClose = document.getElementById('btn-close-absensi-modal');
  const btnCancel = document.getElementById('btn-cancel-absensi-modal');
  const titleEl = document.getElementById('modal-absensi-schedule-title');
  const subEl = document.getElementById('modal-absensi-schedule-sub');
  const classSelectEl = document.getElementById('modal-absensi-select-class');
  const countSelectEl = document.getElementById('modal-absensi-select-count');
  const presentCountEl = document.getElementById('modal-absensi-present-count');
  const absentCountEl = document.getElementById('modal-absensi-absent-count');
  const studentListEl = document.getElementById('modal-absensi-student-list');
  const btnAddAbsent = document.getElementById('btn-absensi-add-student');
  const btnResetAll = document.getElementById('btn-absensi-reset-all-present');
  const btnSubmit = document.getElementById('btn-submit-absensi-modal');

  if (!modal || !btnSubmit) return;

  const closeModal = () => modal.classList.add('hidden');
  if (btnClose) btnClose.onclick = closeModal;
  if (btnCancel) btnCancel.onclick = closeModal;

  // Buka modal seketika
  modal.classList.remove('hidden');

  // Pastikan data siswa telah dimuat
  if (!currentStudents || currentStudents.length === 0) {
    try {
      currentStudents = await fetchStudents();
    } catch (e) {
      console.warn('Gagal memuat siswa dari Firestore:', e);
    }
  }

  const teacher = activeTeacher || {};
  const teacherCleanNip = String(teacher.nip || '').replace(/\D/g, '');
  const now = new Date();
  const todaySchedule = getActiveTeacherSchedule(teacher, now, currentSchedules);

  const activeMapelName = todaySchedule ? (todaySchedule.mataPelajaran || '') : 'Presensi KBM';
  const detectedKelas = todaySchedule ? todaySchedule.kelas : (teacher.class || 'XI TEI 2');

  // Setup list pilihan kelas
  const availableClassesSet = new Set();
  if (currentStudents && currentStudents.length > 0) {
    currentStudents.forEach(s => { if (s.nama_kelas) availableClassesSet.add(s.nama_kelas.trim()); });
  }
  if (currentSchedules && currentSchedules.length > 0) {
    currentSchedules.forEach(sc => { if (sc.kelas) availableClassesSet.add(sc.kelas.trim()); });
  }
  if (availableClassesSet.size === 0) {
    ['XI TEI 1', 'XI TEI 2', 'XII TEI 1', 'XII TEI 2'].forEach(c => availableClassesSet.add(c));
  }
  const availableClasses = Array.from(availableClassesSet).sort();
  let activeClass = availableClasses.find(c => c.toLowerCase() === (detectedKelas || '').toLowerCase()) || availableClasses[0];

  if (classSelectEl) {
    classSelectEl.innerHTML = availableClasses.map(c => 
      `<option value="${c}" ${c === activeClass ? 'selected' : ''}>${c}</option>`
    ).join('');
  }

  let classStudents = getFilteredStudentsByClass(activeClass, currentStudents);
  let totalClassCount = classStudents.length || 36;

  // Update Tampilan Informasi Sesi KBM
  const updateScheduleBadge = (cls) => {
    if (titleEl) titleEl.textContent = activeMapelName || 'Presensi KBM Mengajar';
    if (subEl) {
      const jamKe = todaySchedule ? `Jam Ke: ${todaySchedule.jamKe}` : 'Jam Reguler';
      const ruang = todaySchedule && todaySchedule.keterangan ? ` | Ruang: ${todaySchedule.keterangan}` : '';
      subEl.textContent = `Kelas: ${cls || activeClass} (${totalClassCount} Siswa) | ${jamKe}${ruang}`;
    }
  };
  updateScheduleBadge(activeClass);

  // Load Saved Attendance State
  let savedState = getTodaySavedAttendance(teacherCleanNip, activeClass, totalClassCount);
  let absentStudents = [...(savedState.absentStudents || [])];

  const absensiForm = currentForms.find(f => f.id === formId || f.id === 'form_absensi_guru' || f.id === 'form_absensi_mengajar' || (f.name && f.name.toLowerCase().includes('absensi'))) || {
    id: 'form_absensi_mengajar',
    name: 'Form Absensi Mengajar'
  };

  // Fungsi Regenerasi URL & Simpan State
  const updateAbsensiUrl = () => {
    const jumlahTidakHadir = absentStudents.length;
    const jumlahHadir = Math.max(0, totalClassCount - jumlahTidakHadir);
    const absensiKet = jumlahTidakHadir === 0 ? "Nihil" : `${jumlahTidakHadir} (${absentStudents.map(a => `${a.name}: ${a.reason}`).join(', ')})`;
    const jurnalKet = jumlahTidakHadir === 0 ? "Nihil" : absentStudents.map(a => `${a.name} (${a.reason})`).join(', ');

    // Simpan ke storage
    saveTodayAttendance(teacherCleanNip, activeClass, {
      absentStudents,
      jumlahHadir,
      jumlahTidakHadir,
      absensiKet,
      jurnalKet
    });

    // Update Counter UI
    if (presentCountEl) presentCountEl.textContent = `${jumlahHadir} Siswa`;
    if (absentCountEl) {
      if (jumlahTidakHadir === 0) {
        absentCountEl.textContent = "0 (Nihil)";
        absentCountEl.style.color = "#10b981";
      } else {
        absentCountEl.textContent = `${jumlahTidakHadir} Siswa`;
        absentCountEl.style.color = "#ef4444";
      }
    }

    if (countSelectEl) {
      countSelectEl.value = String(Math.min(10, jumlahTidakHadir));
    }

    // Generate Final Pre-filled Link Form Absensi
    const absensiUrl = generateFormUrlForTeacherModule(absensiForm, activeTeacher, new Date(), currentSchedules, {
      jumlahHadir: jumlahHadir,
      ketTidakHadir: absensiKet
    });
    btnSubmit.href = absensiUrl;
  };

  // Render Baris Dropdown Siswa Tidak Hadir
  const renderAttendanceRows = () => {
    if (!studentListEl) return;

    if (absentStudents.length === 0) {
      studentListEl.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--text-secondary); font-style: italic; padding: 6px 0; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Semua siswa hadir (Presensi Nihil).
        </div>
      `;
      updateAbsensiUrl();
      return;
    }

    const isLightMode = document.body.classList.contains('light-mode');
    const optBg = isLightMode ? '#ffffff' : '#171f33';
    const optColor = isLightMode ? '#0f172a' : '#f8fafc';

    studentListEl.innerHTML = absentStudents.map((item, idx) => {
      const studentOptions = classStudents.map(s => {
        const isSel = (s.nis && s.nis === item.nis) || (s.nama_siswa === item.name);
        return `<option value="${s.nis || s.nama_siswa}" data-nama="${s.nama_siswa}" style="background-color: ${optBg} !important; color: ${optColor} !important;" ${isSel ? 'selected' : ''}>${s.nama_siswa} (${s.nis || '-'})</option>`;
      }).join('');

      return `
        <div class="absent-student-row" data-index="${idx}" style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); width: 16px;">${idx + 1}.</span>
          <select class="form-control select-absent-student" data-index="${idx}" style="flex: 2; padding: 0.45rem 0.6rem; font-size: 0.8rem; border-radius: var(--radius-sm); background-color: #171f33 !important; border: 1px solid rgba(255,255,255,0.15) !important; color: #f8fafc !important;">
            ${studentOptions}
          </select>
          <select class="form-control select-absent-reason" data-index="${idx}" style="flex: 1.2; padding: 0.45rem 0.6rem; font-size: 0.8rem; border-radius: var(--radius-sm); background-color: #171f33 !important; border: 1px solid rgba(255,255,255,0.15) !important; color: #f8fafc !important;">
            <option value="Sakit" ${item.reason === 'Sakit' ? 'selected' : ''}>🤒 Sakit</option>
            <option value="Izin" ${item.reason === 'Izin' ? 'selected' : ''}>✉️ Izin</option>
            <option value="Alfa" ${item.reason === 'Alfa' ? 'selected' : ''}>⚠️ Alfa</option>
            <option value="Dispensasi" ${item.reason === 'Dispensasi' ? 'selected' : ''}>🏷️ Dispensasi</option>
          </select>
          <button type="button" class="btn-delete-absent" data-index="${idx}" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; width: 28px; height: 28px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;" title="Hapus">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
    }).join('');

    // Pasang listener pada baris
    studentListEl.querySelectorAll('.select-absent-student').forEach(sel => {
      sel.onchange = (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        const selectedOpt = e.target.options[e.target.selectedIndex];
        const studentName = selectedOpt.getAttribute('data-nama') || selectedOpt.text;
        const studentNis = e.target.value;
        if (absentStudents[index]) {
          absentStudents[index].nis = studentNis;
          absentStudents[index].name = studentName;
          updateAbsensiUrl();
        }
      };
    });

    studentListEl.querySelectorAll('.select-absent-reason').forEach(sel => {
      sel.onchange = (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        if (absentStudents[index]) {
          absentStudents[index].reason = e.target.value;
          updateAbsensiUrl();
        }
      };
    });

    studentListEl.querySelectorAll('.btn-delete-absent').forEach(btn => {
      btn.onclick = (e) => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        absentStudents.splice(index, 1);
        renderAttendanceRows();
      };
    });

    updateAbsensiUrl();
  };

  // Listener Pergantian Kelas
  if (classSelectEl) {
    classSelectEl.onchange = (e) => {
      activeClass = e.target.value;
      classStudents = getFilteredStudentsByClass(activeClass, currentStudents);
      totalClassCount = classStudents.length || 36;
      updateScheduleBadge(activeClass);
      savedState = getTodaySavedAttendance(teacherCleanNip, activeClass, totalClassCount);
      absentStudents = [...(savedState.absentStudents || [])];
      renderAttendanceRows();
    };
  }

  // Listener Dropdown Jumlah Siswa Tidak Masuk
  if (countSelectEl) {
    countSelectEl.onchange = (e) => {
      const targetCount = parseInt(e.target.value, 10) || 0;
      if (targetCount === 0) {
        absentStudents = [];
      } else if (targetCount > absentStudents.length) {
        const diff = targetCount - absentStudents.length;
        for (let i = 0; i < diff; i++) {
          const availableStudent = classStudents.find(s => !absentStudents.some(a => (a.nis && a.nis === s.nis) || a.name === s.nama_siswa)) || classStudents[i % classStudents.length];
          absentStudents.push({
            nis: availableStudent ? (availableStudent.nis || '') : '',
            name: availableStudent ? (availableStudent.nama_siswa || `Siswa ${absentStudents.length + 1}`) : `Siswa ${absentStudents.length + 1}`,
            reason: 'Sakit'
          });
        }
      } else if (targetCount < absentStudents.length) {
        absentStudents = absentStudents.slice(0, targetCount);
      }
      renderAttendanceRows();
    };
  }

  // Listener Tombol Tambah Siswa
  if (btnAddAbsent) {
    btnAddAbsent.onclick = () => {
      const availableStudent = classStudents.find(s => !absentStudents.some(a => (a.nis && a.nis === s.nis) || a.name === s.nama_siswa)) || classStudents[0];
      if (availableStudent) {
        absentStudents.push({
          nis: availableStudent.nis || '',
          name: availableStudent.nama_siswa || 'Siswa',
          reason: 'Sakit'
        });
      } else {
        absentStudents.push({
          nis: '',
          name: `Siswa ${absentStudents.length + 1}`,
          reason: 'Sakit'
        });
      }
      renderAttendanceRows();
    };
  }

  // Listener Reset Semua Hadir
  if (btnResetAll) {
    btnResetAll.onclick = () => {
      absentStudents = [];
      renderAttendanceRows();
      showToast('Presensi di-set Semua Hadir (Nihil)');
    };
  }

  // Submit Handler
  btnSubmit.onclick = () => {
    closeModal();
    showToast('Membuka Form Absensi Mengajar...');
  };

  renderAttendanceRows();
}

/* ==========================================================================
   MODAL 2: PEMILIHAN CAPAIAN PEMBELAJARAN (TP) KHUSUS FORM JURNAL MENGAJAR
   (Presensi Otomatis Mengikuti Data Form Absensi)
   ========================================================================== */
async function openTpModalForJournal(formId, formName) {
  const modal = document.getElementById('modal-select-tp');
  const mapelSelectEl = document.getElementById('modal-select-tp-mapel');
  const selectEl = document.getElementById('modal-select-learning-objective');
  const wrapperSelectObjective = document.getElementById('wrapper-select-learning-objective');
  const titleEl = document.getElementById('modal-tp-schedule-title');
  const subEl = document.getElementById('modal-tp-schedule-sub');
  const previewBox = document.getElementById('modal-tp-preview-box');
  const counterEl = document.getElementById('modal-tp-counter');
  const attendSummaryText = document.getElementById('modal-tp-attend-summary-text');
  const btnSwitchToAbsensi = document.getElementById('btn-tp-switch-to-absensi');
  const btnSubmit = document.getElementById('btn-submit-tp-modal');
  const btnClose = document.getElementById('btn-close-tp-modal');
  const btnCancel = document.getElementById('btn-cancel-tp-modal');

  if (!modal || !selectEl || !btnSubmit) return;

  const closeModal = () => modal.classList.add('hidden');
  if (btnClose) btnClose.onclick = closeModal;
  if (btnCancel) btnCancel.onclick = closeModal;

  // Buka Modal Langsung
  modal.classList.remove('hidden');

  const teacher = activeTeacher || {};
  const teacherCleanNip = String(teacher.nip || '').replace(/\D/g, '');
  const now = new Date();
  const todaySchedule = getActiveTeacherSchedule(teacher, now, currentSchedules);

  // 1. Deteksi Mapel & Kelas
  const activeMapelName = todaySchedule ? (todaySchedule.mataPelajaran || '') : '';
  const detectedKelas = todaySchedule ? todaySchedule.kelas : (teacher.class || 'XI TEI 2');
  const isKelas12 = detectedKelas && (detectedKelas.includes('XII') || detectedKelas.includes('12'));

  let detectedMapelKey = 'koding_ai_xi';
  const lowerMapel = activeMapelName.toLowerCase();
  if (lowerMapel.includes('koding') || lowerMapel.includes('kecerdasan') || lowerMapel.includes('artifisial') || lowerMapel.includes('ai')) {
    detectedMapelKey = 'koding_ai_xi';
  } else if (lowerMapel.includes('kendali') || lowerMapel.includes('ske') || lowerMapel.includes('pilihan')) {
    detectedMapelKey = isKelas12 ? 'ske_xii' : 'ske_xi';
  } else {
    const teachesKoding = currentSchedules.some(s => 
      s.nip && teacher.nip && String(s.nip).replace(/\D/g, '') === String(teacher.nip).replace(/\D/g, '') &&
      s.mataPelajaran && (s.mataPelajaran.toLowerCase().includes('koding') || s.mataPelajaran.toLowerCase().includes('kecerdasan'))
    );
    const teachesSke = currentSchedules.some(s => 
      s.nip && teacher.nip && String(s.nip).replace(/\D/g, '') === String(teacher.nip).replace(/\D/g, '') &&
      s.mataPelajaran && s.mataPelajaran.toLowerCase().includes('kendali')
    );

    if (teachesKoding) {
      detectedMapelKey = 'koding_ai_xi';
    } else if (teachesSke) {
      detectedMapelKey = isKelas12 ? 'ske_xii' : 'ske_xi';
    }
  }

  const prefMapelKey = localStorage.getItem(`portal_last_mapel_${teacherCleanNip}`) || detectedMapelKey;
  let activeMapelKey = MAPEL_TP_CONFIG[prefMapelKey] || prefMapelKey === 'custom_manual' ? prefMapelKey : detectedMapelKey;

  if (mapelSelectEl) {
    mapelSelectEl.value = activeMapelKey;
  }

  // Update Tampilan Sesi KBM
  const updateScheduleBadge = (mapelKey) => {
    const config = MAPEL_TP_CONFIG[mapelKey];
    const displayMapelTitle = config ? `${config.title} - ${config.label}` : (activeMapelName || 'Materi Kustom / Mandiri');
    if (titleEl) titleEl.textContent = displayMapelTitle;
    if (subEl) {
      const jamKe = todaySchedule ? `Jam Ke: ${todaySchedule.jamKe}` : 'Jam Reguler';
      const ruang = todaySchedule && todaySchedule.keterangan ? ` | Ruang: ${todaySchedule.keterangan}` : '';
      subEl.textContent = `Kelas: ${detectedKelas} | ${jamKe}${ruang}`;
    }
  };
  updateScheduleBadge(activeMapelKey);

  // 2. Baca Data Presensi Siswa yang Mengikuti Sesi Hari Ini
  const classStudents = getFilteredStudentsByClass(detectedKelas, currentStudents);
  const totalClassCount = classStudents.length || 36;
  const savedAttend = getTodaySavedAttendance(teacherCleanNip, detectedKelas, totalClassCount);

  if (attendSummaryText) {
    if (savedAttend.jumlahTidakHadir === 0) {
      attendSummaryText.innerHTML = `<span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> ${savedAttend.jumlahHadir} Siswa Hadir (Presensi Nihil)</span>`;
    } else {
      attendSummaryText.innerHTML = `
        <span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> ${savedAttend.jumlahHadir} Hadir</span> &bull; 
        <span style="color: #ef4444;"><i class="fa-solid fa-circle-xmark"></i> ${savedAttend.jumlahTidakHadir} Tidak Hadir (${savedAttend.jurnalKet})</span>
      `;
    }
  }

  // Tombol Beralih ke Form Absensi jika Guru ingin mengedit presensi
  if (btnSwitchToAbsensi) {
    btnSwitchToAbsensi.onclick = () => {
      closeModal();
      openAbsensiModal('form_absensi_mengajar', 'Form Absensi Mengajar');
    };
  }

  const targetForm = currentForms.find(f => f.id === formId || (f.name && f.name.toLowerCase().includes('jurnal'))) || {
    id: 'form_jurnal_mengajar',
    name: 'Form Jurnal Mengajar Guru'
  };

  // 3. Fungsi Update Final URL Jurnal
  const updateModalUrl = () => {
    const currentMapel = mapelSelectEl ? mapelSelectEl.value : activeMapelKey;
    const isCustom = currentMapel === 'custom_manual';
    const config = MAPEL_TP_CONFIG[currentMapel];

    let materiText = '';
    let meetingNum = '1';

    if (isCustom) {
      materiText = previewBox ? previewBox.value.trim() : '';
      if (counterEl) counterEl.textContent = 'Materi Mandiri';
    } else {
      const selectedOption = selectEl.options[selectEl.selectedIndex];
      materiText = previewBox ? previewBox.value.trim() : (selectedOption ? decodeURIComponent(selectedOption.getAttribute('data-materi') || '') : '');
      meetingNum = selectedOption ? selectedOption.value : '1';
      const totalTp = (learningObjectivesCache[currentMapel] && learningObjectivesCache[currentMapel].listTp) ? learningObjectivesCache[currentMapel].listTp.length : 35;
      if (counterEl) counterEl.textContent = `Pertemuan ${meetingNum} / ${totalTp}`;

      const storageKey = `portal_tp_selected_${teacherCleanNip}_${currentMapel}`;
      localStorage.setItem(storageKey, meetingNum);
    }

    const finalMapelName = config ? config.formMapelName : (todaySchedule ? todaySchedule.mataPelajaran : '');

    // Generate Final URL untuk Form Jurnal Mengajar (Dengan Presensi Mengikuti)
    const journalUrl = generateFormUrlForTeacherModule(targetForm, activeTeacher, new Date(), currentSchedules, {
      materi: materiText,
      mapel: finalMapelName,
      jumlahHadir: savedAttend.jumlahHadir,
      ketTidakHadir: savedAttend.jurnalKet
    });
    btnSubmit.href = journalUrl;
  };

  // 4. Load Silabus & Materi (CP)
  const loadTpForMapel = async (mapelKey) => {
    activeMapelKey = mapelKey;
    localStorage.setItem(`portal_last_mapel_${teacherCleanNip}`, mapelKey);
    updateScheduleBadge(mapelKey);

    const isLightMode = document.body.classList.contains('light-mode');
    const optBg = isLightMode ? '#ffffff' : '#171f33';
    const optColor = isLightMode ? '#0f172a' : '#f8fafc';

    if (mapelKey === 'custom_manual') {
      if (wrapperSelectObjective) wrapperSelectObjective.style.display = 'none';
      if (previewBox) {
        const savedCustom = localStorage.getItem(`portal_custom_materi_${teacherCleanNip}`) || '';
        previewBox.value = savedCustom;
        previewBox.placeholder = 'Ketik deskripsi capaian pembelajaran / materi pertemuan ini secara mandiri...';
      }
      updateModalUrl();
      return;
    }

    if (wrapperSelectObjective) wrapperSelectObjective.style.display = 'block';

    if (!learningObjectivesCache[mapelKey]) {
      showToast('Memuat silabus materi KBM...');
      learningObjectivesCache[mapelKey] = await fetchLearningObjectives(mapelKey);
    }

    const currentObj = learningObjectivesCache[mapelKey];
    const listTp = (currentObj && currentObj.listTp) ? currentObj.listTp : [];

    const storageKey = `portal_tp_selected_${teacherCleanNip}_${mapelKey}`;
    const savedMeeting = localStorage.getItem(storageKey) || '1';

    if (listTp.length > 0) {
      selectEl.innerHTML = listTp.map((tp, idx) => {
        const meetingNum = tp.pertemuan || (idx + 1);
        const code = tp.kodeTp || `P${String(meetingNum).padStart(2, '0')}`;
        const text = tp.materi || '';
        const isSelected = String(meetingNum) === String(savedMeeting);
        const truncated = text.length > 80 ? text.substring(0, 80) + '...' : text;
        return `<option value="${meetingNum}" data-materi="${encodeURIComponent(text)}" style="background-color: ${optBg} !important; color: ${optColor} !important; font-size: 0.79rem;" ${isSelected ? 'selected' : ''}>Pertemuan ${meetingNum} (${code}): ${truncated}</option>`;
      }).join('');
    } else {
      selectEl.innerHTML = `<option value="1" data-materi="" style="background-color: ${optBg} !important; color: ${optColor} !important; font-size: 0.79rem;">(Gunakan teks materi standar)</option>`;
    }

    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const initialMateri = selectedOption ? decodeURIComponent(selectedOption.getAttribute('data-materi') || '') : '';
    if (previewBox) {
      previewBox.value = initialMateri;
    }

    updateModalUrl();
  };

  // Event Listeners
  if (mapelSelectEl) {
    mapelSelectEl.onchange = () => loadTpForMapel(mapelSelectEl.value);
  }

  selectEl.onchange = () => {
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const materiText = selectedOption ? decodeURIComponent(selectedOption.getAttribute('data-materi') || '') : '';
    if (previewBox) {
      previewBox.value = materiText;
    }
    updateModalUrl();
  };

  if (previewBox) {
    previewBox.oninput = () => {
      if (mapelSelectEl && mapelSelectEl.value === 'custom_manual') {
        localStorage.setItem(`portal_custom_materi_${teacherCleanNip}`, previewBox.value);
      }
      updateModalUrl();
    };
  }

  btnSubmit.onclick = () => {
    closeModal();
    showToast('Membuka Form Jurnal Mengajar...');
  };

  try {
    await loadTpForMapel(activeMapelKey);
  } catch (tpErr) {
    console.warn('Gagal memuat TP materi:', tpErr);
  }
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
    const [teachers, forms, schedules, students] = await Promise.all([
      fetchTeachers(),
      fetchForms(),
      fetchSchedules(),
      fetchStudents()
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
    if (students && students.length > 0) {
      currentStudents = students;
    }

    console.log(`🔥 [App] Dimuat dari Firestore: ${currentTeachers.length} Guru, ${currentForms.length} Form, ${currentSchedules.length} Jadwal, ${currentStudents.length} Siswa`);
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

// Intercept Klik Form untuk Cek Riwayat di Firestore & Modal Jurnal KBM
window.handleFormClick = async (event, formId, formName, generatedUrl) => {
  if (event) event.preventDefault();

  if (!activeTeacher || !activeTeacher.nip) {
    window.open(generatedUrl, '_blank');
    return;
  }

  // 1. Khusus Form Absensi Mengajar: Buka Modal Presensi Siswa Dinamis
  const lowerFormName = (formName || '').toLowerCase();
  const lowerFormId = (formId || '').toLowerCase();
  const isAbsensi = formId === "form_absensi_mengajar" || 
                    formId === "form_absensi_guru" || 
                    lowerFormId.includes("absensi_mengajar") ||
                    lowerFormId.includes("absensi_guru") ||
                    lowerFormId === "form_absensi" ||
                    (lowerFormName.includes("absensi") && !lowerFormName.includes("piket") && !lowerFormName.includes("wali")) ||
                    lowerFormName.includes("presensi");

  if (isAbsensi) {
    openAbsensiModal(formId, formName);
    return;
  }

  // 2. Khusus Form Jurnal Mengajar: Buka Modal Pemilihan Capaian Pembelajaran (TP)
  const isJurnal = formId === "form_jurnal_mengajar" || 
                   lowerFormName.includes("jurnal");

  if (isJurnal) {
    openTpModalForJournal(formId, formName);
    return;
  }

  // 3. Untuk Form Lain: Cek Riwayat Pengisian
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
        btnYes.target = "_blank";
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

  // Cari form berdasarkan hash URL atau ID internal
  const form = currentForms.find(f => f.id === formId || (f.baseUrl && f.baseUrl.includes(formId)));

  // Gunakan ID internal jika ditemukan, agar konsisten dengan pengecekan saat klik
  const finalFormId = form ? form.id : formId;
  const formName = form ? form.name : "Formulir";
  const cleanNip = activeTeacher.nip.replace(/[\s\.\-]+/g, '');

  try {
    await saveFormSubmission(cleanNip, finalFormId, formName);
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
      const pin = document.getElementById('edit-teacher-pin') ? (document.getElementById('edit-teacher-pin').value.trim() || '12345') : '12345';

      await saveTeacherHandler({ name, nip, role, class: teacherClass, guruWaliClass, journalFormUrl, pin });
      modalTeacher.classList.add('hidden');
    });
  }

  // Modal Ubah PIN Mandiri Guru
  const modalPin = document.getElementById('modal-change-pin');
  const btnOpenPin = document.getElementById('btn-open-pin-modal');
  const btnClosePin = document.getElementById('btn-close-pin-modal');
  const btnCancelPin = document.getElementById('btn-cancel-pin-modal');
  const formChangePin = document.getElementById('form-change-pin');
  const errorPinMsg = document.getElementById('change-pin-error');
  const curPinInput = document.getElementById('current-pin-input');
  const newPinInput = document.getElementById('new-pin-input');
  const confirmPinInput = document.getElementById('confirm-new-pin-input');

  if (btnOpenPin && modalPin) {
    btnOpenPin.addEventListener('click', () => {
      if (curPinInput) curPinInput.value = '';
      if (newPinInput) newPinInput.value = '';
      if (confirmPinInput) confirmPinInput.value = '';
      if (errorPinMsg) errorPinMsg.classList.add('hidden');
      modalPin.classList.remove('hidden');
      if (curPinInput) curPinInput.focus();
    });
  }

  const closePinModal = () => {
    if (modalPin) modalPin.classList.add('hidden');
  };

  if (btnClosePin) btnClosePin.addEventListener('click', closePinModal);
  if (btnCancelPin) btnCancelPin.addEventListener('click', closePinModal);

  if (formChangePin) {
    formChangePin.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeTeacher || !activeTeacher.nip) {
        alert('Data guru aktif tidak ditemukan.');
        return;
      }

      const curVal = curPinInput ? curPinInput.value.trim() : '';
      const newVal = newPinInput ? newPinInput.value.trim() : '';
      const confirmVal = confirmPinInput ? confirmPinInput.value.trim() : '';

      const expectedCurPin = (activeTeacher.pin && String(activeTeacher.pin).trim() !== '') ? String(activeTeacher.pin).trim() : '12345';

      if (curVal !== expectedCurPin) {
        if (errorPinMsg) {
          errorPinMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> PIN saat ini salah. (PIN default: <strong>12345</strong> jika belum pernah diubah).`;
          errorPinMsg.classList.remove('hidden');
        }
        if (curPinInput) {
          curPinInput.focus();
          curPinInput.select();
        }
        return;
      }

      if (newVal.length < 4) {
        if (errorPinMsg) {
          errorPinMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> PIN baru harus minimal 4 digit karakter.`;
          errorPinMsg.classList.remove('hidden');
        }
        if (newPinInput) newPinInput.focus();
        return;
      }

      if (newVal !== confirmVal) {
        if (errorPinMsg) {
          errorPinMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Konfirmasi PIN baru tidak sesuai dengan PIN baru.`;
          errorPinMsg.classList.remove('hidden');
        }
        if (confirmPinInput) {
          confirmPinInput.focus();
          confirmPinInput.select();
        }
        return;
      }

      const submitBtn = document.getElementById('btn-submit-pin');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;
      }

      try {
        showToast("⏳ Menyimpan kode akses baru...");
        // Gunakan .id (Doc ID asli) jika tersedia, fallback ke .nip
        const targetId = activeTeacher.id || activeTeacher.nip;
        const success = await updateTeacherPin(targetId, newVal);
        if (success) {
          activeTeacher.pin = newVal;
          const exIdx = currentTeachers.findIndex(t => t.nip === activeTeacher.nip || t.name === activeTeacher.name);
          if (exIdx >= 0) currentTeachers[exIdx].pin = newVal;

          localStorage.setItem('portal_logged_pin', newVal);
          if (localStorage.getItem('portal_remember_pin')) {
            localStorage.setItem('portal_remember_pin', newVal);
          }

          closePinModal();
          showToast('✅ Kode Akses / PIN berhasil diperbarui!');
          renderAdminTables();
        } else {
          if (errorPinMsg) {
            errorPinMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Gagal menyimpan PIN ke database. Periksa koneksi internet Anda.`;
            errorPinMsg.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error("Error updating pin:", err);
        if (errorPinMsg) {
          errorPinMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Error: ${err.message}`;
          errorPinMsg.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan PIN Baru`;
        }
      }
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
  const pinInp = document.getElementById('edit-teacher-pin');

  if (teacher) {
    title.innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Data Guru`;
    nameInp.value = teacher.name;
    nameInp.readOnly = true;
    nipInp.value = teacher.nip && teacher.nip !== '-' ? teacher.nip : '';
    roleInp.value = teacher.role || 'Walikelas';
    if (classInp) classInp.value = teacher.class || '-';
    if (guruWaliClassInp) guruWaliClassInp.value = teacher.guruWaliClass || '-';
    if (journalInp) journalInp.value = teacher.journalFormUrl || '';
    if (pinInp) pinInp.value = teacher.pin || '12345';
  } else {
    title.innerHTML = `<i class="fa-solid fa-user-plus"></i> Tambah Data Guru`;
    nameInp.value = '';
    nameInp.readOnly = false;
    nipInp.value = '';
    roleInp.value = 'Walikelas';
    if (classInp) classInp.value = '-';
    if (guruWaliClassInp) guruWaliClassInp.value = '-';
    if (journalInp) journalInp.value = '';
    if (pinInp) pinInp.value = '12345';
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
