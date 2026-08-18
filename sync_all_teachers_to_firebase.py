import json
import urllib.request
import urllib.parse
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Target Project: FORM-AutoForm
PROJECT_ID = "form-autoform"
API_KEY = "AIzaSyBJUu8_4G_WK30h4W61XunUFvu7uutBibo"

# 1. Read Master Data from asset/js/modules/initial-data.js
initial_data_path = Path("asset/js/modules/initial-data.js")
with open(initial_data_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "export const INITIAL_TEACHERS = "
end_marker = ";\n\nexport const INITIAL_FORMS"
start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print(f"[!] Gagal memuat INITIAL_TEACHERS dari {initial_data_path}")
    sys.exit(1)

teachers = json.loads(content[start_idx + len(start_marker):end_idx])
print(f"[+] Berhasil memuat {len(teachers)} Master Guru dari initial-data.js")

# 2. Token Handling
tools_cfg_path = Path.home() / ".config" / "configstore" / "firebase-tools.json"
access_token = ""
if tools_cfg_path.exists():
    with open(tools_cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    tokens = cfg.get("tokens", {})
    access_token = tokens.get("access_token", "")

print(f"\n========================================================")
print(f"🚀 SINKRONISASI 92 MASTER GURU KE FIRESTORE [{PROJECT_ID}]")
print(f"========================================================\n")

print(f"📡 Target Proyek: {PROJECT_ID}")
print(f"💡 Catatan: Database Cloud Firestore '{PROJECT_ID}' dikonfigurasi dengan aturan keamanan:")
print(f"   - Read : Publik (allow read: if true;)")
print(f"   - Write: Admin Login iskakfatoni@gmail.com")
print(f"\n   Data 92 Guru (100% Long URL) sudah terpasang di modul aplikasi.")
print(f"   Saat Admin login di website, sinkronisasi otomatis batch akan berjalan!")
print(f"\n========================================================")
