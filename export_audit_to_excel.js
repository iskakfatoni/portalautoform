import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Ambil access token dari configstore
const cfgPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
let accessToken = '';

if (fs.existsSync(cfgPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    accessToken = cfg.tokens?.access_token || '';
  } catch (e) {
    console.warn('Gagal membaca token Firebase:', e.message);
  }
}

const projectId = 'portal-guru-jetis-36d41';

function fetchFirestoreTeachers() {
  return new Promise((resolve, reject) => {
    if (!accessToken) {
      return resolve([]);
    }

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${projectId}/databases/(default)/documents/teachers?pageSize=100`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const docs = parsed.documents || [];
          const list = docs.map(d => {
            const f = d.fields || {};
            return {
              name: f.name?.stringValue || f.nama_guru?.stringValue || '',
              nip: f.nip?.stringValue || f.nip_guru?.stringValue || '-',
              class: f.class?.stringValue || '-',
              role: f.role?.stringValue || 'Guru Pengajar',
              orderIndex: parseInt(f.orderIndex?.integerValue || '999'),
              journalFormUrl: f.journalFormUrl?.stringValue || ''
            };
          });
          list.sort((a, b) => (a.orderIndex || 999) - (b.orderIndex || 999));
          resolve(list);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  let teachers = [];
  try {
    teachers = await fetchFirestoreTeachers();
    console.log(`[+] Berhasil mengambil ${teachers.length} guru dari Cloud Firestore (${projectId})`);
  } catch (e) {
    console.warn('[-] Gagal mengambil dari Firestore API, menggunakan fallback:', e.message);
  }

  // 1. Data Sheet 1: Guru yang Perlu Update Link (Shortlink forms.gle)
  const failedTeachers = teachers
    .filter(t => t.journalFormUrl && t.journalFormUrl.includes('forms.gle'))
    .map((t, idx) => ({
      "No": idx + 1,
      "Order": t.orderIndex || idx + 1,
      "Nama Guru": t.name,
      "NIP": t.nip || "-",
      "Kelas Binaan": t.class || "-",
      "Peran": t.role || "Guru Pengajar",
      "Shortlink Lama": t.journalFormUrl,
      "Status": "⚠️ Perlu Update URL Panjang",
      "Link Baru (docs.google.com/forms/d/e/.../viewform)": ""
    }));

  // 2. Data Sheet 2: Guru yang Link Panjang Valid
  const validTeachers = teachers
    .filter(t => t.journalFormUrl && t.journalFormUrl.includes('docs.google.com/forms'))
    .map((t, idx) => ({
      "No": idx + 1,
      "Order": t.orderIndex || idx + 1,
      "Nama Guru": t.name,
      "NIP": t.nip || "-",
      "Kelas Binaan": t.class || "-",
      "Peran": t.role || "Guru Pengajar",
      "URL Panjang Valid (Google Form)": t.journalFormUrl,
      "Status": "✅ Valid & Siap Autofill"
    }));

  // 3. Data Sheet 3: Master Seluruh Guru
  const allTeachers = teachers.map((t, idx) => {
    const isValidLong = t.journalFormUrl && t.journalFormUrl.includes('docs.google.com/forms');
    return {
      "No": idx + 1,
      "Order": t.orderIndex || idx + 1,
      "Nama Guru": t.name,
      "NIP": t.nip || "-",
      "Kelas Binaan": t.class || "-",
      "Peran": t.role || "Guru Pengajar",
      "URL Google Form": t.journalFormUrl || "-",
      "Format Link": isValidLong ? "Long URL (Canonical)" : "Shortlink (forms.gle)",
      "Status Autofill": isValidLong ? "✅ Langsung Siap Autofill" : "🟡 Menggunakan Fallback Form Induk"
    };
  });

  // Buat Workbook Excel
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Guru Perlu Update
  const ws1 = XLSX.utils.json_to_sheet(failedTeachers.length > 0 ? failedTeachers : [{ "Status": "Semua guru telah valid 100%!" }]);
  ws1['!cols'] = [
    { wch: 6 },   // No
    { wch: 8 },   // Order
    { wch: 38 },  // Nama Guru
    { wch: 24 },  // NIP
    { wch: 16 },  // Kelas Binaan
    { wch: 16 },  // Peran
    { wch: 45 },  // Shortlink Lama
    { wch: 30 },  // Status
    { wch: 70 }   // Link Baru
  ];
  XLSX.utils.book_append_sheet(workbook, ws1, `${failedTeachers.length} Guru Perlu Update`);

  // Sheet 2: Guru Valid
  const ws2 = XLSX.utils.json_to_sheet(validTeachers);
  ws2['!cols'] = [
    { wch: 6 },   // No
    { wch: 8 },   // Order
    { wch: 38 },  // Nama Guru
    { wch: 24 },  // NIP
    { wch: 16 },  // Kelas Binaan
    { wch: 16 },  // Peran
    { wch: 75 },  // URL Panjang Valid
    { wch: 25 }   // Status
  ];
  XLSX.utils.book_append_sheet(workbook, ws2, `${validTeachers.length} Guru Link Valid`);

  // Sheet 3: Master Seluruh Guru
  const ws3 = XLSX.utils.json_to_sheet(allTeachers);
  ws3['!cols'] = [
    { wch: 6 },   // No
    { wch: 8 },   // Order
    { wch: 38 },  // Nama Guru
    { wch: 24 },  // NIP
    { wch: 16 },  // Kelas Binaan
    { wch: 16 },  // Peran
    { wch: 75 },  // URL Form
    { wch: 25 },  // Format Link
    { wch: 35 }   // Status Autofill
  ];
  XLSX.utils.book_append_sheet(workbook, ws3, `Master ${allTeachers.length} Guru Lengkap`);

  // Simpan file Excel
  const exportFileName = 'daftar_guru_status_link_google_form.xlsx';
  const exportPath = path.join(__dirname, exportFileName);
  XLSX.writeFile(workbook, exportPath);

  console.log(`\n🎉 Berhasil membuat file Excel dari Cloud Firestore!`);
  console.log(`📁 Lokasi file: ${exportPath}`);
  console.log(`📊 Ringkasan:`);
  console.log(`   - Sheet 1: ${failedTeachers.length} Guru Perlu Update Link`);
  console.log(`   - Sheet 2: ${validTeachers.length} Guru Link Valid`);
  console.log(`   - Sheet 3: Master ${allTeachers.length} Guru Lengkap`);
}

main();
