import json
import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ID = "form-autoform"
API_KEY = "AIzaSyBJUu8_4G_WK30h4W61XunUFvu7uutBibo"

data_cp_koding_ai = [
    (1, "Menganalisis peran, keunggulan komparatif, dan sinergi kolaborasi manusia dan KA berdasarkan kuadran empati-optimasi serta model industri (Model Factory vs Model Artisan)."),
    (2, "Memanfaatkan teknologi KA untuk penyuntingan teks serta menerapkan teknik rekayasa prompt (prompt engineering) secara kritis dan efektif."),
    (3, "Memproduksi dan menyunting konten visual (image/video) serta audio digital menggunakan berbagai alat bantu berbasis KA (Magic Edit, Text-to-Image, Audio Enhancement)."),
    (4, "Memproduksi konten kampanye digital kolaboratif dengan menerapkan prinsip etika digital, hak cipta, dan lisensi Creative Commons."),
    (5, "Menyebarluaskan (diseminasi) konten digital secara strategis, menganalisis metrik respons audiens, dan mengevaluasi dampak etisnya."),
    (6, "Mengidentifikasi dampak positif otomatisasi tugas rutin dan menganalisis 7 risiko dampak negatif KA terhadap dunia kerja."),
    (7, "Menganalisis pergeseran kebutuhan keterampilan dan merancang rencana adaptasi karier (upskilling/reskilling) di era kecerdasan buatan."),
    (8, "Menganalisis ketimpangan sosial akibat adopsi teknologi serta merancang diagram solusi kolaborasi manusia-mesin untuk masalah nyata."),
    (9, "Mengimplementasikan prinsip dan framework Human-Centered AI (keterlibatan pengguna, keamanan, privasi, dan inklusivitas)."),
    (10, "Mengidentifikasi kerentanan keamanan sistem informasi, ancaman serangan adversarial (evasi/poisoning), dan risiko re-identifikasi data anonim."),
    (11, "Menerapkan 4 pilar etika pengembangan KA (transparansi algoritma, akuntabilitas, keadilan/anti-bias, dan kontrol manusia)."),
    (12, "Menerapkan struktur kontrol algoritma pemrograman (runtutan, percabangan match-case, perulangan, fungsi dan prosedur) dalam bahasa Python."),
    (13, "Memodelkan abstraksi dunia nyata ke dalam cetak biru kelas (class), atribut identitas, dan metode perilaku objek (instance)."),
    (14, "Mengimplementasikan prinsip enkapsulasi data melalui access modifier private (__) serta metode getter dan setter tervalidasi."),
    (15, "Menerapkan pewarisan tunggal (single inheritance) dan menginisialisasi atribut superclass menggunakan fungsi super().__init__()."),
    (16, "Mengimplementasikan pewarisan majemuk (multiple inheritance) untuk mengombinasikan fungsionalitas dari berbagai kelas induk."),
    (17, "Mengimplementasikan polimorfisme melalui mekanisme method overriding dan penanganan argumen dinamis (overloading *args)."),
    (18, "Merancang dan menerapkan kelas abstrak (Abstract Base Class) menggunakan modul abc sebagai kontrak kerangka arsitektur program."),
    (19, "Mendemonstrasikan integrasi capaian kompetensi literasi kolaborasi KA, etika ketenagakerjaan, dan pemrograman berorientasi objek Python melalui Sumatif Akhir Semester (SAS) Ganjil."),
    (20, "Mengidentifikasi karakteristik tipe data (kategorikal & numerik), melakukan pembersihan data (data cleaning), dan mengakses dataset melalui pustaka Pandas."),
    (21, "Mengimplementasikan teknik Label Encoding dan One Hot Encoding pada variabel kategorikal nominal dalam bahasa Python."),
    (22, "Mengimplementasikan teknik Binary Encoding, Ordinal Encoding, dan Target Encoding untuk persiapan data pemodelan machine learning."),
    (23, "Merancang struktur basis data relasional (Entity-Relationship Diagram / ERD), menentukan Primary & Foreign Key, serta mengeksekusi kueri SQL dasar."),
    (24, "Membangun koneksi basis data (SQLite3/MySQL) di Python serta menerapkan teknik kueri berparameter aman dari serangan SQL Injection."),
    (25, "Membangun aplikasi terpadu yang mengintegrasikan teknik data encoding dan operasi CRUD (Create, Read, Update, Delete) pada basis data SQLite3."),
    (26, "Menganalisis 4 paradigma Machine Learning (Supervised, Unsupervised, Semi-Supervised, Reinforcement) dan memetakan alur kerja siklus pelatihan model."),
    (27, "Memahami logika kerja, struktur, dan formula algoritma pokok ML (Decision Tree, KNN, Regresi Linier, K-Means Clustering, Association Rule Model)."),
    (28, "Mengimplementasikan pipeline pemrosesan teks NLP (Tokenisasi, Stemming/Lemmatisasi, dan Part of Speech Tagging)."),
    (29, "Menerapkan Named Entity Recognition (NER), analisis sentimen opini teks, dan memahami arsitektur chatbot NLP."),
    (30, "Merumuskan pemecahan masalah nyata menggunakan 4 pilar Computational Thinking dan menyusun analisis kebutuhan sistem (5W+1H / Requirement Analysis)."),
    (31, "Merancang cetak biru solusi perangkat lunak terintegrasi (Use Case Diagram, Flowchart Proses, ERD Data Model, dan Mockup UI/UX)."),
    (32, "Mengimplementasikan koding pembangunan model KA (klasifikasi bunga Iris dan regresi prediksi nilai) menggunakan pustaka Scikit-Learn."),
    (33, "Mengevaluasi kinerja model KA secara kuantitatif menggunakan metrik evaluasi (Accuracy, Confusion Matrix, MAE, MSE, R²) serta melakukan hyperparameter tuning."),
    (34, "Menganalisis konsep Large Language Models (LLM), arsitektur Transformer, dan melakukan pengujian sistem bertingkat (Black-Box & User Acceptance Testing)."),
    (35, "Menyajikan gelar karya prototipe solusi rekayasa koding & AI terpadu serta menuntaskan asesmen Sumatif Akhir Tahun (SAT) Fase F Kelas XI.")
]

cp_array_values = []
for meeting, cp_text in data_cp_koding_ai:
    cp_array_values.append({
        "mapValue": {
            "fields": {
                "pertemuan": {"integerValue": str(meeting)},
                "kodeTp": {"stringValue": f"P{meeting:02d}"},
                "materi": {"stringValue": cp_text}
            }
        }
    })

payload = {
    "fields": {
        "mapel": {"stringValue": "Koding dan Kecerdasan Artifisial"},
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
                "values": cp_array_values
            }
        },
        "updatedAt": {"stringValue": "2026-08-26T18:48:00Z"}
    }
}

for col in ["mapel", "config"]:
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{col}/koding_ai_xi?key={API_KEY}"
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={"Content-Type": "application/json"}, 
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ Berhasil menyimpan 35 CP Koding & AI ke koleksi {col}/koding_ai_xi (Status: {resp.status})")
    except Exception as e:
        print(f"❌ Gagal menyimpan ke {col}/koding_ai_xi: {e}")
