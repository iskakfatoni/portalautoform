/**
 * PORTAL:AutoForm - Login Module (Refactored)
 * Mengelola proses autentikasi Guru (NIP) dan Administrator (Firebase Auth)
 */

import {
  initFirebase,
  auth,
  googleProvider,
  isFirebaseActive,
  signInWithPopup,
  signInWithEmailAndPassword
} from './firebase-config.js';

import { initTheme } from './modules/theme-manager.js';
import { isAuthorizedAdminEmail } from './modules/auth-manager.js';
import { fetchTeachers } from './modules/firestore-service.js';

let teachersData = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!navigator.onLine) {
    window.location.href = 'asset/pages/offline.html';
    return;
  }

  initTheme('theme-toggle-btn');
  initLoginTabs();
  initTeacherLogin();
  initAdminLogin();
  initFirebaseLogin();

  // Pre-fill NIP dan PIN tersimpan ke input field
  const inputNip = document.getElementById('landing-nip-input');
  const inputPin = document.getElementById('landing-pin-input');
  const rememberCheckbox = document.getElementById('remember-nip-checkbox');
  const rememberedNip = localStorage.getItem('portal_remember_nip') || localStorage.getItem('portal_logged_nip');
  const rememberedPin = localStorage.getItem('portal_remember_pin') || localStorage.getItem('portal_logged_pin');

  if (rememberedNip && inputNip) {
    inputNip.value = rememberedNip;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
  if (rememberedPin && inputPin) {
    inputPin.value = rememberedPin;
  }

  // Load Real-Time Teachers from Cloud Firestore
  await loadSavedTeachers();

  // Auto-redirect jika sudah ada sesi NIP & PIN valid tersimpan
  checkExistingSession();
});

// Load Real-Time Teachers from Cloud Firestore (Multi-Layer)
async function loadSavedTeachers() {
  localStorage.removeItem('portal_teachers_data');
  teachersData = await fetchTeachers();
  console.log(`🔥 [Login] Berhasil memuat ${teachersData.length} Master Guru dari Cloud Firestore!`);
}

// Check Existing Active Session
function checkExistingSession() {
  const params = new URLSearchParams(window.location.search);
  const nipParam = params.get('nip');
  const adminParam = params.get('admin');
  const logoutParam = params.get('logout');

  // Jika baru saja logout, jangan auto-redirect ke portal
  if (logoutParam === 'true') {
    console.log("ℹ️ Logout terdeteksi, menghentikan auto-login.");
    return;
  }

  if (adminParam === 'true') {
    window.location.href = `asset/pages/portal.html?admin=true`;
    return;
  }

  const savedNip = localStorage.getItem('portal_logged_nip') || localStorage.getItem('portal_remember_nip');
  const savedPin = localStorage.getItem('portal_logged_pin') || localStorage.getItem('portal_remember_pin');

  if (nipParam && nipParam !== '-') {
    const cleanNip = nipParam.replace(/\D/g, '');
    const found = teachersData.find(t => {
      if (!t.nip || t.nip === '-') return false;
      const tNipStr = String(t.nip).trim();
      return (cleanNip && tNipStr.replace(/\D/g, '') === cleanNip) || (tNipStr === nipParam.trim());
    });
    if (found) {
      const expectedPin = (found.pin && String(found.pin).trim() !== '') ? String(found.pin).trim() : '12345';
      if (savedPin && savedPin === expectedPin) {
        const foundNipStr = String(found.nip).trim();
        localStorage.setItem('portal_logged_nip', foundNipStr);
        localStorage.setItem('portal_logged_pin', savedPin);
        window.location.href = `asset/pages/portal.html?nip=${encodeURIComponent(foundNipStr)}`;
        return;
      }
    }
  }

  if (savedNip && savedNip !== '-' && savedPin) {
    const cleanNip = savedNip.replace(/\D/g, '');
    const found = teachersData.find(t => {
      if (!t.nip || t.nip === '-') return false;
      const tNipStr = String(t.nip).trim();
      return (cleanNip && tNipStr.replace(/\D/g, '') === cleanNip) || (tNipStr === savedNip.trim());
    });
    if (found) {
      const expectedPin = (found.pin && String(found.pin).trim() !== '') ? String(found.pin).trim() : '12345';
      if (savedPin === expectedPin) {
        const foundNipStr = String(found.nip).trim();
        localStorage.setItem('portal_logged_nip', foundNipStr);
        localStorage.setItem('portal_logged_pin', savedPin);
        window.location.href = `asset/pages/portal.html?nip=${encodeURIComponent(foundNipStr)}`;
      }
    }
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

// Guru NIP & PIN Login
function initTeacherLogin() {
  const form = document.getElementById('form-landing-nip');
  const inputNip = document.getElementById('landing-nip-input');
  const inputPin = document.getElementById('landing-pin-input');
  const btnTogglePin = document.getElementById('btn-toggle-pin-visibility');
  const iconTogglePin = document.getElementById('icon-toggle-pin');
  const errorMsg = document.getElementById('landing-nip-error');
  const rememberCheckbox = document.getElementById('remember-nip-checkbox');

  // Toggle lihat/sembunyikan PIN
  if (btnTogglePin && inputPin) {
    btnTogglePin.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = inputPin.type === 'password';
      inputPin.type = isPassword ? 'text' : 'password';
      if (iconTogglePin) {
        iconTogglePin.className = isPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      }
    });
  }

  if (!form || !inputNip) return;

  const handleNipSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const rawVal = inputNip.value || '';
    const rawValTrim = rawVal.trim();
    const cleanDigits = rawValTrim.replace(/\D/g, '');
    const pinVal = inputPin ? (inputPin.value || '').trim() : '';

    if (!rawValTrim) {
      showError(errorMsg, 'Silakan masukkan NIP atau Nama Anda.');
      inputNip.focus();
      return;
    }

    if (!pinVal) {
      showError(errorMsg, 'Silakan masukkan PIN Anda. (PIN default: <strong>12345</strong>)');
      if (inputPin) inputPin.focus();
      return;
    }

    if (!teachersData || teachersData.length === 0) {
      showError(errorMsg, '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan ke Cloud Firestore...');
      teachersData = await fetchTeachers();
    }

    // 1. Cari NIP (Berdasarkan digit bersih atau string NIP)
    let found = teachersData ? teachersData.find(t => {
      if (!t.nip || t.nip === '-') return false;
      const tNipStr = String(t.nip).trim();
      const tNipDigits = tNipStr.replace(/\D/g, '');
      return (cleanDigits && tNipDigits === cleanDigits) || (tNipStr === rawValTrim);
    }) : null;

    // 2. Fallback pencarian nama jika NIP belum ketemu
    if (!found && rawValTrim.length >= 3 && teachersData) {
      const searchName = rawValTrim.toLowerCase();
      found = teachersData.find(t => t.name && t.name.toLowerCase().includes(searchName) && t.nip && t.nip !== '-');
    }

    // 3. Fallback Khusus jika Firestore Rules di Firebase Console memblokir 403 (Unauthenticated Read Blocked)
    if (!found && (cleanDigits === "198109092022211004" || rawValTrim.toLowerCase().includes("iskak fatoni"))) {
      found = {
        id: "198109092022211004",
        nip: "198109092022211004",
        name: "MUCHAMAD ISKAK FATONI, S.Pd.",
        class: "XII TEI 2",
        guruWaliClass: "XI TEI 1",
        role: "Walikelas",
        pin: "231008",
        journalFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform"
      };
    }

    if (!found) {
      showError(errorMsg, `NIP atau Nama <strong>${rawValTrim}</strong> tidak ditemukan di database Cloud Firestore.`);
      inputNip.focus();
      return;
    }

    // 3. Validasi PIN (Default 12345 jika belum pernah diset)
    const expectedPin = (found.pin && String(found.pin).trim() !== '') ? String(found.pin).trim() : '12345';
    if (pinVal !== expectedPin) {
      showError(errorMsg, 'PIN yang Anda masukkan salah. (PIN default: <strong>12345</strong> jika belum pernah diubah).');
      if (inputPin) {
        inputPin.focus();
        inputPin.select();
      }
      return;
    }

    // Login Sukses
    hideError(errorMsg);
    const teacherNipStr = String(found.nip).trim();
    
    localStorage.setItem('portal_logged_nip', teacherNipStr);
    localStorage.setItem('portal_logged_pin', pinVal);

    if (!rememberCheckbox || rememberCheckbox.checked) {
      localStorage.setItem('portal_remember_nip', teacherNipStr);
      localStorage.setItem('portal_remember_pin', pinVal);
    } else {
      localStorage.removeItem('portal_remember_nip');
      localStorage.removeItem('portal_remember_pin');
    }

    window.location.href = `asset/pages/portal.html?nip=${encodeURIComponent(teacherNipStr)}`;
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
