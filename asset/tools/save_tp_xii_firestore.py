import json
import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ID = "form-autoform"
API_KEY = "AIzaSyBJUu8_4G_WK30h4W61XunUFvu7uutBibo"

data_tp_xii = [
    (1, "Mengidentifikasi arsitektur internal SoC ESP32 (Xtensa Dual-Core 32-bit LX6), alokasi memori SRAM/Flash, dan pemetaan matriks GPIO."),
    (2, "Mengonfigurasi board package ESP32 Espressif pada Arduino IDE 2.x, pengaturan skema partisi Flash, dan pengujian upload serial."),
    (3, "Memprogram sensor sentuh internal (Capacitive Touch Pins) dan pembangkitan gelombang analog presisi via True DAC (Digital-to-Analog Converter)."),
    (4, "Menerapkan konsep dasar multitasking real-time menggunakan FreeRTOS (Task Creation & Task Pinning ke Core 0 / Core 1)."),
    (5, "Melakukan uji eksperimental periferal onboard ESP32, manajemen konsumsi daya hemat (Deep Sleep Mode), dan konfigurasi wake-up trigger."),
    (6, "Mengonfigurasi mode koneksi Wi-Fi Station (STA), Soft Access Point (AP), dan penanganan mekanisme auto-reconnect saat putus jaringan."),
    (7, "Merancang dan mengimplementasikan Wi-Fi Captive Portal Manager (WiFiManager) untuk konfigurasi kredensial SSID/Password tanpa hardcode."),
    (8, "Mengonfigurasi komunikasi nirkabel Serial Bluetooth (SPP) untuk kendali aktuator relay via aplikasi smartphone Android."),
    (9, "Memahami arsitektur Bluetooth Low Energy (BLE), Generic Access Profile (GAP), dan Generic Attribute Profile (GATT Services & Characteristics)."),
    (10, "Mengimplementasikan ESP32 sebagai BLE Server dengan Custom Service untuk menyiarkan (advertisement) data telemetri sensor."),
    (11, "Mengintegrasikan multi-konektivitas nirkabel (mekanisme failover dari Wi-Fi ke Bluetooth) untuk sistem redundansi komunikasi data."),
    (12, "Membangun sistem Embedded Web Server asinkron mandiri menggunakan pustaka ESPAsyncWebServer pada port HTTP 80."),
    (13, "Mengonfigurasi sistem berkas internal LittleFS untuk menyimpan dan melayani aset antarmuka web statis (HTML5, CSS3, JavaScript)."),
    (14, "Merancang antarmuka Web UI responsif untuk monitoring status sensor dan kontrol switch tombol aktuator via protokol HTTP GET/POST."),
    (15, "Menerapkan komunikasi dua arah berkecepatan tinggi via WebSocket Protocol untuk streaming grafik data sensor live tanpa refresh halaman."),
    (16, "Mengintegrasikan pustaka ArduinoJson untuk serialisasi data sensor ke format JSON dan deserialisasi payload perintah kendali."),
    (17, "Mengonfigurasi HTTP Client pada ESP32 untuk mengonsumsi data dari REST API publik (misal server cuaca/NTP) dan mengirim data ke endpoint cloud."),
    (18, "Melaksanakan evaluasi Sumatif Tengah Semester (STS) melalui uji unjuk kerja pembuatan sistem Web Server IoT dan manajemen LittleFS."),
    (19, "Memahami arsitektur protokol Message Queuing Telemetry Transport (MQTT), konsep Broker, Topic, Publish, Subscribe, dan Level QoS."),
    (20, "Mengonfigurasi koneksi client MQTT (PubSubClient) pada ESP32 menuju Cloud Broker publik/privat (HiveMQ / EMQX / Mosquitto)."),
    (21, "Memprogram mekanisme pengiriman data sensor periodik (Publish) dan penerimaan perintah kendali jarak jauh (Subscribe) via MQTT Broker."),
    (22, "Membangun dashboard antarmuka grafis mobile dan web terpadu menggunakan platform IoT Cloud (Blynk IoT / ThingsBoard)."),
    (23, "Mengintegrasikan bot notifikasi otomatis (Telegram Bot API) untuk mengirimkan peringatan darurat (alert notification) ke smartphone."),
    (24, "Melakukan pengujian terpadu sistem telemetri IoT: Publish Sensor -> Cloud Broker -> Dashboard UI -> Alert Telegram."),
    (25, "Menerapkan enkripsi data aman end-to-end menggunakan protokol HTTPS dan MQTTS berbasis sertifikat keamanan TLS/SSL (X.509)."),
    (26, "Mengimplementasikan pembaruan firmware nirkabel jarak jauh (Over-The-Air / OTA Update) menggunakan ElegantOTA / ArduinoOTA."),
    (27, "Mengonfigurasi sistem proteksi perangkat keras Hardware Watchdog Timer (WDT) untuk mencegah sistem mengalami hang/freeze."),
    (28, "Menerapkan algoritma pemfilteran sinyal sensor di level edge (Moving Average Filter) untuk mereduksi noise sebelum diunggah ke cloud."),
    (29, "Melakukan uji ketahanan sistem terhadap kegagalan jaringan (stress test koneksi, simulasi crash watchdog, dan integritas OTA)."),
    (30, "Melakukan riset studi kasus industri lokal (Smart Agriculture / Smart Home / Smart Factory) dan merumuskan lembar spesifikasi Capstone Project IoT."),
    (31, "Merancang arsitektur sistem IoT end-to-end terintegrasi (Node Sensor -> ESP32 Controller -> Cloud Telemetry -> UI Dashboard)."),
    (32, "Melakukan perakitan sirkuit hardware industri, fabrikasi enclosure box, dan pemrograman firmware modular C++ berbasis FreeRTOS."),
    (33, "Melakukan uji ketahanan lapangan (field deployment & burn-in test), kalibrasi sensor terdistribusi, dan debugging performa sistem secara live."),
    (34, "Menyusun dokumen portofolio teknis dan buku panduan operasional proyek rekayasa sistem IoT (technical manual & report)."),
    (35, "Mempresentasikan produk hasil karya inovasi pada Gelar Karya Expo Teknologi IoT dan menyelesaikan evaluasi Sumatif Akhir Tahun (SAT).")
]

tp_array_values = []
for meeting, tp_text in data_tp_xii:
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
        "tingkat": {"stringValue": "XII"},
        "kelas": {
            "arrayValue": {
                "values": [
                    {"stringValue": "XII TEI 1"},
                    {"stringValue": "XII TEI 2"}
                ]
            }
        },
        "totalPertemuan": {"integerValue": "35"},
        "listTp": {
            "arrayValue": {
                "values": tp_array_values
            }
        },
        "updatedAt": {"stringValue": "2026-08-26T17:55:00Z"}
    }
}

for col in ["mapel", "config"]:
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{col}/ske_xii?key={API_KEY}"
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={"Content-Type": "application/json"}, 
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ Berhasil menyimpan 35 TP Kelas XII ke koleksi {col}/ske_xii (Status: {resp.status})")
    except Exception as e:
        print(f"❌ Gagal menyimpan ke {col}/ske_xii: {e}")
