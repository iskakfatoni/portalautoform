/**
 * UI Component Renderer Module
 * PORTAL:AutoForm - SMKN 1 Jetis Mojokerto
 */

import { sortAndNormalizeForms } from './schedule-resolver.js';
import { sortTeachersByMasterOrder } from './excel-service.js';

export function renderUserPortal(currentForms, activeTeacher, generateFormUrlForTeacher) {
  const container = document.getElementById('portal-forms-grid');
  const weekendBanner = document.getElementById('weekend-holiday-banner');
  if (!container) return;

  const now = new Date();
  const dayIndex = now.getDay();
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  if (weekendBanner) {
    if (isWeekend) {
      weekendBanner.classList.remove('hidden');
    } else {
      weekendBanner.classList.add('hidden');
    }
  }

  const normalized = sortAndNormalizeForms(currentForms);
  const activeForms = normalized.filter(f => f.isActive !== false);

  if (activeForms.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Belum ada formulir aktif yang tersedia.</p></div>`;
    return;
  }

  container.innerHTML = activeForms.map((form, idx) => {
    const generatedUrl = generateFormUrlForTeacher ? generateFormUrlForTeacher(form, activeTeacher) : '#';
    const formIcon = form.icon || "fa-solid fa-file-signature";
    const themeIndex = (idx % 5) + 1;

    // Gunakan onclick untuk intercept pengecekan sudah isi atau belum
    return `
      <a href="${generatedUrl}"
         class="form-direct-card card-theme-${themeIndex}"
         title="Buka ${form.name}"
         onclick="if(window.handleFormClick) { window.handleFormClick(event, '${form.id}', '${form.name}', '${generatedUrl}'); return false; }">
        <div class="form-card-left">
          <div class="form-card-icon-box">
            <i class="${formIcon}"></i>
          </div>
          <div class="form-card-title-box">
            <span class="form-card-number">${idx + 1}.</span>
            <span class="form-card-title">${form.name}</span>
          </div>
        </div>
        <div class="form-card-right-icon">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </div>
      </a>
    `;
  }).join('');
}

export function renderTeachersTable(currentTeachers, onEditTeacher, onDeleteTeacher, filterQuery = '') {
  const tbody = document.getElementById('teachers-table-body');
  if (!tbody) return;

  let sorted = sortTeachersByMasterOrder(currentTeachers);
  let filtered = sorted;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = sorted.filter(t => t.name.toLowerCase().includes(q) || (t.nip && t.nip.includes(q)));
  }

  tbody.innerHTML = filtered.map((t, idx) => {
    let journalStatusBadge = '<span class="pill-badge" style="background:rgba(150,150,150,0.15);color:var(--text-muted);font-size:0.75rem;">Default Base</span>';
    if (t.journalFormUrl) {
      if (t.journalFormUrl.includes('docs.google.com/forms/d/')) {
        journalStatusBadge = `<a href="${t.journalFormUrl}" target="_blank" rel="noopener noreferrer" class="pill-badge pill-auto" style="text-decoration:none;font-size:0.75rem;" title="${t.journalFormUrl}"><i class="fa-solid fa-circle-check"></i> URL Panjang</a>`;
      } else if (t.journalFormUrl.includes('forms.gle/')) {
        journalStatusBadge = `<span class="pill-badge" style="background:rgba(234,179,8,0.2);color:#eab308;font-size:0.75rem;" title="Shortlink forms.gle tidak mendukung autofill. Silakan edit dan ubah ke URL viewform!"><i class="fa-solid fa-triangle-exclamation"></i> forms.gle</span>`;
      } else {
        journalStatusBadge = `<span class="pill-badge pill-auto" style="font-size:0.75rem;">Kustom</span>`;
      }
    }

    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${t.name}</strong></td>
        <td class="font-mono">
          ${t.nip || '-'}
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
            <i class="fa-solid fa-key" style="font-size: 0.65rem;"></i> PIN: <strong style="color: var(--accent-primary);">${t.pin || '12345'}</strong>
          </div>
        </td>
        <td>${t.role || 'Guru'}${t.class && t.class !== '-' ? ` <span class="pill-badge pill-auto" style="margin-left: 4px; font-size: 0.75rem;">${t.class}</span>` : ''}</td>
        <td>${journalStatusBadge}</td>
        <td>
          <div class="action-btns-row">
            <button class="btn-icon-action btn-edit-teacher" data-name="${t.name}" title="Edit Data">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icon-action btn-del btn-del-teacher" data-name="${t.name}" title="Hapus Guru">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-edit-teacher').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      if (onEditTeacher) onEditTeacher(name);
    });
  });

  tbody.querySelectorAll('.btn-del-teacher').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      if (onDeleteTeacher) onDeleteTeacher(name);
    });
  });
}

export function renderFormsTable(currentForms, onEditForm, onDeleteForm) {
  const tbody = document.getElementById('forms-table-body');
  if (!tbody) return;

  tbody.innerHTML = currentForms.map((f) => `
    <tr>
      <td><strong>${f.name}</strong></td>
      <td>${f.category || 'Umum'}</td>
      <td class="font-mono">${f.entryGuru || '-'}</td>
      <td class="font-mono">${f.entryNip || '-'}</td>
      <td><span class="pill-badge pill-auto">${f.isActive !== false ? 'Aktif' : 'Non-Aktif'}</span></td>
      <td>
        <div class="action-btns-row">
          <button class="btn-icon-action btn-edit-form" data-id="${f.id}" title="Edit Form">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon-action btn-del btn-del-form" data-id="${f.id}" title="Hapus Form">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-edit-form').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (onEditForm) onEditForm(id);
    });
  });

  tbody.querySelectorAll('.btn-del-form').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (onDeleteForm) onDeleteForm(id);
    });
  });
}

export function renderScheduleTable(currentSchedules, onDeleteSchedule, filterQuery = '') {
  const tbody = document.getElementById('schedule-table-body');
  if (!tbody) return;

  const schedules = (currentSchedules && currentSchedules.length > 0) ? currentSchedules : [];
  let filtered = schedules;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = schedules.filter(s => 
      (s.hari && s.hari.toLowerCase().includes(q)) ||
      (s.kelas && s.kelas.toLowerCase().includes(q)) ||
      (s.mataPelajaran && s.mataPelajaran.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.nip && s.nip.includes(q))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Tidak ada jadwal mengajar yang cocok.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((s, idx) => {
    const timeRange = (s.jamMulai && s.jamSelesai) ? `${s.jamMulai} - ${s.jamSelesai}` : '-';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.hari || '-'}</strong></td>
        <td><span class="badge-class">${s.jamKe || '-'}</span></td>
        <td class="font-mono">${timeRange}</td>
        <td><strong>${s.kelas || '-'}</strong></td>
        <td>${s.mataPelajaran || '-'}</td>
        <td>${s.name || '-'}</td>
        <td class="font-mono">${s.nip || '-'}</td>
        <td>
          <div class="action-btns-row">
            <button class="btn-icon-action btn-del btn-del-schedule" data-index="${idx}" title="Hapus Jadwal">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-del-schedule').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (onDeleteSchedule) onDeleteSchedule(idx);
    });
  });
}
