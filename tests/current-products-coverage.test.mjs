/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: 2026-11-06
 * Dikemas kini / Last updated: 2026-11-06
 * BM: Semak kesemua sembilan ID baharu dan migrasi tambahan.
 * EN: Verify nine new product spaces and additive migration.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(readFileSync(new URL('data-products.json',root),'utf8'));
const migration=readFileSync(new URL('worker/migrations/0005_add_current_community_ids.sql',root),'utf8');
const ids=["zrain-image-tools","zrain-pdf-tools","zrain-document-tools","zrain-developer-tools","zrain-productivity-tools","text-counter","image-to-ascii-art","image-to-binary-art","image-to-block-art"];
test('five family homes and four new tool IDs are registered exactly once',()=>{
 assert.equal(catalog.length,68);
 assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
 for(const id of ids){
  assert.equal(catalog.filter(x=>x.id===id).length,1,id);
  assert.ok(migration.includes("VALUES ('"+id+"'"),id);
 }
 assert.equal((migration.match(/INSERT OR IGNORE INTO products/g)||[]).length,9);
 assert.doesNotMatch(migration,/\bDELETE\b|\bDROP\b|\bUPDATE\b/i);
});
