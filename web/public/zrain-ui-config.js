/**
 * Pembangun / Developer: Zrain
 * Dicipta / Created: 2026-11-04
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/zrain-ui-config.js
 * BM: Selaraskan identiti header dan footer kepada Zrain UI Golden Reference.
 * EN: Align the header and footer identity with Zrain UI Golden Reference.
 */

// BM: Library hanya mengurus identiti; menu dan ScrollSpy sedia ada kekal milik Community.
// EN: Shared UI manages identity only; Community owns its established menu and ScrollSpy.
import { mountZrainUI } from '/zrain-ui.js?v=20261104';

// BM: Identiti produk dan logo rasmi sama pada semua halaman penuh Community.
// EN: Product identity and the official logo are shared by all full Community pages.
mountZrainUI({
  product: 'Community',
  logoSrc: '/zrain-logo.webp',
  productHref: '/'
});
