/**
 * Arcyn Studios — Install Prompt
 * Listens for beforeinstallprompt and shows an install banner.
 */
export function initInstallPrompt() {
  let deferredPrompt = null;
  let dismissed = sessionStorage.getItem('arcyn-install-dismissed') === 'true';

  const banner = document.querySelector('[data-install-banner]');
  const btn = document.querySelector('[data-install-btn]');
  if (!banner || !btn) return;

  const hide = () => {
    banner.hidden = true;
    banner.setAttribute('aria-hidden', 'true');
  };

  const show = () => {
    if (dismissed) return;
    banner.hidden = false;
    banner.setAttribute('aria-hidden', 'false');
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    show();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hide();
  });

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'dismissed') {
      dismissed = true;
      sessionStorage.setItem('arcyn-install-dismissed', 'true');
    }
    deferredPrompt = null;
    hide();
  });

  const closeBtn = banner.querySelector('[data-install-close]');
  closeBtn?.addEventListener('click', () => {
    dismissed = true;
    sessionStorage.setItem('arcyn-install-dismissed', 'true');
    hide();
  });

  if (dismissed) hide();
}
