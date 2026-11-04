/**
 * Pembangun / Developer: Zrain
 * Dicipta / Created: 2026-11-04
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: scripts/check-zrain-ui.mjs
 * BM: Sahkan integrasi UI, sekatan iframe embed dan keutuhan navigasi semua halaman penuh.
 * EN: Verify the UI integration, iframe-only embed isolation and navigation across full pages.
 */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname,'..');
const get = relative => readFile(resolve(root,relative),'utf8');
const pages = (await readdir(resolve(root,'web/public'))).filter(f=>f.endsWith('.html')&&f!=='embed.html');
const brand = await get('web/public/brand.css');
const ui = await get('web/public/zrain-ui.js');
const config = await get('web/public/zrain-ui-config.js');
const nav = await get('web/public/community-nav.css');
assert.match(brand,/\.zrain-footer \.zrain-footer__home/);
assert.match(ui,/export function mountZrainUI/);
assert.match(ui,/Made for people\. Built with purpose\./);
assert.match(config,/product: 'Community'/);
assert.match(config,/mountZrainUI/);
assert.doesNotMatch(config,/navigation\s*:/, 'Community keeps app-owned navigation');
assert.match(nav,/overflow-x: auto/);
assert.match(nav,/max-width: 850px/);
for (const name of pages) {
  const page = await get(`web/public/${name}`);
  assert.match(page, /class="zrain-header"/, `${name}: header missing`);
  assert.match(page, /class="zrain-footer__identity"/, `${name}: footer identity missing`);
  assert.match(page, /class="main-nav"/, `${name}: navigation missing`);
  assert.match(page, /zrain-ui-config\.js\?v=20261104/, `${name}: shared script missing`);
  assert.match(page, /brand\.css\?v=20261104/, `${name}: shared CSS missing`);
  assert.match(page, /community-nav\.css\?v=20261104/, `${name}: nav CSS missing`);
  assert.doesNotMatch(page, /class="mobile-menu"/, `${name}: redundant mobile menu`);
  assert.match(page, /Developed by Zrain/, `${name}: developer credit`);
}
const embed = await get('web/public/embed.html');
assert.doesNotMatch(embed,/zrain-ui-config\.js|class="zrain-header"/, 'Embedded discussion must remain standalone');
assert.match(await get('web/public/index.html'),/data-product="zrain-community"/);
console.log(`Zrain Community shared UI checks passed on ${pages.length} full pages and the isolated embed.`);
