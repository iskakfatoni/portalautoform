# PORTAL:AutoForm (Multi-User Cloud Edition) 🚀

Portal web modern, ringan, dan cepat untuk akses otomatis Google Form dengan fitur **Auto-Fill Parameter Berbasis NIP Guru**, terintegrasi dengan **Google Firebase (Cloud Firestore & Authentication)**.

---

## 🌟 Fitur Utama

### 1. Portal Guru (Multi-User Berbasis NIP)
* **Pencarian Instan:** Guru dapat mengetik nama atau 18 digit NIP pada kotak pencarian autocomplete atau memilih dari dropdown.
* **Auto-Fill Parameter Instan:** Begitu profil guru aktif, semua Google Form yang terdaftar otomatis terisi **Nama Guru**, **NIP**, dan **Kelas Binaan**.
* **1-Click Launch & Copy:** Buka langsung form atau salin tautan dengan notifikasi visual.

### 2. Panel Administrator Khusus (`iskakfatoni@gmail.com`)
* **Autentikasi Aman:** Login via Firebase Auth (Google Sign-In) khusus untuk email `iskakfatoni@gmail.com`.
* **Manajemen Master Guru (CRUD):** Tambah guru baru, ubah NIP & kelas binaan, hapus data guru.
* **🚀 1-Click Seed 94 Master Guru:** Mengunggah 94 master data guru sekolah secara batch ke Cloud Firestore.
* **Manajemen Formulir (CRUD):** Tambah Google Form baru di masa depan dan atur mapping `entry.id` secara visual tanpa coding.
* **Pengaturan Firebase Web:** Masukkan kredensial Firebase langsung lewat antarmuka web.

---

## 📁 Struktur File
```text
portal-autoform/
├── index.html           # Halaman Login Utama / Gate NIP & Admin (Wajib di root)
├── README.md            # Dokumentasi proyek
├── .gitignore           # Konfigurasi Git ignore
├── firestore.rules      # Aturan keamanan database Cloud Firestore
└── asset/               # Folder aset & file pendukung
    ├── app/             # Aplikasi desktop Windows (.exe)
    │   └── PORTAL AutoForm.exe
    ├── css/             # Stylesheet & desain UI
    │   └── style.css
    ├── image/           # Folder aset gambar & logo
    ├── js/              # Modul JavaScript
    │   ├── login.js     # Logika proses autentikasi login
    │   ├── app.js       # Logika aplikasi & dashboard utama
    │   ├── firebase-config.js
    │   └── xlsx.full.min.js
    └── pages/           # Halaman tampilan utama & form
        ├── portal.html  # Dashboard utama (Formulir, Generator, Panel Admin)
        ├── form_absen.html
        └── form_guru_wali.html
```

---

## 🛠️ Panduan Menyiapkan Firebase Console

Untuk mengaktifkan sinkronisasi database cloud Firebase:

### 1. Buat Proyek di Firebase Console
1. Buka [console.firebase.google.com](https://console.firebase.google.com/).
2. Klik **Add project** (Tambah proyek) dan beri nama, misalnya: `portal-autoform`.
3. Nonaktifkan Google Analytics (opsional), lalu klik **Create project**.

### 2. Aktifkan Firebase Authentication
1. Pada menu navigasi kiri, pilih **Build > Authentication** > klik **Get started**.
2. Di tab **Sign-in method**, pilih penyedia **Google** > Aktifkan (Enable) > Masukkan email support (`iskakfatoni@gmail.com`) > Klik **Save**.
3. Di tab **Settings > Authorized domains**, pastikan `localhost` dan `iskakfatoni.github.io` sudah terdaftar.

### 3. Aktifkan Cloud Firestore
1. Pilih **Build > Firestore Database** > klik **Create database**.
2. Pilih lokasi server terdekat (misal: `asia-southeast2` / Jakarta).
3. Pilih **Start in test mode** atau **Production mode**.
4. Buka tab **Rules**, lalu tempel (*paste*) isi file [`firestore.rules`](file:///C:/Users/iskak/.gemini/antigravity-ide/scratch/portal-autoform/firestore.rules) dan klik **Publish**.

### 4. Daftarkan Web App & Ambil Kredensial
1. Klik ikon gerigi ⚙️ (Project settings) di pojok kiri atas.
2. Di bagian **Your apps**, klik ikon Web `</>`.
3. Masukkan nama aplikasi `PORTAL AutoForm Web`, lalu klik **Register app**.
4. Salin objek `firebaseConfig` (khususnya `apiKey`, `projectId`, `authDomain`, `appId`).

### 5. Masukkan ke Website PORTAL:AutoForm
* Buka website Anda di [iskakfatoni.github.io/portalautoform/](https://iskakfatoni.github.io/portalautoform/).
* Klik tombol **Login Admin** > Masuk ke tab **Panel Admin > Pengaturan Firebase**.
* Tempelkan `apiKey`, `projectId`, dll. lalu klik **Simpan & Hubungkan Firebase**.
* Klik tombol **🚀 Seed 94 Master Guru** untuk mengunggah seluruh data guru ke cloud!

---

## 🚀 Deployment ke GitHub Pages
Repository: [https://github.com/iskakfatoni/portalautoform](https://github.com/iskakfatoni/portalautoform)  
Website: [https://iskakfatoni.github.io/portalautoform/](https://iskakfatoni.github.io/portalautoform/)
