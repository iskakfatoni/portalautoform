/**
 * Excel & Data Import/Export Service Module
 * PORTAL:AutoForm - SMKN 1 Jetis Mojokerto
 */

import { normalizeDayName, formatTimeString } from './formatters.js';
import { doc, setDoc, writeBatch } from '../firebase-config.js';

export function sortTeachersByMasterOrder(teachers) {
  return [...teachers].sort((a, b) => {
    const orderA = (a.orderIndex !== undefined && a.orderIndex !== null) ? a.orderIndex : 999;
    const orderB = (b.orderIndex !== undefined && b.orderIndex !== null) ? b.orderIndex : 999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
  });
}

export function getPersonalPortalUrl(teacher) {
  const base = window.location.origin + window.location.pathname;
  if (teacher.nip && teacher.nip !== '-') {
    return `${base}?nip=${encodeURIComponent(teacher.nip.replace(/[\s\.\-]+/g, ''))}`;
  }
  return `${base}?nip=${encodeURIComponent(teacher.name)}`;
}

export function exportTeachersToExcel(currentTeachers, currentForms, showToast, generateFormUrlForTeacher) {
  const xlsxLib = window.XLSX;
  if (!xlsxLib) {
    showToast("Library Excel sedang dimuat, silakan coba 1 detik lagi.");
    return;
  }

  const defaultForm = currentForms[0] || null;
  const sortedTeachers = sortTeachersByMasterOrder(currentTeachers);

  try {
    const excelData = sortedTeachers.map((t, idx) => ({
      "No": idx + 1,
      "Nama Guru": t.name,
      "NIP": t.nip || "-",
      "Peran": t.role || "Guru",
      "URL Jurnal Pribadi": t.journalFormUrl || "",
      "Link Portal Guru": getPersonalPortalUrl(t),
      "Link Form Walikelas": defaultForm && generateFormUrlForTeacher ? generateFormUrlForTeacher(defaultForm, t) : ""
    }));

    const worksheet = xlsxLib.utils.json_to_sheet(excelData);
    
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 36 },
      { wch: 22 },
      { wch: 16 },
      { wch: 45 },
      { wch: 55 },
      { wch: 55 }
    ];

    const workbook = xlsxLib.utils.book_new();
    xlsxLib.utils.book_append_sheet(workbook, worksheet, "Data Guru & Link");
    
    xlsxLib.writeFile(workbook, "data_link_guru_portal_autoform.xlsx");
    showToast("File Excel (.xlsx) berhasil diunduh dengan urutan database!");
  } catch (err) {
    console.error("Gagal export Excel .xlsx:", err);
    showToast("Gagal export Excel: " + err.message);
  }
}

export function exportTeachersToJSON(currentTeachers, showToast) {
  const exportData = {
    generatedAt: new Date().toISOString(),
    totalTeachers: currentTeachers.length,
    teachers: currentTeachers.map(t => ({
      ...t,
      personalPortalUrl: getPersonalPortalUrl(t)
    }))
  };
  const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  downloadBlob(jsonBlob, "data_guru_portal_autoform.json");
  showToast("File JSON berhasil diunduh!");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

export async function processImportedScheduleRows(rows, getDb, showToast, onSchedulesUpdated) {
  if (!rows || rows.length <= 1) {
    showToast("❌ File jadwal kosong atau tidak memiliki baris data.");
    return;
  }

  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rowStr = (rows[i] || []).map(c => String(c || '').toLowerCase()).join(' ');
    if (rowStr.includes('hari') || rowStr.includes('kelas') || rowStr.includes('mapel') || rowStr.includes('jam')) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = (rows[headerRowIdx] || []).map(h => String(h || '').trim().toLowerCase());
  
  let nipIdx = headerRow.findIndex(h => h.includes("nip"));
  let nameIdx = headerRow.findIndex(h => h.includes("nama") || h.includes("guru"));
  let hariIdx = headerRow.findIndex(h => h.includes("hari"));
  let jamKeIdx = headerRow.findIndex(h => h.includes("jam_ke") || h.includes("jam ke") || h.includes("sesi"));
  let jamMulaiIdx = headerRow.findIndex(h => h.includes("jam_mulai") || h.includes("jam mulai") || h.includes("mulai"));
  let jamSelesaiIdx = headerRow.findIndex(h => h.includes("jam_selesai") || h.includes("jam selesai") || h.includes("selesai"));
  let kelasIdx = headerRow.findIndex(h => h.includes("kelas"));
  let mapelIdx = headerRow.findIndex(h => h.includes("mapel") || h.includes("pelajaran"));
  let ketIdx = headerRow.findIndex(h => h.includes("ket") || h.includes("ruang"));

  if (nipIdx === -1) nipIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (hariIdx === -1) hariIdx = 2;
  if (jamKeIdx === -1) jamKeIdx = 3;
  if (jamMulaiIdx === -1) jamMulaiIdx = 4;
  if (jamSelesaiIdx === -1) jamSelesaiIdx = 5;
  if (kelasIdx === -1) kelasIdx = 6;
  if (mapelIdx === -1) mapelIdx = 7;
  if (ketIdx === -1) ketIdx = 8;

  const newSchedules = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const nip = String(r[nipIdx] || '').trim();
    const name = String(r[nameIdx] || '').trim();
    const rawHari = String(r[hariIdx] || '').trim();
    const hari = normalizeDayName(rawHari) || rawHari;
    const jamKe = String(r[jamKeIdx] || '').trim();
    const jamMulai = formatTimeString(r[jamMulaiIdx] || '');
    const jamSelesai = formatTimeString(r[jamSelesaiIdx] || '');
    const kelas = String(r[kelasIdx] || '').trim();
    const mataPelajaran = String(r[mapelIdx] || '').trim();
    const keterangan = String(r[ketIdx] || '').trim();

    if (!hari && !kelas && !name) continue;

    newSchedules.push({
      nip,
      name,
      hari,
      jamKe,
      jamMulai,
      jamSelesai,
      kelas,
      mataPelajaran,
      keterangan
    });
  }

  if (newSchedules.length > 0) {
    if (onSchedulesUpdated) onSchedulesUpdated(newSchedules);

    const activeDb = getDb();
    if (activeDb) {
      try {
        const batch = writeBatch(activeDb);
        newSchedules.forEach((s) => {
          const cleanNip = (s.nip || '').trim().replace(/[\s\.\-]+/g, '') || 'nonip';
          const cleanName = (s.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
          const cleanHari = (s.hari || '').trim().toLowerCase();
          const cleanJam = (s.jamKe || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
          const cleanKelas = (s.kelas || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
          const docId = `sch_${cleanNip}_${cleanName}_${cleanHari}_${cleanJam}_${cleanKelas}`.substring(0, 100);
          batch.set(doc(activeDb, "schedules", docId), s);
        });
        await batch.commit();
        console.log("🔥 Berhasil mengunggah", newSchedules.length, "jadwal ke Cloud Firestore!");
        showToast(`✅ Berhasil mengimpor & sinkron ${newSchedules.length} jadwal ke Cloud Firestore!`);
      } catch (e) {
        console.error("Gagal sync jadwal ke Firestore:", e);
        showToast(`✅ Berhasil mengimpor ${newSchedules.length} data jadwal ke memori! (Cloud sync error: ${e.message})`);
      }
    } else {
      showToast(`✅ Berhasil mengimpor ${newSchedules.length} data jadwal mengajar!`);
    }
  } else {
    showToast("⚠️ Tidak ada data jadwal valid yang terbaca dari file.");
  }
}

export async function processImportedExcelRows(rows, currentTeachers, getDb, isFirebaseActive, showToast, onTeachersUpdated, statusDiv) {
  if (!rows || rows.length <= 1) {
    if (statusDiv) statusDiv.textContent = "❌ File Excel kosong atau tidak memiliki baris data.";
    return;
  }

  const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
  
  let nameIdx = headerRow.findIndex(h => h.includes("nama"));
  let nipIdx = headerRow.findIndex(h => h.includes("nip"));
  let classIdx = headerRow.findIndex(h => h.includes("kelas"));
  let roleIdx = headerRow.findIndex(h => h.includes("peran") || h.includes("role"));
  let journalIdx = headerRow.findIndex(h => h.includes("jurnal") || h.includes("journal"));

  if (nameIdx === -1) nameIdx = 1;
  if (nipIdx === -1) nipIdx = 2;
  if (classIdx === -1) classIdx = 3;
  if (roleIdx === -1) roleIdx = 4;
  if (journalIdx === -1) journalIdx = 5;

  const importedList = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = String(row[nameIdx] || '').trim();
    if (!name) continue;

    const nip = String(row[nipIdx] || '-').trim();
    const cls = String(row[classIdx] || '-').trim();
    const role = String(row[roleIdx] || 'Walikelas').trim();
    const journalFormUrl = String(row[journalIdx] || '').trim();

    importedList.push({
      name,
      nip: nip || '-',
      class: cls || '-',
      role: role || 'Walikelas',
      journalFormUrl: journalFormUrl || ''
    });
  }

  if (importedList.length === 0) {
    if (statusDiv) statusDiv.textContent = "❌ Tidak ada data guru valid yang ditemukan di file Excel.";
    return;
  }

  const updatedTeachers = [...currentTeachers];
  importedList.forEach(imported => {
    const idx = updatedTeachers.findIndex(t => t.name.toLowerCase() === imported.name.toLowerCase());
    if (idx >= 0) {
      updatedTeachers[idx] = { ...updatedTeachers[idx], ...imported };
    } else {
      updatedTeachers.push(imported);
    }
  });

  if (onTeachersUpdated) onTeachersUpdated(updatedTeachers);

  const activeDb = getDb();
  if (activeDb && isFirebaseActive) {
    try {
      const batch = writeBatch(activeDb);
      importedList.forEach(t => {
        const docId = t.nip && t.nip !== '-' ? t.nip : t.name.replace(/[^a-zA-Z0-9]/g, '_');
        batch.set(doc(activeDb, "teachers", docId), t);
      });
      await batch.commit();
      if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--success);">✅ Berhasil mengimpor <strong>${importedList.length} guru</strong> ke Cloud Firestore!</span>`;
    } catch (e) {
      if (statusDiv) statusDiv.textContent = `Disimpan lokal (Gagal sync cloud: ${e.message})`;
    }
  } else {
    if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--success);">✅ Berhasil mengimpor <strong>${importedList.length} guru</strong> ke penyimpanan browser!</span>`;
  }

  showToast(`Impor ${importedList.length} data guru dari Excel berhasil!`);
}
