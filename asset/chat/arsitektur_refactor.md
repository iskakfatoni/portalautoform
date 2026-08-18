# 🏛️ STRUKTUR ARSITEKTUR & REFACTORING PROYEK PORTAL:AutoForm

**Proyek:** PORTAL:AutoForm - SMKN 1 Jetis Mojokerto  
**Target Database:** Cloud Firestore (`form-autoform` / FORM-AutoForm)  
**Terakhir Diperbarui:** 18 Agustus 2026  
**Status Arsitektur:** ✅ 100% Modular ES Modules & Cloud Firestore Synchronized  

---

## 📁 1. Peta Direktori & File Proyek (Non-Root Architecture)

```
portalautoform/
│
├── index.html                               # 🌐 Landing Page & Gerbang Login Guru (NIP) / Admin
├── firestore.rules                          # 🔒 Aturan Keamanan Database Cloud Firestore
├── export_audit_to_excel.js                 # 📊 Tool Ekspor Audit Excel Real-Time dari Firestore
├── sync_all_teachers_to_firebase.py         # ⚡ Script CLI Sinkronisasi Batch Master Data ke Firestore
├── daftar_guru_status_link_google_form.xlsx # 📑 File Excel Laporan Status Link Google Form (100% Valid)
│
└── asset/
    ├── css/
    │   └── style.css                        # 🎨 Modern Glassmorphic Design System & Dark/Light Mode Theme
    │
    ├── pages/
    │   ├── portal.html                      # 📱 Portal Interaktif Guru & Admin Dashboard
    │   ├── form_absen.html                  # 📄 Halaman Wrapper Embed Google Forms
    │   └── offline.html                     # 🔌 Halaman Fallback Penanganan Mode Offline
    │
    ├── js/
    │   ├── firebase-config.js               # ⚙️ Inisialisasi Resmi Firebase JS SDK v10 (form-autoform)
    │   ├── login.js                         # 🔑 Logika Autentikasi NIP Guru & Admin Login (Google/Password)
    │   ├── app.js                           # 🚀 Core Orchestrator Portal Guru & Dashboard Administrator
    │   │
    │   └── modules/                         # 🧩 Modul-Modul Terpisah (ES Modules)
    │       ├── auth-manager.js              # 🛡️ Validasi Otorisasi Admin (iskakfatoni@gmail.com)
    │       ├── initial-data.js              # 📦 Master 92 Guru Canonical (100% Long URL) & Master Formulir
    │       ├── formatters.js                # 🔤 Utilitas Normalisasi Nama Kelas, Waktu KBM, dan Ejaan Hari
    │       ├── schedule-resolver.js         # ⏰ Auto-Matching Jadwal KBM & Generator Pre-filled Google Form URL
    │       ├── ui-renderers.js              # 🖼️ Renderer Kartu Portal, Tabel Guru, Tabel Form, & Tabel Jadwal
    │       ├── excel-service.js             # 📥 Engine SheetJS Impor/Ekspor Excel (.xlsx/.xls) & JSON
    │       └── theme-manager.js             # 🌓 Deteksi Tema Sistem OS & Switcher Tema Terang/Gelap
    │
    └── chat/
        ├── arsitektur_refactor.md           # 📖 Dokumen Struktur Arsitektur & Perubahan (File ini)
        ├── refactor.md                      # 📝 Catatan Histori Modernisasi Kode
        └── SESI_UPDATE_GOOGLE_FORM_FIRESTORE_17_AGUSTUS_2026.md # 📜 Laporan Audit & Konversi Link
```

---

## ⚙️ 2. Konfigurasi Proyek & Database Tunggal: `form-autoform`

Semua interaksi database Cloud Firestore dan autentikasi diarahkan secara tunggal dan eksklusif ke proyek **`form-autoform`**:

```javascript
// asset/js/firebase-config.js
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBJUu8_4G_WK30h4W61XunUFvu7uutBibo",
  authDomain: "form-autoform.firebaseapp.com",
  projectId: "form-autoform",
  storageBucket: "form-autoform.firebasestorage.app",
  messagingSenderId: "792855598347",
  appId: "1:792855598347:web:d6413636885289aa3a7e0e",
  measurementId: "G-XP8VY0GRXW"
};
```

---

## 🔄 3. Alur Data & Auto-Fill Parameters

```mermaid
flowchart TD
    A[Guru / Pengguna Masuk] --> B{Punya Sesi NIP?}
    B -- Ya --> C[Buka Portal Guru ?nip=...]
    B -- Tidak --> D[Input NIP di Landing Page index.html]
    D --> C
    
    C --> E[schedule-resolver.js]
    E --> F[Deteksi Hari & Waktu Sekarang]
    E --> G[Ambil Data Guru dari Firestore / Memory]
    E --> H[Cocokkan Jadwal KBM Terdekat / Sedang Berlangsung]
    
    H --> I[Generate Pre-filled Google Form URL]
    I --> J[Tampilkan Grid Formulir di portal.html]
    
    J --> K[Klik Formulir -> Buka Google Form dengan Parameter Terisi Otomatis]
```

### Mapping Field Parameter Google Forms:
1. **Nama Guru:** `entry.1599393498`
2. **NIP Guru:** `entry.65154558`
3. **Tanggal KBM:** `entry.1708105874` (Format: `YYYY-MM-DD`)
4. **Jam Ke:** `entry.585996771` (Otomatis dari jadwal aktif)
5. **Kelas:** `entry.666017338` (Otomatis ternormalisasi)
6. **Mata Pelajaran:** `entry.73505426` (Otomatis dari jadwal aktif)

---

## 🔒 4. Aturan Keamanan Firestore (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthorizedAdmin() {
      return request.auth != null && request.auth.token.email.lower() == 'iskakfatoni@gmail.com';
    }

    match /teachers/{document=**} {
      allow read: if true;
      allow write: if isAuthorizedAdmin();
    }

    match /forms/{document=**} {
      allow read: if true;
      allow write: if isAuthorizedAdmin();
    }

    match /schedules/{document=**} {
      allow read: if true;
      allow write: if isAuthorizedAdmin();
    }

    match /settings/{document=**} {
      allow read: if true;
      allow write: if isAuthorizedAdmin();
    }
  }
}
```

---

## 📊 5. Rekap Master Data Guru
* **Total Guru Terdaftar:** 92 Guru
* **Status Link Google Form Jurnal Mengajar:** 100% Canonical Long URL (`https://docs.google.com/forms/d/e/.../viewform`)
* **Shortlink (`forms.gle`):** 0 (Tidak ada lagi)
* **Penyimpanan Data:** Firestore `form-autoform` + Fallback [`initial-data.js`](file:///c:/Users/iskak/Antigravity-Projetcs/portalautoform/asset/js/modules/initial-data.js)

---

*Catatan: Dokumen arsitektur ini disimpan di lokasi non-root (`asset/chat/arsitektur_refactor.md`) dan akan otomatis diperbarui setiap kali ada perubahan struktur.*
