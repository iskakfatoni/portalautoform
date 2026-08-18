/**
 * Centralized Theme Manager Module
 * PORTAL:AutoForm - SMKN 1 Jetis Mojokerto
 * Mengelola deteksi tema otomatis (OS/HP) dan manual override via localStorage
 */

export function getPreferredTheme() {
  const saved = localStorage.getItem('portal_theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  }
}

export function initTheme(toggleBtnId = 'theme-toggle-btn') {
  applyTheme(getPreferredTheme());

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('portal_theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  const themeToggleBtn = document.getElementById(toggleBtnId);
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('portal_theme', newTheme);
    });
  }
}
