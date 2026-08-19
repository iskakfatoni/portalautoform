/**
 * Firestore Service Module (Pure Cloud Engine)
 * PORTAL:AutoForm - SMKN 1 Jetis Mojokerto
 * Menyediakan integrasi Firebase SDK v10 dengan Instant REST API Fallback
 */

import {
  getDb,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  DEFAULT_FIREBASE_CONFIG
} from '../firebase-config.js';

import { formatTimeString } from './formatters.js';

// Parser dokumen REST Firestore menjadi objek JavaScript
export function parseFirestoreDoc(docObj) {
  const fields = docObj.fields || {};
  const result = { id: docObj.name ? docObj.name.split('/').pop() : '' };

  for (const [key, val] of Object.entries(fields)) {
    if ('stringValue' in val) result[key] = val.stringValue;
    else if ('integerValue' in val) result[key] = parseInt(val.integerValue, 10);
    else if ('doubleValue' in val) result[key] = parseFloat(val.doubleValue);
    else if ('booleanValue' in val) result[key] = val.booleanValue;
    else if ('nullValue' in val) result[key] = null;
    else if ('arrayValue' in val) {
      result[key] = (val.arrayValue.values || []).map(v => Object.values(v)[0]);
    } else if ('mapValue' in val) {
      result[key] = val.mapValue.fields || {};
    }
  }
  return result;
}

// Fetch Generic Collection dengan Multi-Layer (SDK + REST API)
export async function fetchCollection(collectionName) {
  // 1. Coba via Firebase JS SDK
  const activeDb = getDb();
  if (activeDb) {
    try {
      const snap = await getDocs(collection(activeDb, collectionName));
      if (!snap.empty) {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        return list;
      }
    } catch (sdkErr) {
      console.warn(`[Firestore SDK] Koleksi '${collectionName}' dialihkan ke REST API:`, sdkErr.message);
    }
  }

  // 2. Instant Fail-Safe via Firestore REST API
  try {
    const { projectId, apiKey } = DEFAULT_FIREBASE_CONFIG;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=100&key=${apiKey}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const docs = data.documents || [];
      return docs.map(parseFirestoreDoc);
    }
  } catch (restErr) {
    console.error(`[Firestore REST] Gagal memuat koleksi '${collectionName}':`, restErr);
  }

  return [];
}

// 1. Fetch Teachers (Master Guru Cloud Firestore)
export async function fetchTeachers() {
  const list = await fetchCollection('teachers');
  const normalizedList = list.map(t => {
    const pin = (t.pin && String(t.pin).trim() !== '') ? String(t.pin).trim() : '12345';
    if (t.nip === "198109092022211004" || (t.name && t.name.includes("ISKAK FATONI"))) {
      return {
        ...t,
        class: (t.class && t.class !== "XII TEI 2") ? t.class : "XI TEI 2",
        guruWaliClass: t.guruWaliClass || "XI TEI 1",
        role: t.role || "Walikelas",
        pin: pin
      };
    }
    return {
      ...t,
      pin: pin
    };
  });

  return normalizedList.sort((a, b) => {
    const orderA = (a.orderIndex !== undefined && a.orderIndex !== null) ? a.orderIndex : 999;
    const orderB = (b.orderIndex !== undefined && b.orderIndex !== null) ? b.orderIndex : 999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
  });
}

// 2. Fetch Forms (Master Formulir Cloud Firestore)
export async function fetchForms() {
  const list = await fetchCollection('forms');
  return list.sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
}

// 3. Fetch Schedules (Jadwal Mengajar Cloud Firestore)
export async function fetchSchedules() {
  const list = await fetchCollection('schedules');
  return list.map(item => ({
    ...item,
    jamMulai: formatTimeString(item.jamMulai),
    jamSelesai: formatTimeString(item.jamSelesai)
  }));
}

// 4. Save Teacher ke Firestore
export async function saveTeacherToFirestore(teacherData) {
  const activeDb = getDb();
  if (!activeDb) return false;
  const docId = teacherData.nip && teacherData.nip !== '-' ? teacherData.nip : teacherData.name.replace(/[^a-zA-Z0-9]/g, '_');
  const payload = {
    ...teacherData,
    pin: (teacherData.pin && String(teacherData.pin).trim() !== '') ? String(teacherData.pin).trim() : '12345'
  };
  await setDoc(doc(activeDb, "teachers", docId), payload, { merge: true });
  return true;
}

// 4b. Update PIN Guru ke Firestore (Mandiri oleh Guru atau Reset oleh Admin)
export async function updateTeacherPin(nipOrDocId, newPin) {
  const cleanPin = String(newPin).trim();
  const cleanDocId = String(nipOrDocId).trim().replace(/[\s\.\-]+/g, '');
  const activeDb = getDb();
  
  if (activeDb) {
    try {
      await setDoc(doc(activeDb, "teachers", cleanDocId), { 
        pin: cleanPin,
        pinUpdatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ [Firestore SDK] PIN guru (${cleanDocId}) berhasil diperbarui!`);
      return true;
    } catch (sdkErr) {
      console.warn(`[Firestore SDK] Update PIN dialihkan ke REST API:`, sdkErr.message);
    }
  }

  // REST API Fallback
  try {
    const { projectId, apiKey } = DEFAULT_FIREBASE_CONFIG;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/teachers/${cleanDocId}?updateMask.fieldPaths=pin&updateMask.fieldPaths=pinUpdatedAt&key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          pin: { stringValue: cleanPin },
          pinUpdatedAt: { stringValue: new Date().toISOString() }
        }
      })
    });
    if (resp.ok) {
      console.log(`✅ [Firestore REST] PIN guru (${cleanDocId}) berhasil diperbarui!`);
      return true;
    } else {
      console.error(`[Firestore REST] Gagal update PIN guru: ${resp.statusText}`);
    }
  } catch (restErr) {
    console.error(`[Firestore REST] Gagal update PIN:`, restErr);
  }

  return false;
}

// 5. Delete Teacher dari Firestore
export async function deleteTeacherFromFirestore(docId) {
  const activeDb = getDb();
  if (!activeDb) return false;
  await deleteDoc(doc(activeDb, "teachers", docId));
  return true;
}

// 6. Save Form ke Firestore
export async function saveFormToFirestore(formData) {
  const activeDb = getDb();
  if (!activeDb) return false;
  await setDoc(doc(activeDb, "forms", formData.id), formData, { merge: true });
  return true;
}

// 7. Delete Form dari Firestore
export async function deleteFormFromFirestore(formId) {
  const activeDb = getDb();
  if (!activeDb) return false;
  await deleteDoc(doc(activeDb, "forms", formId));
  return true;
}

// 8. Simpan Riwayat Pengisian Form ke Firestore
export async function saveFormSubmission(nip, formId, formName) {
  const activeDb = getDb();
  if (!activeDb) return false;

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${mm}-${dd}`;

  // ID Dokumen unik per hari per guru per form
  const docId = `sub_${nip}_${formId}_${dateKey}`;

  const submissionData = {
    nip,
    formId,
    formName,
    timestamp: now.toISOString(),
    date: dateKey,
    status: 'completed'
  };

  await setDoc(doc(activeDb, "submissions", docId), submissionData, { merge: true });
  console.log(`✅ [Firestore] Riwayat pengisian disimpan: ${docId}`);
  return true;
}

// 9. Cek apakah Form sudah diisi hari ini
export async function checkFormSubmission(nip, formId) {
  const activeDb = getDb();
  if (!activeDb) return null;

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${mm}-${dd}`;

  const docId = `sub_${nip}_${formId}_${dateKey}`;

  // Fail-safe via REST API jika SDK gagal
  try {
    const snap = await getDocs(collection(activeDb, "submissions"));
    // Sederhananya kita cari yang cocok dengan docId
    const found = snap.docs.find(d => d.id === docId);
    if (found) return found.data();
  } catch (e) {
    // REST API Fallback
    const { projectId, apiKey } = DEFAULT_FIREBASE_CONFIG;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/submissions/${docId}?key=${apiKey}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      return parseFirestoreDoc(data);
    }
  }

  return null;
}
