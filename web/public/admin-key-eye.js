/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/admin-key-eye.js
 * BM: Fail Admin key eye dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Admin key eye file according to Zrain Community contracts.
 */
(() => {
  'use strict';
  // Only affects visibility of the existing input. Never copies, stores or sends the key.
  const input = document.getElementById('adminKey');
  const toggle = document.getElementById('adminKeyVisibility');
  if (!input || !toggle) return;

  function setVisible(visible) {
    input.type = visible ? 'text' : 'password';
    toggle.classList.toggle('is-visible', visible);
    toggle.setAttribute('aria-label', visible ? 'Hide administrator API key' : 'Show administrator API key');
    toggle.setAttribute('aria-pressed', String(visible));
    toggle.title = visible ? 'Hide key' : 'Show key';
  }

  toggle.addEventListener('click', () => {
    setVisible(input.type === 'password');
    input.focus({preventScroll:true});
  });
  // Do not leave a revealed key on-screen after submit or switching tabs.
  document.getElementById('loginForm')?.addEventListener('submit', () => setVisible(false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setVisible(false);
  });
})();
