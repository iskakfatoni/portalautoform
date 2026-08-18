import json
import urllib.request
from pathlib import Path
import sys

if len(sys.argv) < 6:
    print("Usage: python update_single_teacher.py <name> <nip> <class> <role> <orderIndex> <journalFormUrl>")
    exit(1)

teacher_name = sys.argv[1]
teacher_nip = sys.argv[2]
teacher_class = sys.argv[3]
teacher_role = sys.argv[4]
teacher_order = int(sys.argv[5])
new_url = sys.argv[6]

tools_cfg_path = Path.home() / ".config" / "configstore" / "firebase-tools.json"
with open(tools_cfg_path, "r", encoding="utf-8") as f:
    cfg = json.load(f)

access_token = cfg["tokens"]["access_token"]

body_data = json.dumps({
    "fields": {
        "name": {"stringValue": teacher_name},
        "nama_guru": {"stringValue": teacher_name},
        "nip": {"stringValue": teacher_nip},
        "nip_guru": {"stringValue": teacher_nip},
        "class": {"stringValue": teacher_class},
        "role": {"stringValue": teacher_role},
        "orderIndex": {"integerValue": teacher_order},
        "journalFormUrl": {"stringValue": new_url},
        "is_active": {"booleanValue": True}
    }
}).encode("utf-8")

target_projects = ["portal-guru-jetis-36d41", "portal-iskakfatoni", "form-iskakfatoni"]

for project_id in target_projects:
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/teachers/{teacher_nip}"
    req = urllib.request.Request(
        url,
        data=body_data,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[+] Project [{project_id}]: Berhasil update {teacher_name}!")
    except Exception as e:
        print(f"[-] Project [{project_id}] Error: {e}")
