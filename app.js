/**
 * PORTAL:AutoForm - Core Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  initThemeToggle();
  initTabNavigation();
  initClipboardHandlers();
  initFormBuilder();
});

// Base Form Constants
const BASE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform";
const ENTRY_GURU = "entry.1599393498";
const ENTRY_NIP = "entry.65154558";
const ENTRY_KELAS = "entry.591543822";

// Data Guru dari Form Asli
const DAFTAR_GURU = [
  "HERMAWANTO, S.Pd., M.Psi",
  "NURUL HIDAYATI, S.Pd., M.Psi",
  "Drs. MOEHAIMIN",
  "DHURROTUL FARIDAH, S.Pd",
  "SRI WINARTI, S.Pd",
  "MUNASRI, S.Pd.",
  "NUR HAYATI, S.Psi, M.Pd.",
  "DWI RETNO TUGAS ERNAWATI, S.Pd",
  "KASIATIN, S.Pd",
  "SUHARTO DWI SUHERNOWO, ST",
  "ARSYL NOVA ARIRI, ST, M.Pd.",
  "LAILA FITRIYA, S.Pd.I",
  "EKA PRAMITASARI, S.Pd. M.Pd.",
  "MISBAHUR ROSYIDIN, S.Pd.",
  "Dra. DYAH CHUSNUL CHOTIMAH",
  "WAWAN SISWANTO, SS",
  "R.A. RATNA KARTIKAWATI, S.Pd",
  "HERI SUBYANTORO, ST, M.Pd.",
  "NURUL HUDA, ST, M.Si.",
  "NUR 'AFIIFAH, M.Pd.",
  "TRIBUDI HARTONO, S.Pd",
  "DEDY HENDRIANA, S.Pd. M.Pd.",
  "AGUS HIDAYAT, S.Pd",
  "SAMSUL HADI, M.Pd.",
  "HISBULLOH HUDA, M.Pd.",
  "DWI SANTOSO, S.Pd",
  "AGUS HARIYANTO, ST. M.Pd",
  "ZAINUL ARIFIN, M.Pd.",
  "BAMBANG SUJATMIKO, S.Pd",
  "HARTONO, S.Pd",
  "SIGIT EKO PRAMONO, S.Pd",
  "AGUNG RAKHMANDA, S.Kom.",
  "MOHAMAD ARIEF PRIYO UTOMO, S.Pd",
  "RIRIN DIYANNITA SASANTI, M.Pd.",
  "SULIADI, S.Pd",
  "TUTIK QOMARIYAH, S.Si",
  "IMAM SUFERI, ST.",
  "FIRMAN ARDIANSYAH, S.Pd.",
  "AZIZ CAHYA PRADANA, S.Pd.",
  "WAHYU ROFIUL AMIN, S.Pd.",
  "ROHMA EKA INDRI AHADIAH, S.Pd, Gr",
  "EFRIDA ISBANDRIYAH, S.T.",
  "SOTYA BAYUNTARA, S.Pd.",
  "SRIGATI, SE",
  "HARI PURWANTO, ST",
  "ESTI WIDHIARNI, S.T",
  "MUCHAMAD ISKAK FATONI, S.Pd.",
  "EKO FAJAR KURNIAWAN, S.Pd",
  "ETIK SULISTYOWATI, S.Pd.",
  "NOVAN EKO SETYAWAN, S.Kom.",
  "YAYUK NURNANINGSIH, S.Pd",
  "KHOIRUL AMIN, S.Pd",
  "REZA ZULKARNAIN ARIFIN, S.Pd.",
  "KHOIRUZEN, ST",
  "HEPPY LUCKITO, SST",
  "SRI PURWANINGSIH, S.Pd",
  "DARIS UMAMI, S.Pd.",
  "AKHMAD ROFI SAFUAT, S.Pd.",
  "SIDHARTHA BUDI SUMEDHA, S.Pd",
  "ASYITAH  ALMUFIDAH, S.Pd",
  "SUDARMONO, ST",
  "ROHMAN, S.T.",
  "ANDRI YUDHI PRASETYO, ST",
  "HARIS ALI MUHYIDIN, S.T",
  "MAMIEK ZUHRIYAH. S.Hum",
  "UMI RU'YATIN, S.Pd",
  "YEFI WULANDARI, SE",
  "SARI NURHIDAYATI, S.Pd.",
  "SUWOYO, S.Kom",
  "AAN SUSANTO, S.Pd.",
  "YUNITA DWI WIRANTI, S.Pd",
  "NUR FAUZIYAH, S.Ag.",
  "SUYANTI, S.Kom.",
  "MIANTO, S.Kom.",
  "YUNIAR DWI LISTYANTO, ST",
  "BENY WIJAYANTO, SS",
  "NURUL JAMILAH, S.Hum.",
  "ENDANG MULYANI, S.Pd.",
  "AGUS IRIANTO, S.Pd",
  "SAMUJI, S.Ag",
  "IKA UMAYA MARDIANA, S.Pd",
  "NUR KHOLIFAH, S.Pd.",
  "AIDA QONITATILLAH, S.Pd",
  "YULI ANDRIYANI,  S.Pd",
  "VITA EKA RAHAYU, S.Pd",
  "AKHMAD VICKRI HIDAYATULLAH, S.Pd",
  "HERI SUGIANTORO, S.Ag",
  "AKBAR ILHAM BAGASKARA PRATAMA, S.T",
  "DELIA NURUL AFIFAH",
  "CAHYA ISKANDAR",
  "EVY KUSHARDIANY",
  "HUDAN RHARA ANGGRIADI"
];

// Data Kelas dari Form Asli
const DAFTAR_KELAS = [
  "X TAV", "X TEI 1", "X TEI 2", "X TPL 1", "X TPL 2", "X TPM 1", "X TPM 2", "X TKR1", "X TKR2", "X TBKR", "X TSM 1", "X TSM 2", "X DKV 1", "X DKV 2", "X DKV 3",
  "XI TAV", "XI TEI 1", "XI TEI 2", "XI TPL 1", "XI TPL 2", "XI TPM 1", "XI TPM 2", "XI TKR1", "XI TKR2", "XI TBKR", "XI TSM 1", "XI TSM 2", "XI DKV 1", "XI DKV 2", "XI DKV 3",
  "XII TAV", "XII TEI 1", "XII TEI 2", "XII TPL 1", "XII TPL 2", "XII TPM 1", "XII TPM 2", "XII TKR1", "XII TKR2", "XII TBKR", "XII TSM 1", "XII TSM 2", "XII DKV 1", "XII DKV 2", "XII DKV 3"
];

/**
 * 1. Live Time Indicator
 */
function initLiveClock() {
  const timeElem = document.getElementById('current-time');
  if (!timeElem) return;

  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
    timeElem.textContent = timeStr + " WIB";
  }
  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * 2. Theme Toggle (Dark/Light)
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('portal_theme') || 'dark';

  if (savedTheme === 'light') {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  }

  toggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-mode')) {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      localStorage.setItem('portal_theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('portal_theme', 'dark');
    }
  });
}

/**
 * 3. Tab Navigation
 */
function initTabNavigation() {
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show targeted tab pane
      tabPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });
}

/**
 * 4. Clipboard & Toast Notification
 */
function initClipboardHandlers() {
  const copyButtons = document.querySelectorAll('.copy-link-btn');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const urlToCopy = btn.getAttribute('data-url');
      if (urlToCopy) {
        copyToClipboard(urlToCopy);
      }
    });
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast) return;

  if (toastMsg) toastMsg.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Tautan berhasil disalin ke clipboard!');
    }).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('Tautan berhasil disalin ke clipboard!');
  } catch (err) {
    showToast('Gagal menyalin tautan.');
  }
  document.body.removeChild(textArea);
}

/**
 * 5. Custom Link Builder / Generator
 */
function initFormBuilder() {
  const selectGuru = document.getElementById('select-guru');
  const selectKelas = document.getElementById('select-kelas');
  const customForm = document.getElementById('custom-link-form');

  const emptyState = document.getElementById('result-empty-state');
  const resultContent = document.getElementById('result-content');
  const generatedUrlText = document.getElementById('generated-url-text');
  const btnTestUrl = document.getElementById('btn-test-generated-url');
  const btnCopyUrl = document.getElementById('btn-copy-generated-url');

  // Populate Guru options
  DAFTAR_GURU.forEach(guru => {
    const opt = document.createElement('option');
    opt.value = guru;
    opt.textContent = guru;
    selectGuru.appendChild(opt);
  });

  // Populate Kelas options
  DAFTAR_KELAS.forEach(kelas => {
    const opt = document.createElement('option');
    opt.value = kelas;
    opt.textContent = kelas;
    selectKelas.appendChild(opt);
  });

  // Form Submit Handler
  customForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const guruVal = selectGuru.value;
    const nipVal = document.getElementById('input-nip').value.trim();
    const kelasVal = selectKelas.value;

    if (!guruVal || !nipVal || !kelasVal) return;

    // Build URL with encoded parameters
    const params = new URLSearchParams();
    params.set('usp', 'pp_url');
    params.set(ENTRY_GURU, guruVal);
    params.set(ENTRY_NIP, nipVal);
    params.set(ENTRY_KELAS, kelasVal);

    const fullUrl = `${BASE_FORM_URL}?${params.toString()}`;

    // Display result
    generatedUrlText.value = fullUrl;
    btnTestUrl.href = fullUrl;
    
    emptyState.style.display = 'none';
    resultContent.style.display = 'block';

    showToast('Tautan auto-fill berhasil dibuat!');
  });

  // Copy Generated URL Button
  btnCopyUrl.addEventListener('click', () => {
    if (generatedUrlText.value) {
      copyToClipboard(generatedUrlText.value);
    }
  });
}
