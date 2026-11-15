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
const native = new Set(['index.html','guidelines.html','privacy.html']);
const loader = 'https://zrain.web.app/ui/v2/layout.js';
for (const name of pages) {
  const page = await get(`web/public/${name}`);
  assert.equal(page.split(loader).length,2,`${name}: one shared layout script required`);
  assert.match(page,/data-product="zrain-community"/);
  if(native.has(name)){
    assert.match(page,/data-native/);
    assert.match(page,/miniGame:true,splash:true/);
  }else{
    assert.match(page,/<header data-zrain-header>/);
    assert.match(page,/<footer data-zrain-footer>/);
    assert.match(page,/<main data-zrain-content/);
    const menu = JSON.parse(page.match(/data-menu="([^"]+)"/)[1].replaceAll('&quot;','"'));
    assert.ok(menu.length >= 2);
    assert.doesNotMatch(page,/zrain-ui-config\.js/);
  }
}
const embed = await get('web/public/embed.html');
assert.ok(embed.includes(loader), 'The direct embed URL must use the shared layout');
assert.match(embed,/if\(window.top===window\)\{[\s\S]*document.body.append\(loader\)/, 'The shared layout must only load on standalone discussion pages');
assert.match(embed,/community-client\.js/);
console.log(`Zrain Community shared UI checks passed on ${pages.length} full pages and the isolated embed.`);
