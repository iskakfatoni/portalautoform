const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const initialDataPath = path.join(__dirname, 'asset', 'js', 'modules', 'initial-data.js');
let teachers = [];

if (fs.existsSync(initialDataPath)) {
  const content = fs.readFileSync(initialDataPath, 'utf-8');
  const startMarker = 'export const INITIAL_TEACHERS = ';
  const startIndex = content.indexOf(startMarker);
  if (startIndex !== -1) {
    const jsonStart = content.indexOf('[', startIndex);
    const jsonEnd = content.indexOf('];', jsonStart);
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        teachers = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
      } catch (e) {
        teachers = [];
      }
    }
  }
}

// 1. Data Sheet 1: 54 Guru yang Perlu Update Link (Shortlink Tidak Aktif)
const failedTeachers = teachers
  .filter(t => t.journalFormUrl && t.journalFormUrl.includes('forms.gle'))
  .map((t, idx) => ({
    "No": idx + 1,
    "Nama Guru": t.name,
    "NIP": t.nip || "-",
    "Kelas Binaan": t.class || "-",
    "Peran": t.role || "Guru",
    "Shortlink Lama": t.journalFormUrl,
    "Status": "⚠️ Perlu Update URL Panjang",
    "Link Baru (docs.google.com/forms/d/e/.../viewform)": ""
  }));

// 2. Data Sheet 2: 38 Guru yang Link Panjang Valid
const validTeachers = teachers
  .filter(t => t.journalFormUrl && t.journalFormUrl.includes('docs.google.com/forms'))
  .map((t, idx) => ({
    "No": idx + 1,
    "Nama Guru": t.name,
    "NIP": t.nip || "-",
    "Kelas Binaan": t.class || "-",
    "Peran": t.role || "Guru",
    "URL Panjang Valid (Google Form)": t.journalFormUrl,
    "Status": "✅ Valid & Siap Autofill"
  }));

// 3. Data Sheet 3: Master Seluruh 92 Guru
const allTeachers = teachers.map((t, idx) => {
  const isValidLong = t.journalFormUrl && t.journalFormUrl.includes('docs.google.com/forms');
  return {
    "No": idx + 1,
    "Nama Guru": t.name,
    "NIP": t.nip || "-",
    "Kelas Binaan": t.class || "-",
    "Peran": t.role || "Guru",
    "URL Google Form": t.journalFormUrl || "-",
    "Format Link": isValidLong ? "Long URL (Canonical)" : "Shortlink (forms.gle)",
    "Status Autofill": isValidLong ? "✅ Langsung Siap Autofill" : "🟡 Menggunakan Fallback Form Induk"
  };
});

// Buat Workbook Excel
const workbook = XLSX.utils.book_new();

// Sheet 1: 54 Guru Perlu Update
const ws1 = XLSX.utils.json_to_sheet(failedTeachers);
ws1['!cols'] = [
  { wch: 6 },   // No
  { wch: 38 },  // Nama Guru
  { wch: 24 },  // NIP
  { wch: 16 },  // Kelas Binaan
  { wch: 16 },  // Peran
  { wch: 45 },  // Shortlink Lama
  { wch: 30 },  // Status
  { wch: 70 }   // Link Baru
];
XLSX.utils.book_append_sheet(workbook, ws1, "54 Guru Perlu Update");

// Sheet 2: 38 Guru Valid
const ws2 = XLSX.utils.json_to_sheet(validTeachers);
ws2['!cols'] = [
  { wch: 6 },   // No
  { wch: 38 },  // Nama Guru
  { wch: 24 },  // NIP
  { wch: 16 },  // Kelas Binaan
  { wch: 16 },  // Peran
  { wch: 75 },  // URL Panjang Valid
  { wch: 25 }   // Status
];
XLSX.utils.book_append_sheet(workbook, ws2, "38 Guru Link Valid");

// Sheet 3: Master 92 Guru
const ws3 = XLSX.utils.json_to_sheet(allTeachers);
ws3['!cols'] = [
  { wch: 6 },   // No
  { wch: 38 },  // Nama Guru
  { wch: 24 },  // NIP
  { wch: 16 },  // Kelas Binaan
  { wch: 16 },  // Peran
  { wch: 75 },  // URL Form
  { wch: 25 },  // Format Link
  { wch: 35 }   // Status Autofill
];
XLSX.utils.book_append_sheet(workbook, ws3, "Master 92 Guru Lengkap");

// Simpan file Excel
const exportFileName = 'daftar_guru_status_link_google_form.xlsx';
const exportPath = path.join(__dirname, exportFileName);
XLSX.writeFile(workbook, exportPath);

console.log(`\n🎉 Berhasil membuat file Excel!`);
console.log(`📁 Lokasi file: ${exportPath}`);
console.log(`📊 Ringkasan:`);
console.log(`   - Sheet 1: 54 Guru Perlu Update Link`);
console.log(`   - Sheet 2: 38 Guru Link Valid`);
console.log(`   - Sheet 3: Master 92 Guru Lengkap`);
