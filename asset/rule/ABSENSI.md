# ATURAN & STANDAR AUTO-FILL FORM ABSENSI MENGAJAR
**PORTAL:AutoForm - SMK Negeri 1 Jetis Mojokerto**

Dokumen ini berisi dokumentasi resmi mengenai aturan logika bisnis, pemetaan parameter Google Form (*Entry IDs*), dan alur kerja otomatisasi pengisian presensi mengajar guru.

---

## 1. Peta Parameter Google Form Absensi Mengajar

* **Nama Formulir:** `FORM ABSENSI MENGAJAR`
* **Base URL:** `https://docs.google.com/forms/d/e/1FAIpQLSfrm87oC00zamhQQBP4LS5BcwxSHa97M9plvLpYUHQ7dR-ybQ/viewform`

### Tabel Pemetaan Entry ID:

| No | Field Pertanyaan di Form | Kode Parameter Google Form | Status Pengisian | Nilai yang Diisikan Sistem |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **NAMA GURU** | `entry.691754896` | ⚡ **Auto-Fill** | Nama Lengkap & Gelar Guru yang login |
| 2 | **NIP** | `entry.65154558` | ⚡ **Auto-Fill** | 18 Digit Nomor Induk Pegawai Guru |
| 3 | **HARI/TANGGAL** | `entry.1708105874` | ⚡ **Auto-Fill** | Tanggal hari ini (Format ISO: `YYYY-MM-DD`) |
| 4 | **JAM KE** | `entry.585996771` | ⚡ **Auto-Fill** | Sesi jam pelajaran (contoh: `1-2`, `1-4`, `5-8`) |
| 5 | **KELAS** | `entry.666017338` | ⚡ **Auto-Fill** | Nama kelas yang diajar (Spasi presisi: `XII  TEI 2`) |
| 6 | **MATA PELAJARAN** | `entry.73505426` | ⚡ **Auto-Fill** | Nama mata pelajaran yang diampu sesuai jadwal |
| 7 | **JUMLAH SISWA HADIR** | `entry.849827907` | ✍️ *Manual* | Dikosongkan (diisi manual oleh guru di kelas) |
| 8 | **SISWA TIDAK HADIR** | `entry.1015848753` | ✍️ *Manual* | Dikosongkan (diisi manual oleh guru di kelas) |
| 9 | **UPLOAD DOKUMENTASI** | `entry.1997017466` | 📸 *Manual* | Dikosongkan (untuk unggah foto bukti KBM) |

---

## 2. Aturan Logika Pengisian Otomatis (*Auto-Fill Rules*)

### A. Saat Berada di Jam Mengajar Aktif (*Active Schedule Time*)
* Sistem mendeteksi **Hari ini** (Senin - Jumat) dan **Jam Saat Ini** (WIB).
* Jika jam saat ini berada di antara `JAM_MULAI` dan `JAM_SELESAI` pada jadwal mengajar guru yang terdaftar:
  * Parameter **Nama Guru, NIP, Hari/Tanggal, Jam Ke, Kelas, dan Mata Pelajaran** terisi 100% otomatis.

### B. Saat Ada Jadwal Hari Ini Namun Belum Waktunya (*Upcoming Schedule Preparation*)
* Jika guru membuka form sebelum jam mengajar dimulai (misal pagi hari pukul 06.30 WIB atau saat istirahat/jeda antar jam pelajaran):
  * Sistem otomatis mengambil **jadwal mengajar terdekat berikutnya pada hari tersebut**.
  * **Tujuan:** Memudahkan guru dalam persiapan sebelum bel masuk berbunyi tanpa harus menunggu jam aktif dimulai.

### C. Saat Form Dibuka Melewati Seluruh Jadwal Hari Itu (*Past Schedule / Next Day Fallback*)
* Jika seluruh jam mengajar pada hari tersebut telah selesai dilewati (misal sore/malam hari):
  * Sistem otomatis mencari **jadwal mengajar terdekat pada hari berikutnya (besok)** untuk membantu persiapan mengajar keesokan harinya.
  * **Jika hari berikutnya KOSONG** (tidak ada jadwal sama sekali, misalnya hari Jumat sore ke Sabtu, atau besok hari libur):
    * ✅ **Nama Guru & NIP** tetap terisi otomatis 100%.
    * ✅ **Hari/Tanggal** tetap terisi tanggal hari ini.
    * ✍️ **Jam Ke, Kelas, dan Mata Pelajaran dikosongkan** *(hanya Nama & NIP yang terisi)*.

### D. Saat Hari Tidak Ada Jadwal Mengajar Sama Sekali (*No Schedule Day / Hari Kosong*)
* Jika pada hari tersebut guru yang bersangkutan tidak memiliki jadwal mengajar sama sekali:
  * Sistem mengecek apakah hari berikutnya memiliki jadwal.
  * Jika hari berikutnya ada jadwal: disiapkan jadwal terdekat hari berikutnya.
  * Jika hari berikutnya juga kosong: **hanya diisi Nama Guru & NIP saja**, sedangkan Kelas, Jam Ke, dan Mapel dibiarkan kosong.

---

## 3. Aturan Khusus Akhir Pekan (Sabtu & Minggu)

### A. Tampilan Banner Akhir Pekan (*Weekend Greeting Banner*)
* Setiap hari **Sabtu** dan **Minggu**, sistem secara otomatis mendeteksi status libur akhir pekan dan menampilkan banner ramah di halaman portal guru:
  > 🎉 **Selamat Berakhir Pekan / Hari Libur!**  
  > *Kegiatan Belajar Mengajar (KBM) libur hari ini dan aktif kembali pada hari **Senin**. Anda tetap dapat mengakses dan mengisi formulir di bawah jika diperlukan.*

### B. Perilaku Auto-Fill Form Absensi di Akhir Pekan (Sabtu & Minggu)
* Karena hari Sabtu dan Minggu merupakan hari libur resmi KBM:
  * ✅ **Nama Guru & NIP** tetap terisi otomatis 100%.
  * ✅ **Hari/Tanggal** tetap terisi tanggal hari ini.
  * ✍️ **Jam Ke, Kelas, dan Mata Pelajaran dibiarkan KOSONG**.
  * **Tujuan:** Tidak memaksa jadwal kelas tertentu saat akhir pekan, sehingga jika guru memiliki agenda pengganti/kegiatan khusus, guru dapat memilih manual di form.

### C. Akses 5 Formulir Tetap Terbuka Penuh
* Kelima tombol formulir utama (**Form Absensi Mengajar, Jurnal Mengajar, Absensi Piket, Wali Kelas, dan Guru Wali**) tetap aktif dan dapat dibuka langsung kapan saja untuk memfasilitasi guru yang ingin menyelesaikan laporan administrasi di akhir pekan.

---

## 4. Diagram Alur Logika Auto-Fill (*Full Decision Flow*)

```
               [ Guru Membuka FORM ABSENSI MENGAJAR ]
                                 │
                                 ▼
                     [ Cek Hari Saat Ini ]
                    /                     \
                   /                       \
        [ Sabtu / Minggu ]         [ Senin - Jumat (Hari Aktif) ]
                │                                  │
                ▼                                  ▼
        [ Muncul Banner Libur ]          [ Cek Jadwal Hari Ini ]
                │                               /         \
                ▼                              /           \
     [ HANYA ISI NAMA & NIP ]        [ Ada Jadwal ]     [ Tidak Ada Jadwal ]
     (Kelas & Mapel Kosong)                 │                    │
                                            ▼                    │
                               [ Cek Waktu Jam Saat Ini ]        │
                               /            │           \        │
                              /             │            \       │
                 [ Jam Aktif ]      [ Belum Jamnya ]   [ Sudah Lewat ]
                       │             (Pagi/Jeda)         Semua Jadwal
                       │                    │                  │
                       ▼                    ▼                  ▼
                 [ Isi Jadwal         [ Isi Jadwal       [ Cek Jadwal Besok ]
                  Jam Ini ]          Terdekat Hari Ini]       /          \
                                                             /            \
                                                  [ Besok Ada ]        [ Besok Libur/Kosong ]
                                                  (Senin-Kamis)           (Jumat Sore / Libur)
                                                        │                         │
                                                        ▼                         ▼
                                                  [ Isi Jadwal           [ HANYA ISI NAMA & NIP ]
                                                  Terdekat Besok ]       (Kelas & Mapel Kosong)
```

---

## 5. Struktur Data & Format Template Excel Jadwal

File template jadwal mengajar tersedia di: **`asset/template/Template_Jadwal_Mengajar.xlsx`**.

### Format Kolom Header:
```
NIP | NAMA_GURU | HARI | JAM_KE | JAM_MULAI | JAM_SELESAI | KELAS | MATA_PELAJARAN | KETERANGAN
```

### Contoh Data:
```
198109092022211004 | MUCHAMAD ISKAK FATONI, S.Pd. | Senin  | 1-4 | 07:00 | 10:00 | XII TEI 2 | Penerapan Sistem Radio dan Televisi | Lab Elektronika
198109092022211004 | MUCHAMAD ISKAK FATONI, S.Pd. | Senin  | 5-8 | 10:15 | 13:30 | XI TEI 1  | Mikroprosesor dan Mikrokontroler   | Lab Komputer
198109092022211004 | MUCHAMAD ISKAK FATONI, S.Pd. | Selasa | 1-4 | 07:00 | 10:00 | XII TEI 1 | Teknik Kontrol Sistem Robotik      | Lab Robotika
```

---
*Dokumen ini dibuat dan dikelola secara terpusat untuk standar pengembangan PORTAL:AutoForm.*
