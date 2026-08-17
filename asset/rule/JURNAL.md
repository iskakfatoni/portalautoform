# 📘 ATURAN & STANDARISASI: FORM JURNAL MENGAJAR GURU

Dokumen ini berisi spesifikasi teknis, pemetaan field (Entry ID), dan logika otomasi **Form Jurnal Mengajar** pada aplikasi PORTAL:AutoForm.

---

## 1. STRUKTUR FORMULIR & LINK PRIBADI
* **Tipe Formulir:** Google Form Pribadi per Guru (Setiap guru memiliki URL Google Form khusus yang tersimpan di field `teacher.journalFormUrl`).
* **Mekanisme Pengisian:** Auto-Fill via Query Parameters URL (`?usp=pp_url&...`).

---

## 2. PEMETAAN ENTRY ID (GOOGLE FORM JURNAL)

| No | Nama Field di Google Form | Entry ID Google Form | Tipe Input | Sumber Data Auto-Fill | Contoh Output |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | **HARI/TANGGAL** | `entry.1708105874` | Date | Tanggal Hari Ini (`YYYY-MM-DD`) | `2026-08-17` |
| 2 | **JAM KE** | `entry.585996771` | Short Text / Dropdown | Jam Ke dari Jadwal Aktif | `1-4` atau `5-6` |
| 3 | **KELAS** | `entry.666017338` | Multiple Choice / Dropdown | Kelas Resmi dari Jadwal Aktif | `XII  TEI 1` |
| 4 | **MATA PELAJARAN** | `entry.73505426` | Short Text / Dropdown | Mapel dari Jadwal Aktif | `Teknik Kontrol Sistem Robotik` |
| 5 | **CAPAIAN / MATERI** | `entry.1059038821` | Paragraph | Diisi Manual oleh Guru | *(Manual)* |
| 6 | **JUMLAH SISWA HADIR** | `entry.849827907` | Short Text / Number | Diisi Manual oleh Guru | *(Manual)* |
| 7 | **JUMLAH SISWA TIDAK HADIR** | `entry.1015848753` | Short Text / Number | Diisi Manual oleh Guru | *(Manual)* |
| 8 | **KETERANGAN SISWA TIDAK HADIR** | `entry.1997017466` | Paragraph | Diisi Manual oleh Guru | *(Manual)* |
| 9 | **CATATAN** | `entry.500965626` | Paragraph | Diisi Manual oleh Guru | *(Manual)* |
| 10 | **TINDAK LANJUT** | `entry.275444474` | Paragraph | Diisi Manual oleh Guru | *(Manual)* |

---

## 3. LOGIKA OTOMASI JADWAL JURNAL

### Aturan 1: Hari Kerja Aktif (Senin - Jumat)
* **Sesi Sedang Berlangsung:** Sistem mengisi Tanggal, Jam Ke, Kelas, dan Mapel sesuai jam yang aktif saat ini.
* **Persiapan Jam Berikutnya:** Jika jam pertama belum mulai, sistem mengisi jadwal pertama hari ini.
* **Sore / Malam Hari (KBM Hari Ini Selesai):** Sistem otomatis membaca dan mengisi jadwal mengajar hari kerja berikutnya (besok pagi) untuk persiapan guru.

### Aturan 2: Akhir Pekan (Sabtu & Minggu) atau Hari Tanpa Jadwal
* Sistem **HANYA mengisi Tanggal Hari Ini** (`entry.1708105874`).
* Field Jam Ke, Kelas, dan Mapel dibiarkan kosong agar guru dapat memilih/mengisi secara mandiri jika ada kegiatan tambahan di luar jam reguler.

---

## 4. CONTOH URL HASIL GENERATE
```
https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform?usp=pp_url&entry.1708105874=2026-08-17&entry.585996771=1-4&entry.666017338=XII++TEI+1&entry.73505426=Teknik+Kontrol+Sistem+Robotik
```
