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
| 3 | **KELAS** | `entry.666017338` | Multiple Choice / Dropdown | Kelas Resmi dari Jadwal Aktif | `XII  TEI 2` |
| 4 | **MATA PELAJARAN** | `entry.73505426` | Short Text / Dropdown | Mapel dari Jadwal Aktif | `Mapel Pilihan dan Sistem Kendali Elektronika` |
| 5 | **CAPAIAN / MATERI** | `entry.1059038821` | Paragraph | Master TP / Pilihan Materi Guru | `Mengidentifikasi spesifikasi teknis ATmega328P...` |
| 6 | **JUMLAH SISWA HADIR** | `entry.849827907` | Short Text / Number | Diisi Manual oleh Guru | *(Manual)* |
| 7 | **JUMLAH SISWA TIDAK HADIR** | `entry.1015848753` | Short Text / Number | Diisi Manual oleh Guru | *(Manual)* |
| 8 | **KETERANGAN SISWA TIDAK HADIR** | `entry.1997017466` | Paragraph | Diisi Manual oleh Guru | *(Manual)* |
| 9 | **CATATAN** | `entry.500965626` | Paragraph | Diisi Manual oleh Guru | *(Manual)* |
| 10 | **TINDAK LANJUT** | `entry.275444474` | Paragraph | Diisi Manual oleh Guru | *(Manual)* |

---

## 3. LOGIKA OTOMASI JADWAL JURNAL

### Aturan 3: Modal Interaktif Pemilihan Mata Pelajaran & Silabus Capaian (TP)
* **Auto-Detect Mata Pelajaran:** Sistem otomatis mendeteksi mata pelajaran dari jam KBM aktif (Koding & AI / SKE XI / SKE XII).
* **Fleksibilitas Penggantian Mapel:** Guru dapat mengganti silabus/mapel langsung dari dropdown:
  1. `koding_ai_xi` : Koding dan Kecerdasan Artifisial (Kelas XI - 35 Pertemuan).
  2. `ske_xi` : Sistem Kendali Elektronika - Arduino & Embedded (Kelas XI - 35 Pertemuan).
  3. `ske_xii` : Sistem Kendali Elektronika - ESP32 & IoT (Kelas XII - 35 Pertemuan).
  4. `custom_manual` : Opsi Tulis Materi Mandiri / Kustom.
* **Live Textarea Edit:** Guru dapat mengedit teks rumusan materi secara langsung pada kotak teks modal sebelum membuka Google Form.
* **Preferensi Tersimpan:** Pilihan pertemuan dan mapel terakhir otomatis tersimpan di `localStorage` per akun guru.

---

## 4. CONTOH URL HASIL GENERATE
```
https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform?usp=pp_url&entry.1708105874=2026-08-26&entry.585996771=1-6&entry.666017338=XII++TEI+2&entry.73505426=Mapel+Pilihan+dan+Sistem+Kendali+Elektronika&entry.1059038821=Mengidentifikasi+spesifikasi+teknis%2C+diagram+blok+arsitektur+internal+ATmega328P...
```
