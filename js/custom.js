/* Dependency-light interactions for the personal portfolio. */
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.theme-toggle');
  const icon = button?.querySelector('i');
  const STORAGE_KEY = 'portfolio-theme';
  let storedTheme = null;
  try { storedTheme = localStorage.getItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }

  function setTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Enable light mode' : 'Enable dark mode');
      button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
  }

  setTheme(storedTheme === 'dark');
  button?.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark-mode');
    setTheme(dark);
    try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch { /* Optional setting. */ }
  });

  const collapsible = document.querySelector('#navbarNav');
  document.querySelectorAll('.navbar .nav-link[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (!collapsible?.classList.contains('show')) return;
      if (window.bootstrap?.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(collapsible, { toggle: false }).hide();
      } else {
        collapsible.classList.remove('show');
        document.querySelector('.navbar-toggler')?.setAttribute('aria-expanded', 'false');
      }
    });
  });
});
