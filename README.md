# PORTAL:AutoForm

Aplikasi web portal presensi, jurnal mengajar, dan administrasi KBM otomatis berbasis NIP Guru untuk SMKN 1 Jetis Mojokerto, terintegrasi langsung dengan **Google Firebase (Cloud Firestore & Authentication)**.

## Fitur Utama
* **Auto-Fill Google Form**: Otomatis mengisi Nama, NIP, Tanggal, Jam Ke, Kelas, dan Mapel sesuai jadwal KBM harian.
* **Portal Pribadi Guru**: Akses instan via NIP atau tautan personal (`?nip=...`).
* **Dashboard Admin**: Manajemen master guru, formulir, dan jadwal KBM terintegrasi Cloud Firestore.
* **Ekspor & Impor Data**: Dukungan ekspor/impor jadwal dan data guru via Excel (.xlsx).

## Teknologi
* **Frontend**: HTML5, Vanilla JavaScript (ES Modules), Modern Glassmorphic CSS.
* **Backend / Database**: Google Firebase JS SDK v10 (Cloud Firestore & Firebase Auth).
