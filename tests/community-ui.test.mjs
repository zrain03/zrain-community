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

test('Community home and admin use the shared shell',()=>{
 for(const html of [home,admin]){
  assert.match(html, /<script defer src="https:\/\/zrain\.web\.app\/ui\/v2\/layout\.js" data-product="zrain-community"/);
 }
 assert.match(home,/data-native/);
 assert.match(admin,/data-zrain-content/);
});
test('Community feedback uses the real product embed',()=>{
 assert.match(home,/frame\.src=origin\+'\/embed\.html\?product='/);
 assert.match(home,/communityId:'zrain-community'/);
 assert.doesNotMatch(home,/frame\.srcdoc\s*=/);
 assert.match(home,/location\.hash==='#community'/);
});
test('No named product comparison appears in public landing',()=>{
 assert.doesNotMatch(home,/Zrain Links|Zrain Monitor/i);
});
test('Buttons and navigation deliberately suppress default underlines',()=>{
 assert.match(css,/body\.community-site a \{ text-decoration:none; \}/);
 assert.match(css,/body\.community-site \.button \{[^}]*text-decoration:none/);
});
test('Admin exposes one mount for the shared footer and no legacy logo',()=>{
 assert.ok(existsSync(resolve(root,'web/public/brand.css')));
 assert.equal((admin.match(/<footer data-zrain-footer>/g)||[]).length,1);
 assert.doesNotMatch(admin,/<img class="zrain-footer__logo"/);
});
test('Original admin selectors and configuration scripts remain accessible',()=>{
 for(const id of ['loginView','loginForm','adminKey','loginStatus','dashboard','summary','logout','productFilter','statusFilter','commentRows','refresh','reportRows','refreshReports','productForm','newProductId','newProductName','newKind','registerStatus']){
  assert.ok(admin.includes(`id="${id}"`),`Missing admin ID ${id}`);
 }
 assert.match(admin,/src="\/config\.js"/);
 assert.match(admin,/src="\/admin-client\.js"/);
});
test('Mobile and keyboard accessibility are included',()=>{
 assert.match(admin,/class="skip-link"/);
 assert.match(home,/class="community-skip" href="#zrain-product-content"/);
 assert.ok(home.includes("progress.setAttribute('aria-label','Page progress')"));
 assert.match(read('web/public/community-nav.css'),/overflow-x: auto/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
