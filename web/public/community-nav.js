/**
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/community-nav.js
 * BM: Kekalkan menu milik Community dengan state aktif tepat selepas klik, scroll dan Back/Forward.
 * EN: Preserve Community-owned navigation with accurate active state on click, scroll and Back/Forward.
 */
(() => {
  'use strict';
  // BM: Footer/iframe tidak menggunakan navigasi halaman utama ini.
  // EN: Footer/iframe do not use this homepage-section navigation.
  const header = document.querySelector('.zrain-header');
  if (!header) return;
  const sectionIds = ['how-it-works', 'community', 'for-developers'];
  const sections = sectionIds.map(id => ({ id, element: document.getElementById(id) }))
    .filter(item => item.element);
  const links = [...header.querySelectorAll('.main-nav a[href^="#"]')]
    .filter(link => sectionIds.includes(link.getAttribute('href').slice(1)));
  if (!sections.length || !links.length) return;
  let frameQueued = false;
  let pending = null;

  // BM: Gunakan tinggi header semasa; elakkan tab pertama menyala palsu ketika masih di hero.
  // EN: Use the actual header height and keep the hero without an incorrectly active section.
  const threshold = () => header.getBoundingClientRect().height + 12;
  const visibleSection = () => {
    let selected = null;
    for (const { id, element } of sections) {
      if (element.getBoundingClientRect().top <= threshold() + 12) selected = id;
    }
    return selected;
  };

  // BM: Kemas kini visual serta aria-current bersama supaya pembaca skrin mendapat state tepat.
  // EN: Update both appearance and aria-current so assistive technology receives the correct state.
  const mark = id => {
    for (const link of links) {
      const active = id !== null && link.getAttribute('href') === '#' + id;
      link.classList.toggle('current', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };

  // BM: Selepas klik, kekalkan highlight destinasi sewaktu smooth scroll bergerak melalui seksyen lain.
  // EN: After clicking, keep the destination highlighted during smooth scroll through intermediate sections.
  const update = () => {
    if (pending) {
      const target = document.getElementById(pending);
      if (target && Math.abs(target.getBoundingClientRect().top - threshold()) <= 18) pending = null;
      else { mark(pending); return; }
    }
    mark(visibleSection());
  };
  const schedule = () => {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(() => { frameQueued = false; update(); });
  };
  const interrupt = () => { if (pending !== null) { pending = null; schedule(); } };

  // BM: Respon klik segera, tanpa timer satu saat; scrolling manual membatalkan sasaran lama.
  // EN: Respond instantly to clicks without a one-second timer; manual scrolling cancels old targets.
  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const id = link.getAttribute('href').slice(1);
      if (!document.getElementById(id)) return;
      pending = id;
      mark(id);
    });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('wheel', interrupt, { passive: true });
  window.addEventListener('touchstart', interrupt, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key) &&
        !event.target?.closest?.('input, textarea, select, [contenteditable]')) interrupt();
  });
  window.addEventListener('hashchange', () => {
    // BM: Hash tidak sah tidak boleh menyebabkan navigasi gagal.
    // EN: Malformed hashes must not crash navigation.
    let hash = '';
    try { hash = decodeURIComponent((window.location?.hash || '').slice(1)); } catch { /* Invalid hash: no section. */ }
    pending = sectionIds.includes(hash) ? hash : null;
    if (pending) mark(pending);
    else schedule();
  });
  window.addEventListener('popstate', schedule);
  window.addEventListener('load', schedule);
  if ('onscrollend' in window) window.addEventListener('scrollend', () => { pending = null; schedule(); }, { passive: true });
  // BM: Pemilihan awal mestilah mengikut viewport semasa, termasuk semasa refresh.
  // EN: Initial selection must follow the actual viewport, including after refresh.
  schedule();
})();
