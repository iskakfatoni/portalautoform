# 📜 DOKUMENTASI PROGRES & RIWAYAT PERCAKAPAN (FIX ABSENSI MENGAJAR)
**Proyek:** PORTAL:AutoForm (Multi-User Cloud Application)  
**Tanggal Penyelesaian:** 17 Agustus 2026  
**Status Modul Absensi:** ✅ **100% Tuntas, Teruji, & Terhubung ke Cloud Firestore**

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif & Sasaran](#1-ringkasan-eksekutif--sasaran)
2. [Arsitektur Sistem: Pure In-Memory & Cloud Database](#2-arsitektur-sistem-pure-in-memory--cloud-database)
3. [Aturan Bisnis & Logika Cerdas Jadwal Absensi](#3-aturan-bisnis--logika-cerdas-jadwal-absensi)
4. [Pemetaan Form Google Form (Entry ID)](#4-pemetaan-form-google-form-entry-id)
5. [Daftar Masalah yang Ditemukan & Solusi Teknis](#5-daftar-masalah-yang-ditemukan--solusi-teknis)
6. [Riwayat Commit Git Terkait Modul Absensi](#6-riwayat-commit-git-terkait-modul-absensi)
7. [Status Kesiapan Menuju Modul Jurnal Mengajar](#7-status-kesiapan-menuju-modul-jurnal-mengajar)

---

## 1. Ringkasan Eksekutif & Sasaran
Tujuan dari modul ini adalah menciptakan sistem otomatisasi pengisian presensi guru (*Google Form Absensi Mengajar*) yang adaptif terhadap waktu KBM, hari kerja, dan identitas masing-masing guru, serta dapat digunakan secara multi-platform (Browser Desktop, HP, dan APK Android) secara real-time tanpa ketergantungan pada penyimpanan lokal HP (*LocalStorage*).

---

## 2. Arsitektur Sistem: Pure In-Memory & Cloud Database

### A. Penghapusan Total Penyimpanan Lokal (*No LocalStorage for Data*)
* **Masalah Awal:** Data guru, formulir, dan jadwal sebelumnya disimpan di `localStorage` masing-masing browser. Ketika dibuka dari APK Android atau browser baru, data kosong dan jatuh kembali ke data dummy contoh.
* **Solusi Final:**
  * Menghapus seluruh fungsi `saveLocal...` dan pembersihan storage `portal_schedule_data`, `portal_teachers_data`, `portal_forms_data`.
  * Seluruh data disimpan langsung di **Google Cloud Firestore**.
  * Di sisi klien (browser/APK), data hanya disimpan di **Memory RAM (`currentTeachers`, `currentForms`, `currentSchedules`)** saat aplikasi aktif.

### B. Struktur Koleksi Cloud Firestore
1. **`teachers`**: Berisi 92 data guru, NIP, kelas walikelas, dan link form jurnal pribadi.
2. **`forms`**: Berisi 5 formulir resmi dengan urutan dan deskripsi baku.
3. **`schedules`**: Berisi seluruh jadwal KBM guru dengan Document ID unik:
   `sch_{cleanNip}_{cleanName}_{cleanHari}_{cleanJam}_{cleanKelas}`

---

## 3. Aturan Bisnis & Logika Cerdas Jadwal Absensi

Alur penentuan jadwal otomatis diatur dalam file panduan [ABSENSI.md](file:///c:/Users/iskak/Antigravity-Projetcs/portalautoform/asset/rule/ABSENSI.md) dengan logika:

```
                  ┌───────────────────────────────┐
                  │   Guru Membuka Portal Guru    │
                  └───────────────┬───────────────┘
                                  ▼
                    Apakah Hari Sabtu / Minggu?
                   /                           \
               (Ya)                             (Tidak)
               /                                   \
  ┌────────────────────────┐             Apakah Ada Jadwal Aktif Sesuai Jam?
  │ HANYA Isi Nama & NIP   │            /                                   \
  │ (Tampilkan Banner Libur│        (Ya)                                     (Tidak)
  └────────────────────────┘        /                                           \
                   ┌─────────────────────────────┐                Apakah Ada Jadwal Nanti Hari Ini?
                   │ Auto-Fill Jadwal Sedang     │               /                                 \
                   │ Berlangsung (Jam/Kls/Mapel) │           (Ya)                                   (Tidak)
                   └─────────────────────────────┘           /                                         \
                                              ┌─────────────────────────────┐           Cek Jadwal Hari Kerja Besok
                                              │ Auto-Fill Jadwal Terdekat   │          /                           \
                                              │ Hari Ini (Persiapan Mengajar│      (Ada)                         (Kosong)
                                              └─────────────────────────────┘      /                                 \
                                                                  ┌─────────────────────────────┐       ┌────────────────────────┐
                                                                  │ Auto-Fill Jadwal Pertama    │       │ HANYA Isi Nama & NIP   │
                                                                  │ Hari Besok (Persiapan)      │       │ (Kelas & Mapel Kosong) │
                                                                  └─────────────────────────────┘       └────────────────────────┘
```

### 3 Proteksi Edge-Cases:
1. **Normalisasi Ejaan Hari:** Mengonversi `Jum'at` -> `Jumat`, `Ahad` -> `Minggu`, `Senin ` -> `Senin`.
2. **Normalisasi Format Jam:** Mengonversi `7:00` -> `07:00`, `07.00` -> `07:00`, serta angka pecahan desimal Excel (`0.29166` -> `07:00`).
3. **Boundary Minute Priority:** Pada menit pergantian jam (misal tepat pukul `08:30`), sistem memprioritaskan sesi yang baru dimulai.

---

## 4. Pemetaan Form Google Form (Entry ID)

### Form 1: FORM ABSENSI MENGAJAR
* **URL:** `https://docs.google.com/forms/d/e/1FAIpQLSfrm87oC00zamhQQBP4LS5BcwxSHa97M9plvLpYUHQ7dR-ybQ/viewform`
* **Daftar Field:**
  * `entry.691754896` = **NAMA GURU**
  * `entry.65154558` = **NIP**
  * `entry.1708105874` = **HARI/TANGGAL** (Format: `YYYY-MM-DD`)
  * `entry.585996771` = **JAM KE** (Format: `1-4`, `5-6`, dll)
  * `entry.666017338` = **KELAS** (Pilihan resmi format: `XII  TEI 1`)
  * `entry.73505426` = **MATA PELAJARAN**

---

## 5. Daftar Masalah yang Ditemukan & Solusi Teknis

| No | Masalah yang Terjadi | Akar Penyebab | Solusi & Penanganan |
| :---: | :--- | :--- | :--- |
| 1 | Data di APK Android salah / berbeda dengan browser laptop | APK tidak memiliki cache LocalStorage sehingga membaca data dummy | Menghapus localStorage dan menggantinya dengan Cloud Firestore terpusat |
| 2 | Impor Excel jadwal gagal tersimpan di Firestore | Variabel `db` bernilai `null` saat diimpor karena evaluasi modul asinkron | Membuat fungsi auto-initialize instan `getDb()` |
| 3 | Error `Missing or insufficient permissions` saat impor | Firestore Security Rules belum memuat izin untuk koleksi `schedules` | Menambahkan `match /schedules/{document=**}` dengan `allow read: if true; allow write: if isAuthorizedAdmin();` |
| 4 | Jadwal sempat kosong di panel Admin saat refresh | `fetchFirestoreData()` dijalankan sebelum status login Google Admin selesai diverifikasi | Menambahkan pemanggilan `fetchFirestoreData()` otomatis setelah autentikasi admin berhasil (`handleAdminLoginState`) |
| 5 | Error `ReferenceError: getDb is not defined` di console | Simbol `getDb` diekspor di `firebase-config.js` tetapi lupa di-import di baris atas `app.js` | Menambahkan `getDb` ke daftar import `app.js` |
| 6 | Jadwal tidak terbaca jika Excel memiliki kop judul di atas | Parser mengasumsikan header selalu berada di baris 0 | Menambahkan *Dynamic Header Row Detector* yang memindai 10 baris pertama untuk mencari header tabel |
| 7 | Format jam di Excel terbaca angka pecahan (`0.29166`) | SheetJS mengembalikan desimal Excel jika sel diformat tipe waktu (*Time*) | Menambahkan konversi otomatis angka pecahan desimal Excel menjadi format waktu `HH:mm` |
| 8 | Domain `iskakfatoni.github.io` belum diizinkan untuk login OAuth | Firebase Auth memerlukan daftar domain resmi | Menambahkan domain GitHub Pages ke menu *Authorized Domains* Firebase |

---

## 6. Riwayat Commit Git Terkait Modul Absensi

* `9e15569`: *docs(rule): create ABSENSI.MD, remove localStorage caching, connect subtab schedule UI*
* `37f23b8`: *fix: auto initialize Firebase instance and ensure direct Firestore write on schedule import*
* `0337f9c`: *fix(security): add schedules collection rule to firestore.rules*
* `18bfd98`: *chore: add debug logger for schedule selection and form URL generator*
* `a65f7e7`: *fix: re-fetch Firestore data on admin login state resolution*
* `0f703e2`: *fix: smart sheet selection, dynamic header row detection, Excel time fraction parsing, and loose teacher matching*
* `2823960`: *fix: import getDb symbol from firebase-config and isolate Firestore reads in app.js*

---

## 7. Status Kesiapan Menuju Modul Jurnal Mengajar
* ✅ Modul Absensi Mengajar telah **100% selesai dan bekerja sempurna**.
* ✅ Data jadwal mengajar telah tersimpan lengkap di Cloud Firestore.
* 🚀 **Tahap Berikutnya:** Menerapkan Auto-Fill Parameter (Tanggal, Jam Ke, Kelas, Mapel) ke dalam masing-masing link Google Form Jurnal Pribadi dari 92 guru.
