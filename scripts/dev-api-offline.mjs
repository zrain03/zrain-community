/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: scripts/dev-api-offline.mjs
 * BM: Fail Dev api offline dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Dev api offline file according to Zrain Community contracts.
 */
/** LOCAL-ONLY preview API: reuses Worker routing + SQLite, skips real Turnstile verification.
 * NEVER deploy this file to Cloudflare or expose it to the Internet. */
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {handleRequest} from '../worker/src/index.mjs';
const root=resolve(import.meta.dirname,'..');
const varsPath=resolve(root,'worker/.dev.vars');
let secrets;
try {secrets=Object.fromEntries(readFileSync(varsPath,'utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));}
catch {throw Error('Local secrets not found. Run npm run dev:setup first.');}
const localDir=resolve(root,'.local');mkdirSync(localDir,{recursive:true});
const database=new DatabaseSync(resolve(localDir,'community.sqlite'));
database.exec('PRAGMA foreign_keys = ON;');
database.exec(readFileSync(resolve(root,'worker/migrations/0001_init.sql'),'utf8'));
database.exec(readFileSync(resolve(root,'worker/migrations/0002_seed_products.sql'),'utf8'));
database.exec(readFileSync(resolve(root,'worker/migrations/0003_developers_and_moderation.sql'),'utf8'));
const DB={async batch(stmts){
  database.exec('BEGIN');try{const results=[];for(const x of stmts)results.push(await x.run());database.exec('COMMIT');return results;}
  catch(e){database.exec('ROLLBACK');throw e;}
},prepare(sql){return {
  first:async()=>database.prepare(sql).get()||null,
  all:async()=>({results:database.prepare(sql).all()}),
  bind(...args){const stmt=database.prepare(sql);return {
    first:async()=>stmt.get(...args)||null,
    all:async()=>({results:stmt.all(...args)}),
    run:async()=>{const r=stmt.run(...args);return {meta:{changes:r.changes,last_row_id:Number(r.lastInsertRowid)}};}
  };}
};}};
const env={...secrets,DB,TURNSTILE_HOSTNAME:'localhost',ALLOWED_ORIGINS:'http://127.0.0.1:8767',MAX_GLOBAL_POSTS_PER_DAY:'200',MAX_PRODUCT_POSTS_PER_DAY:'25',MAX_VISITOR_POSTS_PER_DAY:'5',MAX_REPORTS_PER_DAY:'60',MAX_VISITOR_REPORTS_PER_DAY:'3'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:8787');
  if(req.method==='GET'&&url.pathname==='/local-preview-info'){
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({mode:'LOCAL PREVIEW ONLY',turnstileVerified:false,cloudflareDeployed:false}));return;
  }
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const body=Buffer.concat(chunks);
  const request=new Request(url,{method:req.method,headers:req.headers,body:body.length?body:undefined});
  const response=await handleRequest(request,env,{verifyTurnstile:async()=>true});
  const bytes=Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(bytes);
 }catch(err){console.error('Local preview API failure',err?.name||'unknown');res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local preview API failed'}));}
});
server.listen(8787,'127.0.0.1',()=>console.log('LOCAL-ONLY Zrain Community API at http://127.0.0.1:8787 (Turnstile simulated, not production)'));
