import json
import urllib.request
import urllib.parse
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# 1. Read INITIAL_TEACHERS from asset/js/app.js
app_js_path = Path("asset/js/app.js")
with open(app_js_path, "r", encoding="utf-8") as f:
    app_js_content = f.read()

start_marker = "const INITIAL_TEACHERS = "
end_marker = ";\n\n// Master Data Kelas"
start_idx = app_js_content.find(start_marker)
end_idx = app_js_content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("[!] Gagal membaca INITIAL_TEACHERS dari asset/js/app.js")
    sys.exit(1)

teachers = json.loads(app_js_content[start_idx + len(start_marker):end_idx])
print(f"[+] Berhasil memuat {len(teachers)} Master Guru dari asset/js/app.js")

# 2. Get Access Token from configstore (with auto-refresh support)
tools_cfg_path = Path.home() / ".config" / "configstore" / "firebase-tools.json"
with open(tools_cfg_path, "r", encoding="utf-8") as f:
    cfg = json.load(f)

tokens = cfg.get("tokens", {})
access_token = tokens.get("access_token")
refresh_token = tokens.get("refresh_token")

def refresh_access_token(r_token):
    # Firebase CLI public OAuth client
    token_url = "https://oauth2.googleapis.com/token"
    # standard google oauth refresh
    data = urllib.parse.urlencode({
        "client_id": "563584335869-fgrhgmd47bqnekij5i8b5pr03ho85qd6.apps.googleusercontent.com",
        "client_secret": "j9iVZfS8kkCEgUPaAeJV0sw7",
        "refresh_token": r_token,
        "grant_type": "refresh_token"
    }).encode("utf-8")
    req = urllib.request.Request(token_url, data=data, method="POST")
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res["access_token"]

try:
    # Test current access token
    test_req = urllib.request.Request(
        "https://firestore.googleapis.com/v1/projects/portal-guru-jetis-36d41/databases/(default)/documents/teachers?pageSize=1",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    with urllib.request.urlopen(test_req) as resp:
        pass
except Exception:
    print("[*] Access token kedaluwarsa, melakukan refresh token...")
    access_token = refresh_access_token(refresh_token)
    print("[+] Refresh token berhasil!")

# 3. Target Projects
target_projects = [
    "portal-guru-jetis-36d41",
    "portal-iskakfatoni",
    "form-iskakfatoni"
]

print(f"\n========================================================")
print(f"🚀 MEMULAI SINKRONISASI 92 MASTER GURU KE CLOUD FIRESTORE")
print(f"========================================================\n")

for project_id in target_projects:
    print(f"\n📡 Memproses Proyek: [{project_id}]...")
    success_count = 0
    fail_count = 0

    for t in teachers:
        name = t.get("name", "")
        nip = t.get("nip", "-")
        cls = t.get("class", "-")
        role = t.get("role", "Guru Pengajar")
        order_index = t.get("orderIndex", 0)
        url = t.get("journalFormUrl", "")

        # Tentukan docId: NIP jika valid, atau nama yang disanitasi jika NIP '-'
        if nip and nip != "-":
            doc_id = nip
        else:
            import re
            doc_id = re.sub(r'[^a-zA-Z0-9]', '_', name)

        doc_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/teachers/{doc_id}"

        body_data = json.dumps({
            "fields": {
                "name": {"stringValue": name},
                "nama_guru": {"stringValue": name},
                "nip": {"stringValue": nip},
                "nip_guru": {"stringValue": nip},
                "class": {"stringValue": cls},
                "role": {"stringValue": role},
                "orderIndex": {"integerValue": int(order_index)},
                "journalFormUrl": {"stringValue": url},
                "is_active": {"booleanValue": True}
            }
        }).encode("utf-8")

        req = urllib.request.Request(
            doc_url,
            data=body_data,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            method="PATCH"
        )

        try:
            with urllib.request.urlopen(req) as resp:
                success_count += 1
        except Exception as e:
            fail_count += 1
            print(f"   [-] Gagal sync #{order_index} {name} ({doc_id}): {e}")

    print(f"   ✅ Selesai [{project_id}]: {success_count} Berhasil, {fail_count} Gagal")

print(f"\n========================================================")
print(f"🎉 SINKRONISASI SEMUA MASTER DATA KE FIRESTORE SELESAI!")
print(f"========================================================\n")
