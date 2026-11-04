/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: tests/community-ui.test.mjs
 * BM: Fail Community ui.test dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Community ui.test file according to Zrain Community contracts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=(file)=>readFileSync(resolve(root,file),'utf8');
const home=read('web/public/index.html');
const admin=read('web/public/admin.html');
const css=read('web/public/community.css');

test('Zrain Ecosystem header structure is shared on public and admin pages',()=>{
 for(const html of [home,admin]){
  for(const piece of ['class="zrain-header"','class="zrain-header__inner"','class="zrain-brand"','class="zrain-brand__home"','class="zrain-brand__product"','class="main-nav"']){
   assert.ok(html.includes(piece),`Expected ${piece}`);
  }
  assert.match(html,/<link rel="stylesheet" href="\/brand\.css\?v=20261104">/);
  assert.match(html,/<link rel="icon" type="image\/webp" href="\/zrain-logo\.webp">/);
 }
});
test('Real product community is mounted, with no fake demo page',()=>{
 assert.match(home, /id="communityMount"/);
 assert.match(home, /src="\/embed\.js" data-product="zrain-community" data-target="#communityMount"/);
 assert.doesNotMatch(home,/live demo|try the demo|this example is/i);
});
test('No named product comparison appears in public landing',()=>{
 assert.doesNotMatch(home,/Zrain Links|Zrain Monitor/i);
});
test('Buttons and navigation deliberately suppress default underlines',()=>{
 assert.match(css,/body\.community-site a \{ text-decoration:none; \}/);
 assert.match(css,/body\.community-site \.button \{[^}]*text-decoration:none/);
});
test('Shared brand assets and standard footer are retained',()=>{
 assert.ok(existsSync(resolve(root,'web/public/brand.css')));
 assert.ok(existsSync(resolve(root,'web/public/zrain-logo.webp')));
 for(const html of [home,admin]){
  assert.match(html,/Developed by Zrain/);
  assert.match(html,/Made for people\. Built with purpose\./);
 }
});
test('Original admin selectors and configuration scripts remain accessible',()=>{
 for(const id of ['loginView','loginForm','adminKey','loginStatus','dashboard','summary','logout','productFilter','statusFilter','commentRows','refresh','reportRows','refreshReports','productForm','newProductId','newProductName','newKind','registerStatus']){
  assert.ok(admin.includes(`id="${id}"`),`Missing admin ID ${id}`);
 }
 assert.match(admin,/src="\/config\.js"/);
 assert.match(admin,/src="\/admin-client\.js"/);
});
test('Mobile and keyboard accessibility are included',()=>{
 assert.match(home,/class="skip-link"/);
 assert.match(home,/class="main-nav"/);
 assert.match(read('web/public/community-nav.css'),/overflow-x: auto/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
