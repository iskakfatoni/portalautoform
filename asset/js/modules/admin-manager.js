/**
 * Admin Modal Helpers Module
 * PORTAL:AutoForm - SMKN 1 Jetis Mojokerto
 * Menangani pembukaan dan inisialisasi modal Form Guru dan Formulir Administrasi
 */

export function openTeacherModalHelper(teacher = null) {
  const modal = document.getElementById('modal-teacher-form');
  const title = document.getElementById('modal-teacher-title');
  const nameInp = document.getElementById('edit-teacher-name');
  const nipInp = document.getElementById('edit-teacher-nip');
  const roleInp = document.getElementById('edit-teacher-role');
  const classInp = document.getElementById('edit-teacher-class');
  const guruWaliClassInp = document.getElementById('edit-teacher-guru-wali-class');
  const journalInp = document.getElementById('edit-teacher-journal-url');
  const pinInp = document.getElementById('edit-teacher-pin');

  if (!modal) return;

  if (teacher) {
    if (title) title.innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Data Guru`;
    if (nameInp) {
      nameInp.value = teacher.name || '';
      nameInp.readOnly = true;
    }
    if (nipInp) nipInp.value = teacher.nip && teacher.nip !== '-' ? teacher.nip : '';
    if (roleInp) roleInp.value = teacher.role || 'Walikelas';
    if (classInp) classInp.value = teacher.class || '-';
    if (guruWaliClassInp) guruWaliClassInp.value = teacher.guruWaliClass || '-';
    if (journalInp) journalInp.value = teacher.journalFormUrl || '';
    if (pinInp) pinInp.value = teacher.pin || '12345';
  } else {
    if (title) title.innerHTML = `<i class="fa-solid fa-user-plus"></i> Tambah Data Guru`;
    if (nameInp) {
      nameInp.value = '';
      nameInp.readOnly = false;
    }
    if (nipInp) nipInp.value = '';
    if (roleInp) roleInp.value = 'Walikelas';
    if (classInp) classInp.value = '-';
    if (guruWaliClassInp) guruWaliClassInp.value = '-';
    if (journalInp) journalInp.value = '';
    if (pinInp) pinInp.value = '12345';
  }
  modal.classList.remove('hidden');
}

export function openFormModalHelper(form = null) {
  const modal = document.getElementById('modal-form-manage');
  const title = document.getElementById('modal-form-title');
  const idInp = document.getElementById('edit-form-id');
  const nameInp = document.getElementById('edit-form-name');
  const catInp = document.getElementById('edit-form-category');
  const urlInp = document.getElementById('edit-form-url');
  const descInp = document.getElementById('edit-form-desc');
  const guruInp = document.getElementById('edit-entry-guru');
  const nipInp = document.getElementById('edit-entry-nip');

  if (!modal) return;

  if (form) {
    if (title) title.innerHTML = `<i class="fa-solid fa-file-pen"></i> Edit Formulir`;
    if (idInp) idInp.value = form.id || '';
    if (nameInp) nameInp.value = form.name || '';
    if (catInp) catInp.value = form.category || '';
    if (urlInp) urlInp.value = form.baseUrl || '';
    if (descInp) descInp.value = form.description || '';
    if (guruInp) guruInp.value = form.entryGuru || '';
    if (nipInp) nipInp.value = form.entryNip || '';
  } else {
    if (title) title.innerHTML = `<i class="fa-solid fa-file-circle-plus"></i> Tambah Formulir Baru`;
    if (idInp) idInp.value = '';
    if (nameInp) nameInp.value = '';
    if (catInp) catInp.value = 'Walikelas';
    if (urlInp) urlInp.value = '';
    if (descInp) descInp.value = '';
    if (guruInp) guruInp.value = 'entry.1599393498';
    if (nipInp) nipInp.value = 'entry.65154558';
  }
  modal.classList.remove('hidden');
}
