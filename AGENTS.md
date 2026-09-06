# 🤖 PORTAL:AutoForm - Agent Guidelines & Rules

Dokumen ini adalah pedoman dan aturan baku bagi AI Agent saat melakukan analisis, modifikasi kode, maupun penambahan fitur pada proyek **PORTAL:AutoForm** (SMKN 1 Jetis Mojokerto).

---

## 1. 🗄️ Sumber Data Utama (Single Source of Truth)
* **Cloud Firestore (`form-autoform`)** adalah satu-satunya sumber data resmi (*Single Source of Truth*) untuk:
  * Master Guru (`teachers`)
  * Master Jadwal KBM (`schedules`)
  * Master Formulir Administrasi (`forms`)
* **DILARANG** mengasumsikan data dari file contoh lokal / statis (*dummy*) jika data master di Firestore tersedia.
* Akun Administrator resmi: `iskakfatoni@gmail.com` (NIP: `198109092022211004` / `MUCHAMAD ISKAK FATONI, S.Pd.`).

---

## 2. ⚡ Arsitektur & Teknologi Frontend
* **Vanilla JavaScript (ES Modules):**
  * Seluruh modul logika berada di folder `asset/js/` dan `asset/js/modules/`.
  * Tidak menggunakan framework berat (React, Vue, Angular) dan **TIDAK menggunakan JSX** atau *build tools* (Webpack, Vite, Babel) kecuali diminta eksplisit oleh pengguna.
  * Aplikasi harus dapat langsung berjalan di web browser dan WebView2 desktop tanpa build step.
* **Modern CSS & Tema:**
  * Desain antarmuka mengusung *Glassmorphism* dengan *CSS Custom Properties* (`asset/css/style.css`).
  * Wajib mempertahankan dukungan tema ganda (*Dark Mode* & *Light Mode*).
* **Ekspor / Impor Excel:**
  * Menggunakan pustaka *SheetJS* klien murni (`asset/js/xlsx.full.min.js`).

---

## 3. 📝 Standarisasi Form Google Form & Auto-Fill
Setiap modifikasi logika *schedule resolver* atau tautan otomatisasi Google Form **wajib mematuhi dokumen spesifikasi**:
1. **Form Absensi Mengajar, Piket, Walikelas, & Guru Wali:** Lihat aturan di [`asset/rule/ABSENSI.md`](file:///c:/Users/iskak/Antigravity-Projetcs/portalautoform/asset/rule/ABSENSI.md).
2. **Form Jurnal Mengajar Guru:** Lihat aturan di [`asset/rule/JURNAL.md`](file:///c:/Users/iskak/Antigravity-Projetcs/portalautoform/asset/rule/JURNAL.md).

### Aturan Format Link Google Form:
* Link Form Jurnal Guru **harus berupa URL panjang Google Form** (`docs.google.com/forms/d/e/.../viewform`).
* **DILARANG** menggunakan format shortlink `forms.gle/` untuk tautan auto-fill karena query parameter tidak akan terbaca oleh Google Form.

---

## 4. 🔒 Keamanan & Firebase Rules
* Aturan keamanan Firestore di [`firestore.rules`](file:///c:/Users/iskak/Antigravity-Projetcs/portalautoform/firestore.rules) harus selalu menjaga integritas:
  * Guru hanya dapat memperbarui data tertentu (seperti PIN mandiri).
  * Hak akses tulis/hapus penuh ke master data guru, jadwal, dan formulir dibatasi hanya untuk Administrator terdaftar (`iskakfatoni@gmail.com`).

---

## 5. 📱 Perintah Khusus /buildapk & Penanganan Repo Android
* **Repo Android (`PORTAL-AutoForm-ANDROID`):**
  * Dikelola dan di-handle langsung oleh pengguna melalui Android Studio.
  * **AI Agent DILARANG melakukan `git push`** pada repository Android.
* Jika pengguna memanggil perintah `/buildapk`:
  * Jalankan script otomatis [`asset/tools/build_apk.ps1`](file:///c:/Users/iskak/Antigravity-Projetcs/portalautoform/asset/tools/build_apk.ps1).
  * Output APK akan dikompilasi dari `c:\Users\iskak\Antigravity-Projetcs\PORTAL-AutoForm-ANDROID` dan otomatis disalin/ditimpa ke:
    `D:\Cloud\ISKAK\GOOGLE DRIVE\SHARE\APP ANDROID\PORTAL-AUTOFOORM\PORTAL-AutoForm.apk`


