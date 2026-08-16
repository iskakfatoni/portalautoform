# PORTAL:AutoForm 🚀

Portal web modern, ringan, dan cepat untuk akses otomatis Google Form dengan fitur **Auto-Fill Parameter**, khusus dirancang untuk efisiensi pengumpulan laporan administrasi walikelas.

---

## 🌟 Fitur Utama
1. **Formulir Siap Pakai (Preset):** Langsung membuka Google Form dengan isian otomatis Nama Guru, NIP, dan Kelas tanpa perlu mengetik ulang.
2. **Interactive Link Generator:** Pembuat link auto-fill untuk rekan guru dan kelas lainnya secara dinamis.
3. **1-Click Salin & Uji Coba:** Tombol salin tautan dengan notifikasi toast.
4. **Desain Modern & Responsif:** Dilengkapi Glassmorphism UI, Dark/Light Mode, dan ramah pengguna di perangkat mobile maupun desktop.
5. **Zero Backend:** Berjalan 100% di browser tanpa server, sangat cocok untuk **GitHub Pages**.

---

## 📁 Struktur File
```text
portal-autoform/
├── index.html       # Halaman utama portal
├── style.css        # Desain & tema (Dark/Light mode, Glassmorphism)
├── app.js           # Logika interaktif & generator link
└── README.md        # Panduan proyek & hosting
```

---

## 🚀 Panduan Upload & Aktifkan di GitHub Pages

### Langkah 1: Buat Repository Baru di GitHub
1. Buka [github.com/new](https://github.com/new).
2. Beri nama repository, misalnya: `portal-autoform`.
3. Pilih **Public**, lalu klik **Create repository**.

### Langkah 2: Upload File ke GitHub
Anda bisa mengunggah file (`index.html`, `style.css`, `app.js`, `README.md`) langsung melalui web GitHub atau terminal:

```bash
# Inisialisasi Git lokal (di folder project)
git init
git add .
git commit -m "Initial commit: PORTAL:AutoForm"
git branch -M main
git remote add origin https://github.com/USERNAME-ANDA/portal-autoform.git
git push -u origin main
```

### Langkah 3: Aktifkan GitHub Pages
1. Masuk ke tab **Settings** di repository GitHub Anda.
2. Pada menu sidebar kiri, klik **Pages** (di bagian *Code and automation*).
3. Di bagian **Build and deployment > Branch**:
   * Pilih branch: `main`
   * Pilih folder: `/ (root)`
4. Klik tombol **Save**.
5. Tunggu sekitar 1–2 menit. Website Anda akan aktif di:
   `https://USERNAME-ANDA.github.io/portal-autoform/`

---

## 💡 Cara Menambahkan Form Baru
Untuk menambahkan card formulir baru, Anda cukup menduplikasi elemen `<article class="form-card">` di file `index.html` dan menyesuaikan tautan serta informasi pre-filled-nya.
