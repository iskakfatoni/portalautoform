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

// Konfigurasi Proyek Firebase Anda
// Anda bisa menempelkan (paste) konfigurasi asli dari Firebase Console di sini,
// atau mengisinya langsung lewat menu "Pengaturan Firebase" di dalam aplikasi web.
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Cek apakah ada konfigurasi tersimpan di localStorage
export function getActiveFirebaseConfig() {
  const customConfig = localStorage.getItem('portal_custom_firebase_config');
  if (customConfig) {
    try {
      const parsed = JSON.parse(customConfig);
      if (parsed.projectId && parsed.apiKey && parsed.apiKey !== "YOUR_API_KEY") {
        return parsed;
      }
    } catch (e) {
      console.warn("Gagal membaca custom firebase config:", e);
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let isFirebaseActive = false;

export function initFirebase() {
  const config = getActiveFirebaseConfig();
  if (config.apiKey && config.apiKey !== "YOUR_API_KEY") {
    try {
      app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
      googleProvider = new GoogleAuthProvider();
      isFirebaseActive = true;
      console.log("Firebase initialized successfully with project:", config.projectId);
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

export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  isFirebaseActive,
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
