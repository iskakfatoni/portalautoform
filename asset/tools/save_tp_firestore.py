import json
import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ID = "form-autoform"
API_KEY = "AIzaSyBJUu8_4G_WK30h4W61XunUFvu7uutBibo"

data_tp = [
    (1, "Mengidentifikasi spesifikasi teknis, diagram blok arsitektur internal ATmega328P, serta pemetaan pinout digital, analog, dan power pada Arduino UNO R3."),
    (2, "Menginstal dan mengonfigurasi perangkat lunak Arduino IDE 2.x, driver USB komunikasi serial (CH340/FTDI), serta menguji transmisi pesan pada Serial Monitor."),
    (3, "Menguasai struktur sintaks dasar pemrograman C++ embedded (void setup(), void loop(), tipe data, scope variabel, dan operator)."),
    (4, "Menyusun fungsi modular C++ kustom (user-defined function), melakukan verifikasi kompilasi GCC AVR, dan menganalisis alokasi memory footprint (Flash & SRAM)."),
    (5, "Menganalisis skema jalur elektronik (schematic layout) dan memetakan pinout periferal EMS Basic I/O Shield V1.0 ke mikrokontroler."),
    (6, "Mengonfigurasi mode pin register digital (pinMode OUTPUT) dan memprogram kendali logika Aktif HIGH/LOW pada 4 array LED onboard (D6-D9)."),
    (7, "Merancang algoritma dan memprogram variasi pola animasi Running LED dan Knight Rider berbasis perulangan dan manipulasi array."),
    (8, "Mengonfigurasi interfacing tombol pushbutton onboard (SW1/D2, SW2/D4) menggunakan fitur resistor internal INPUT_PULLUP untuk mencegah floating pin."),
    (9, "Menerapkan teknik software debouncing untuk meredam derau kontak sakelar mekanis serta memprogram state machine sakelar toggle LED."),
    (10, "Memprogram pembangkitan sinyal frekuensi audio pada buzzer piezoelektrik (D5) menggunakan fungsi tone() dan noTone() untuk nada melodis serta alarm."),
    (11, "Mengintegrasikan seluruh periferal digital I/O terpadu (multi-button input, array LED, dan indikator alarm buzzer) secara simultan."),
    (12, "Memahami prinsip konversi analog-ke-digital (ADC 10-bit 0-1023), tegangan referensi (Vref), resolusi (Vstep), dan rangkaian pembagi tegangan analog."),
    (13, "Membaca data masukan analog Potensiometer onboard (A1) menggunakan analogRead() serta mengalibrasi konversi data ADC ke satuan tegangan nyata (Volt)."),
    (14, "Menganalisis karakteristik perubahan resistansi sensor cahaya LDR dan menampilkan grafik telemetri secara real-time pada Serial Plotter IDE 2.x."),
    (15, "Menerapkan teknik pengolahan dan kalibrasi sinyal analog menggunakan fungsi penskalaan matematis map() dan batas aman constrain()."),
    (16, "Memahami prinsip Pulse Width Modulation (PWM 8-bit 0-255) dan mengatur regulasi daya keluaran aktuator menggunakan instruksi analogWrite()."),
    (17, "Merancang dan menguji sistem kendali dimmer lampu otomatis / penerangan cerdas berbasis integrasi sensor LDR dan modulasi PWM."),
    (18, "Melaksanakan evaluasi Sumatif Tengah Semester (STS) melalui uji teori pengolahan sinyal dan uji unjuk kerja eksperimen ADC-PWM."),
    (19, "Memprogram teknik pemindaian cepat (scanning multiplexing) display 2-digit 7-Segment onboard menggunakan bus data (D6-D9) dan transistor selektor (A2/A3)."),
    (20, "Merancang algoritma penghitung waktu (digital clock counter) pada 7-Segment dengan metode eliminasi bayangan tampilan (anti-ghosting)."),
    (21, "Menguasai protokol komunikasi serial I2C (Inter-Integrated Circuit), mendeteksi alamat modul via I2C Scanner, dan mengonfigurasi driver modul LCD 16x2."),
    (22, "Memprogram penampil data telemetri sensor secara terformat serta merancang ikon grafis kustom (custom character 5x8 pixel) pada LCD 16x2."),
    (23, "Mengintegrasikan modul display grafik OLED 0.96\" SSD1306, mengelola alokasi framebuffer, menggambar bentuk geometri, dan merender gambar bitmap."),
    (24, "Merancang antarmuka menu navigasi interaktif multi-halaman (multi-level UI menu) berbasis penekanan tombol navigasi untuk pengaturan sistem."),
    (25, "Menganalisis kelemahan fungsi blocking delay() dan menerapkan konsep pewaktuan non-blocking multitasking berbasis kalkulasi millis()."),
    (26, "Memprogram eksekusi tugas paralel (multitasking) untuk menjalankan ritme kedip beberapa LED dan pembacaan sensor simultan tanpa freezing."),
    (27, "Mengonfigurasi interupsi perangkat keras eksternal (External Interrupt INT0 / Pin D2) dan menyusun fungsi Interrupt Service Routine (ISR) untuk respon darurat."),
    (28, "Merancang diagram transisi status (State Diagram) dan mengimplementasikan algoritma mesin status (Finite State Machine / FSM) menggunakan struktur switch-case."),
    (29, "Mengintegrasikan pembacaan sensor jarak ultrasonik (HC-SR04) dengan kendali aktuator driver Relay 5V DC dan motor servo sudut (0°-180°)."),
    (30, "Mengidentifikasi permasalahan otomasi di lingkungan sekitar, merumuskan ide inovasi rekayasa kendali, dan menyusun lembar spesifikasi teknis proyek."),
    (31, "Merancang skematik pengkabelan terpadu (hardware wiring schematic) serta diagram alir logika algoritma FSM non-blocking."),
    (32, "Mengembangkan dan mengintegrasikan seluruh modul firmware C++ terstruktur berbasis kaidah kode bersih (clean code) dan pemrograman modular."),
    (33, "Melakukan pengujian keandalan sistem (burn-in test), kalibrasi sensor, penyelarasan respon aktuator, dan penanganan kesalahan program (debugging)."),
    (34, "Menyusun dokumen portofolio teknis dan laporan komprehensif proyek capstone (skematik, source code, lembar uji, dan manual penggunaan)."),
    (35, "Mempresentasikan produk hasil karya inovasi, mendemonstrasikan fungsi alat pada gelar karya teknologi, serta menyelesaikan asesmen Sumatif Akhir Tahun (SAT).")
]

tp_array_values = []
for meeting, tp_text in data_tp:
    tp_array_values.append({
        "mapValue": {
            "fields": {
                "pertemuan": {"integerValue": str(meeting)},
                "kodeTp": {"stringValue": f"TP-{meeting:02d}"},
                "materi": {"stringValue": tp_text}
            }
        }
    })

payload = {
    "fields": {
        "mapel": {"stringValue": "Mapel Pilihan dan Sistem Kendali Elektronika"},
        "tingkat": {"stringValue": "XI"},
        "kelas": {
            "arrayValue": {
                "values": [
                    {"stringValue": "XI TEI 1"},
                    {"stringValue": "XI TEI 2"}
                ]
            }
        },
        "totalPertemuan": {"integerValue": "35"},
        "listTp": {
            "arrayValue": {
                "values": tp_array_values
            }
        },
        "updatedAt": {"stringValue": "2026-08-26T17:44:00Z"}
    }
}

for col in ["mapel", "config"]:
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{col}/ske_xi?key={API_KEY}"
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={"Content-Type": "application/json"}, 
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ Berhasil menyimpan 35 TP ke koleksi {col}/ske_xi (Status: {resp.status})")
    except Exception as e:
        print(f"❌ Gagal menyimpan ke {col}/ske_xi: {e}")
