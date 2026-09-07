/**
 * Attendance Modal Module
 * Menangani modal presensi siswa, status kehadiran, dan sinkronisasi ke URL Form Absensi
 */

export function getTodayAttendanceKey(cleanNip, className) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${mm}-${dd}`;
  return `portal_attend_${cleanNip}_${className}_${dateKey}`;
}

export function getTodaySavedAttendance(cleanNip, className, totalCount = 36) {
  const key = getTodayAttendanceKey(cleanNip, className);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.absentStudents)) {
        return parsed;
      }
    } catch (e) {}
  }
  return {
    absentStudents: [],
    jumlahHadir: totalCount,
    jumlahTidakHadir: 0,
    absensiKet: "Nihil",
    jurnalKet: "Nihil"
  };
}

export function saveTodayAttendance(cleanNip, className, attendObj) {
  const key = getTodayAttendanceKey(cleanNip, className);
  localStorage.setItem(key, JSON.stringify(attendObj));
}

export function getFilteredStudentsByClass(targetClass, studentList) {
  const list = (studentList && studentList.length > 0) ? studentList : [];
  const normalized = String(targetClass || '').replace(/\s+/g, ' ').toLowerCase();
  let filtered = list.filter(s => {
    const sClass = String(s.nama_kelas || '').replace(/\s+/g, ' ').toLowerCase();
    return sClass === normalized || sClass.includes(normalized) || normalized.includes(sClass);
  });
  return filtered.length > 0 ? filtered : list;
}
