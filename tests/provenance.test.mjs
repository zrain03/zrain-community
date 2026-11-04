/**
 * Pembangun / Developer: Zrain
 * Dicipta / Created: 2026-11-04
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: tests/provenance.test.mjs
 * BM: Sahkan setiap fail release boleh dijejak tanpa mengubah JSON atau aset binari.
 * EN: Ensure every retained file is traceable without modifying strict JSON or binary assets.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const registry=JSON.parse(readFileSync(resolve(root,'FILE_PROVENANCE.json'),'utf8'));
// BM: Folder yang dijana atau menyimpan keadaan tempatan bukan sebahagian daripada source release.
// EN: Generated folders and local state are not part of the release source inventory.
const skip=new Set(['node_modules','.git','.wrangler','.firebase','.local']);

// BM: Abaikan hanya fail konfigurasi rahsia dan artifak tempatan seperti yang dinyatakan dalam .gitignore.
// EN: Ignore only secret configuration and local artifacts covered by .gitignore.
// BM: Fail contoh .dev.vars.example dan .env.example TETAP diperiksa sebagai source.
// EN: Example files .dev.vars.example and .env.example REMAIN part of the source inventory.
function isLocalOnlyFile(name){
 return name==='.dev.vars' || name==='.env' || name==='.DS_Store' ||
   (name.startsWith('.env.') && name!=='.env.example') || name.endsWith('.log');
}

// BM: Enumerasi setiap fail source tanpa bergantung pada isi ZIP sementara.
// EN: Inventory source files independently from temporary ZIP contents.
function collect(folder){
 return readdirSync(folder,{withFileTypes:true}).flatMap(item=>{
  if(item.isDirectory())return skip.has(item.name)?[]:collect(resolve(folder,item.name));
  if(isLocalOnlyFile(item.name))return [];
  return [relative(root,resolve(folder,item.name)).replaceAll('\\','/')];
 });
}
test('file provenance inventories every source file exactly once',()=>{
 const actual=collect(root).sort();
 const records=registry.files.map(x=>x.path).sort();
 assert.deepEqual(records,actual);
 for(const f of registry.files){
  assert.equal(f.developer,'Zrain');
  assert.ok(f.created && f.lastUpdated && f.evidence);
 }
});
test('commentable files keep valid bilingual metadata while strict JSON stays parseable',()=>{
 for(const f of registry.files){
  const path=resolve(root,f.path);
  if(f.path.endsWith('.json')){
   assert.doesNotThrow(()=>JSON.parse(readFileSync(path,'utf8')),f.path);
   continue;
  }
  if(f.metadataLocation!=='file-header')continue;
  const start=readFileSync(path,'utf8').slice(0,750);
  for(const token of ['Pembangun / Developer: Zrain','Dicipta / Created','Dikemas kini / Last updated:','BM:','EN:']){
   assert.ok(start.includes(token),`${f.path}: missing ${token}`);
  }
 }
});
