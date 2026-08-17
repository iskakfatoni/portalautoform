/**
 * Firebase Initialization & Configuration Module
 * Mendukung Firebase JS SDK v10 (Modular ESM via CDN)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Proyek Firebase (form-autoform)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBJUu8_4G_WK30h4W61XunUFvu7uutBibo",
  authDomain: "form-autoform.firebaseapp.com",
  projectId: "form-autoform",
  storageBucket: "form-autoform.firebasestorage.app",
  messagingSenderId: "792855598347",
  appId: "1:792855598347:web:d6413636885289aa3a7e0e",
  measurementId: "G-XP8VY0GRXW"
};

// Cek apakah ada konfigurasi kustom di localStorage
export function getActiveFirebaseConfig() {
  const customConfig = localStorage.getItem('portal_custom_firebase_config');
  if (customConfig) {
    try {
      const parsed = JSON.parse(customConfig);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    } catch (e) {
      console.warn("Gagal membaca custom firebase config:", e);
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export let app = null;
export let auth = null;
export let db = null;
export let googleProvider = null;
export let isFirebaseActive = false;

export function getDb() {
  if (!db) initFirebase();
  return db;
}

export function getAuthInstance() {
  if (!auth) initFirebase();
  return auth;
}

export function isFirebaseReady() {
  if (!isFirebaseActive) initFirebase();
  return isFirebaseActive && db !== null;
}

export function initFirebase() {
  if (app && db && auth) {
    return { app, auth, db, googleProvider, isFirebaseActive: true };
  }

  const config = getActiveFirebaseConfig();
  if (config.apiKey && config.apiKey !== "YOUR_API_KEY") {
    try {
      app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      isFirebaseActive = true;
      console.log("🔥 Firebase connected successfully to project:", config.projectId);
    } catch (error) {
      console.error("Gagal inisialisasi Firebase:", error);
      isFirebaseActive = false;
    }
  } else {
    console.log("Firebase belum dikonfigurasi. Berjalan dalam mode lokal/demo.");
    isFirebaseActive = false;
  }

  return { app, auth, db, googleProvider, isFirebaseActive };
}

// Inisialisasi otomatis langsung saat modul dimuat
initFirebase();

export { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
};
