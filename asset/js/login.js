/**
 * PORTAL:AutoForm - Login Module (Refactored)
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

import { initTheme } from './modules/theme-manager.js';
import { isAuthorizedAdminEmail } from './modules/auth-manager.js';

let teachersData = [];

document.addEventListener('DOMContentLoaded', async () => {
  initTheme('theme-toggle-btn');
  await loadSavedTeachers();
  initLoginTabs();
  initTeacherLogin();
  initAdminLogin();
  initFirebaseLogin();

  // Auto-redirect jika sudah ada sesi NIP tersimpan
  checkExistingSession();
});

// Load Real-Time Teachers from Cloud Firestore / Memory
async function loadSavedTeachers() {
  localStorage.removeItem('portal_teachers_data');
  teachersData = [];

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

// Check Existing Active Session
function checkExistingSession() {
  const params = new URLSearchParams(window.location.search);
  const nipParam = params.get('nip');
  const adminParam = params.get('admin');

  if (nipParam && nipParam !== '-') {
    const cleanNip = nipParam.replace(/[\s\.\-]+/g, '');
    localStorage.setItem('portal_logged_nip', cleanNip);
    window.location.href = `asset/pages/portal.html?nip=${encodeURIComponent(cleanNip)}`;
    return;
  }

  if (adminParam === 'true') {
    window.location.href = `asset/pages/portal.html?admin=true`;
    return;
  }

  const savedNip = localStorage.getItem('portal_logged_nip');
  if (savedNip && savedNip !== '-') {
    const cleanNip = savedNip.replace(/[\s\.\-]+/g, '');
    window.location.href = `asset/pages/portal.html?nip=${encodeURIComponent(cleanNip)}`;
  }
}

// Tab Switcher (Guru vs Admin)
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

// Guru NIP Login
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
      found = teachersData.find(t => t.name && t.name.toLowerCase().includes(searchName) && t.nip && t.nip !== '-');
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

// Admin Email/Password Login
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
        sessionStorage.setItem('portal_demo_admin', email);
      }
      window.location.href = `asset/pages/portal.html?admin=true`;
    } catch (err) {
      showError(errorMsg, `Gagal login: ${err.message || 'Periksa email dan password Anda.'}`);
    }
  });
}

// Admin Google Login
function initFirebaseLogin() {
  const btnGoogle = document.getElementById('btn-login-google');
  const errorMsg = document.getElementById('admin-login-error');

  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      const { isFirebaseActive: active } = initFirebase();
      if (!active || !auth || !googleProvider) {
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

function showError(el, htmlMsg) {
  if (el) {
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${htmlMsg}`;
    el.classList.remove('hidden');
  }
}

function hideError(el) {
  if (el) el.classList.add('hidden');
}
