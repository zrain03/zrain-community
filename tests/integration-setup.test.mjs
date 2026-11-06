/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-06
 * Fail / File: tests/integration-setup.test.mjs
 * BM: Fail Integration setup.test dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Integration setup.test file according to Zrain Community contracts.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=f=>readFileSync(resolve(root,f),'utf8');
test('all Zrain products have individual snippets with unique IDs and public embed only',()=>{
 const catalog=JSON.parse(read('data-products.json'));
 const snippets=read('docs/SNIPPETS-ALL-PRODUCTS.md');
 assert.equal(catalog.length,68);
 for(const item of catalog) assert.ok(snippets.includes(`data-product="${item.id}"`));
 assert.equal(new Set(catalog.map(x=>x.id)).size,68);
 assert.equal(snippets.includes('ADMIN_TOKEN'),false);
});
test('beginner integration wizard and developer dashboard exist and are linked',()=>{
 for(const name of ['developers.html','developer-dashboard.html','developer-onboarding.js','developer-dashboard.js','developer.css','guidelines.html','privacy.html'])
  assert.ok(existsSync(resolve(root,'web/public',name)));
 assert.ok(read('web/public/developers.html').includes('id="productSelect"'));
 assert.ok(read('web/public/developers.html').includes('id="applicationForm"'));
 assert.ok(read('web/public/developer-dashboard.html').includes('id="developerKey"'));
 assert.ok(read('web/public/index.html').includes('/developers.html'));
});
test('platform admin includes global search, more pages, delete and developer application approval',()=>{
 const admin=read('web/public/admin.html');const js=read('web/public/admin-client.js');
 for(const id of ['commentSearch','statusFilter','productFilter','loadMoreComments','developerRequestRows','issuedKeyPanel','auditRows'])assert.ok(admin.includes(`id="${id}"`));
 assert.ok(js.includes("button('Delete'"));
 assert.ok(js.includes('developer-requests/'));
 assert.ok(js.includes('All products (admin only)'));
});
test('developer authorization is server-side, never key in public config or embed',()=>{
 const worker=read('worker/src/index.mjs'),embed=read('web/public/embed.js');
 assert.ok(worker.includes('developerIdentity'));
 assert.ok(worker.includes('developer_products'));
 assert.ok(worker.includes('key_hash'));
 assert.ok(worker.includes('sha256hex'));
 assert.equal(embed.includes('ADMIN_TOKEN'),false);
 assert.equal(/ADMIN_TOKEN\s*[:=]/.test(read('web/public/config.js')),false);
});


test('shared template helper reads an explicit product ID, never guesses from URL',()=>{
 const helper=read('web/public/auto-embed.js');
 assert.ok(helper.includes('meta[name="zrain-product-id"]'));
 assert.ok(helper.includes('/embed.js'));
 assert.equal(helper.includes('location.pathname'),false);
});
