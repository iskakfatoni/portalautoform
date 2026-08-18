import json
import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Target Project: FORM-AutoForm
PROJECT_ID = "form-autoform"
API_KEY = "AIzaSyBJUu8_4G_WK30h4W61XunUFvu7uutBibo"

def get_teachers():
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/teachers?pageSize=100&key={API_KEY}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        docs = data.get('documents', [])
        list_t = []
        for d in docs:
            f = d.get('fields', {})
            list_t.append({
                "name": f.get('name', {}).get('stringValue') or f.get('nama_guru', {}).get('stringValue') or '',
                "nip": f.get('nip', {}).get('stringValue') or f.get('nip_guru', {}).get('stringValue') or '-',
                "class": f.get('class', {}).get('stringValue') or '-',
                "role": f.get('role', {}).get('stringValue') or 'Guru Pengajar',
                "orderIndex": int(f.get('orderIndex', {}).get('integerValue') or 999),
                "journalFormUrl": f.get('journalFormUrl', {}).get('stringValue') or ''
            })
        list_t.sort(key=lambda x: x.get('orderIndex', 999))
        return list_t

teachers = get_teachers()
print(f"[+] Memuat {len(teachers)} Master Guru murni dari Cloud Firestore ({PROJECT_ID})")

failed_teachers = [t for t in teachers if t.get('journalFormUrl') and 'forms.gle' in t.get('journalFormUrl')]
valid_teachers = [t for t in teachers if t.get('journalFormUrl') and 'docs.google.com/forms' in t.get('journalFormUrl')]

print(f"\n📊 Ringkasan Status Database Firestore:")
print(f"   - Total Guru di Firestore: {len(teachers)} Guru")
print(f"   - Guru Link Valid: {len(valid_teachers)} Guru (100% Long URL)")
print(f"   - Guru Perlu Update Link: {len(failed_teachers)} Guru")
