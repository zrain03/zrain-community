/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-06
 * Fail / File: tests/api.test.mjs
 * BM: Fail Api.test dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Api.test file according to Zrain Community contracts.
 */
import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {handleRequest} from '../worker/src/index.mjs';
const dir=resolve(import.meta.dirname,'..');
const adminToken='this-is-a-very-long-admin-token-for-local-tests-only-456789';
const envBase={
  TURNSTILE_HOSTNAME:'localhost',TURNSTILE_SECRET:'1x0000000000000000000000000000000AA',
  ALLOWED_ORIGINS:'http://127.0.0.1:8767',
  ADMIN_TOKEN:adminToken,
  ABUSE_HASH_KEY:'another-long-secret-key-to-hash-daily-identifiers-987654',
  MAX_GLOBAL_POSTS_PER_DAY:'200',MAX_PRODUCT_POSTS_PER_DAY:'25',MAX_VISITOR_POSTS_PER_DAY:'5',
  MAX_REPORTS_PER_DAY:'60',MAX_VISITOR_REPORTS_PER_DAY:'3'
};
function openDatabase(){
 const db=new DatabaseSync(':memory:');
 db.exec(readFileSync(resolve(dir,'worker/migrations/0001_init.sql'),'utf8'));
 db.exec(readFileSync(resolve(dir,'worker/migrations/0002_seed_products.sql'),'utf8'));
 db.exec(readFileSync(resolve(dir,'worker/migrations/0003_developers_and_moderation.sql'),'utf8'));
 db.exec(readFileSync(resolve(dir,'worker/migrations/0005_add_current_community_ids.sql'),'utf8'));
 return {
   raw: db,
   async batch(statements){
     db.exec('BEGIN TRANSACTION');
     try{const results=[];for(const stmt of statements)results.push(await stmt.run());db.exec('COMMIT');return results;}
     catch(err){db.exec('ROLLBACK');throw err;}
   },
   prepare(sql) {
     return {
       all() { return {results:db.prepare(sql).all()}; },
       first() { return db.prepare(sql).get()||null; },
       bind(...args) {
         const stmt = db.prepare(sql);
         return {
           async first() { return stmt.get(...args) || null; },
           async all() { return { results: stmt.all(...args) }; },
           async run() {
             const r = stmt.run(...args);
             return { meta: { changes: r.changes, last_row_id: Number(r.lastInsertRowid) } };
           }
         };
       }
     };
   }
 };
}

let env,db;
beforeEach(()=>{if(db)db.close();const v=openDatabase();db=v.raw;env={...envBase,DB:v};});
const send=async(path,{method='GET',body,admin=false,origin='http://127.0.0.1:8767',verified=true,ip='10.0.0.5'}={})=>{
 const headers={Origin:origin,'CF-Connecting-IP':ip};if(body!==undefined)headers['Content-Type']='application/json';
 if(admin)headers.Authorization='Bearer '+adminToken;
 const request=new Request('https://community-api.test'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const result=await handleRequest(request,env,{verifyTurnstile:async()=>verified});
 return {status:result.status,body:await result.json(),headers:result.headers};
};
const comment=(productId,text='A useful suggestion for this product',extra={})=>({productId,name:'Tester',text,category:'suggestion',turnstileToken:'dummy-valid-test-token',...extra});

test('all 68 registered spaces are uniquely seeded',async()=>{
 const r=await send('/api/products');assert.equal(r.status,200);assert.equal(r.body.products.length,68);
 assert.ok(r.body.products.some(x=>x.id==='zrain-links'));
 assert.ok(r.body.products.some(x=>x.id==='zrain-monitor'));
 assert.ok(r.body.products.some(x=>x.id==='zrain-gifts'));
 assert.ok(r.body.products.some(x=>x.id==='zrain-ecosystem'));
 assert.ok(r.body.products.some(x=>x.id==='zrain-community'));
});

test('health checks complete secrets (fail closed)',async()=>{
 const ok=await send('/api/health');assert.equal(ok.body.configured,true);
 env.TURNSTILE_SECRET='';const broken=await send('/api/comments?productId=zrain-links');assert.equal(broken.status,503);
 const health=await send('/api/health');assert.equal(health.body.configured,false);
});

test('valid comments publish immediately and stay isolated by product',async()=>{
 let r=await send('/api/comments',{method:'POST',body:comment('zrain-links')});assert.equal(r.status,201);const id=r.body.id;assert.equal(r.body.status,'approved');
 r=await send('/api/comments?productId=zrain-links');assert.equal(r.body.comments.length,1);
 r=await send('/api/admin/comments?status=approved',{admin:true});assert.equal(r.body.comments.length,1);
 r=await send('/api/admin/comments/'+id,{method:'PATCH',admin:true,body:{status:'approved'}});assert.equal(r.status,200);
 const links=await send('/api/comments?productId=zrain-links');assert.equal(links.body.comments.length,1);
 assert.equal(links.body.comments[0].text,'A useful suggestion for this product');
 const monitor=await send('/api/comments?productId=zrain-monitor');assert.equal(monitor.body.comments.length,0);
 const help=await send('/api/comments?productId=image-converter');assert.equal(help.body.comments.length,0);
});

test('cross-product replies and reports are blocked while same-product replies work',async()=>{
 const a=await send('/api/comments',{method:'POST',body:comment('zrain-links')});const id=a.body.id;
 await send('/api/admin/comments/'+id,{method:'PATCH',admin:true,body:{status:'approved'}});
 const forged=await send('/api/comments',{method:'POST',body:comment('zrain-monitor','A reply that belongs elsewhere',{parentId:id})});
 assert.equal(forged.status,404);
 const reply=await send('/api/comments',{method:'POST',body:comment('zrain-links','A correct reply',{parentId:id})});
 assert.equal(reply.status,201);
 await send('/api/admin/comments/'+reply.body.id,{method:'PATCH',admin:true,body:{status:'approved'}});
 const list=await send('/api/comments?productId=zrain-links');assert.equal(list.body.comments[0].replies.length,1);
 const crossReport=await send('/api/reports',{method:'POST',body:{productId:'zrain-monitor',commentId:id,reason:'spam',turnstileToken:'valid'}});
 assert.equal(crossReport.status,404);
 const validReport=await send('/api/reports',{method:'POST',body:{productId:'zrain-links',commentId:id,reason:'spam',turnstileToken:'valid'}});
 assert.equal(validReport.status,201);
 const reports=await send('/api/admin/reports',{admin:true});assert.equal(reports.body.reports.length,1);
});

test('public posting requires allowed origin, valid captcha and registered product',async()=>{
 const b=comment('zrain-links');
 assert.equal((await send('/api/comments',{method:'POST',origin:'https://evil.example',body:b})).status,403);
 assert.equal((await send('/api/comments',{method:'POST',body:b,verified:false})).status,403);
 assert.equal((await send('/api/comments',{method:'POST',body:{...b,productId:'unregistered'}})).status,404);
 assert.equal((await send('/api/comments',{method:'POST',body:{...b,text:'x'}})).status,422);
 assert.equal((await send('/api/comments',{method:'POST',body:{...b,category:'improper'}})).status,422);
});

test('admin auth is required for all admin actions',async()=>{
 let r=await send('/api/admin/comments');assert.equal(r.status,401);
 r=await send('/api/admin/products');assert.equal(r.status,401);
 r=await send('/api/admin/stats');assert.equal(r.status,401);
 r=await send('/api/admin/stats',{admin:true});assert.equal(r.status,200);assert.equal(r.body.activeProducts,68);
});

test('per-visitor and global quotas prevent unlimited anonymous posts',async()=>{
 env.MAX_VISITOR_POSTS_PER_DAY='2';
 assert.equal((await send('/api/comments',{method:'POST',body:comment('zrain-links')})).status,201);
 assert.equal((await send('/api/comments',{method:'POST',body:comment('zrain-links','Another useful suggestion')})).status,201);
 assert.equal((await send('/api/comments',{method:'POST',body:comment('zrain-links','Third useful suggestion')})).status,429);
});

test('a newly registered product gets its own empty comment space',async()=>{
 let r=await send('/api/admin/products',{method:'POST',admin:true,body:{id:'zrain-new-tool',name:'Zrain New Tool',kind:'tool'}});
 assert.equal(r.status,201);
 r=await send('/api/admin/products',{method:'POST',admin:true,body:{id:'zrain-new-tool',name:'Zrain New Tool',kind:'tool'}});assert.equal(r.status,409);
 r=await send('/api/comments?productId=zrain-new-tool');assert.equal(r.status,200);assert.equal(r.body.comments.length,0);
 r=await send('/api/comments',{method:'POST',body:comment('zrain-new-tool','A unique feedback for new tool')});assert.equal(r.status,201);
});

test('suggestion roadmap status appears only after approval and can be hidden',async()=>{
 let r=await send('/api/comments',{method:'POST',body:comment('zrain-links')});const id=r.body.id;
 await send('/api/admin/comments/'+id,{method:'PATCH',admin:true,body:{status:'approved',roadmapStatus:'planned'}});
 r=await send('/api/comments?productId=zrain-links');assert.equal(r.body.comments[0].roadmapStatus,'planned');
 await send('/api/admin/comments/'+id,{method:'PATCH',admin:true,body:{status:'hidden'}});
 r=await send('/api/comments?productId=zrain-links');assert.equal(r.body.comments.length,0);
});

test('admin removal removes a comment but not unrelated products',async()=>{
 const a=await send('/api/comments',{method:'POST',body:comment('zrain-links')});
 const b=await send('/api/comments',{method:'POST',body:comment('zrain-monitor'),ip:'10.0.0.6'});
 await send('/api/admin/comments/'+a.body.id,{method:'PATCH',admin:true,body:{status:'approved'}});
 await send('/api/admin/comments/'+b.body.id,{method:'PATCH',admin:true,body:{status:'approved'}});
 await send('/api/admin/comments/'+a.body.id,{method:'DELETE',admin:true});
 assert.equal((await send('/api/comments?productId=zrain-links')).body.comments.length,0);
 assert.equal((await send('/api/comments?productId=zrain-monitor')).body.comments.length,1);
});

test('same comment data cannot be read by another productId and invalid cursor is blocked',async()=>{
 assert.equal((await send('/api/comments?productId=zrain-monitor&cursor=oops')).status,400);
 assert.equal((await send('/api/comments?productId=nonexistent')).status,404);
});

test('report visibility remains admin-only',async()=>{
 const c=await send('/api/comments',{method:'POST',body:comment('zrain-links')});
 await send('/api/admin/comments/'+c.body.id,{method:'PATCH',admin:true,body:{status:'approved'}});
 const report=await send('/api/reports',{method:'POST',body:{productId:'zrain-links',commentId:c.body.id,reason:'off_topic',turnstileToken:'yes'}});
 assert.equal(report.status,201);
 const publicData=await send('/api/comments?productId=zrain-links');
 assert.equal(JSON.stringify(publicData.body).includes('off_topic'),false);
 const adminData=await send('/api/admin/reports',{admin:true});assert.equal(adminData.body.reports[0].reason,'off_topic');
});

test('admin can see and search all comments across all products with pagination',async()=>{
 for(let i=0;i<110;i++){
  const id=i%2?'zrain-links':'zrain-monitor';
  db.prepare('INSERT INTO comments(product_id,display_name,body,category,status) VALUES(?,?,?,?,?)')
    .run(id,'Visitor '+i,'Visible feedback '+i,'discussion','approved');
 }
 let r=await send('/api/admin/comments?status=all&limit=60',{admin:true});
 assert.equal(r.status,200);assert.equal(r.body.comments.length,60);assert.ok(r.body.nextCursor);
 let next=await send('/api/admin/comments?status=all&limit=60&cursor='+r.body.nextCursor,{admin:true});
 assert.equal(next.body.comments.length,50);assert.equal(next.body.nextCursor,null);
 const allIds=new Set([...r.body.comments,...next.body.comments].map(x=>x.id));assert.equal(allIds.size,110);
 const filtered=await send('/api/admin/comments?status=all&productId=zrain-monitor&q=feedback%2010',{admin:true});
 assert.ok(filtered.body.comments.length>0);
 assert.ok(filtered.body.comments.every(x=>x.product_id==='zrain-monitor'));
 assert.equal((await send('/api/admin/comments?cursor=invalid',{admin:true})).status,400);
});

test('applicants need human-reviewed domain proof; initial key only returned once',async()=>{
 const app={name:'Dev Example',email:'dev@example.com',projectName:'My Notes',productId:'my-notes',kind:'project',websiteOrigin:'https://notes.example.org',purpose:'Comments for notes',turnstileToken:'valid'};
 let r=await send('/api/developer/applications',{method:'POST',body:app});
 assert.equal(r.status,201);assert.equal(r.body.status,'pending');assert.ok(r.body.verificationCode.startsWith('zrain-community-verification='));
 assert.equal((await send('/api/products')).body.products.find(x=>x.id==='my-notes'),undefined);
 const requests=await send('/api/admin/developer-requests',{admin:true});assert.equal(requests.body.requests.length,1);
 assert.equal(requests.body.requests[0].email,'dev@example.com');
 const id=r.body.requestId;
 const deny=await send('/api/admin/developer-requests/'+id+'/approve',{admin:true,method:'POST',body:{domainVerified:false}});assert.equal(deny.status,422);
 r=await send('/api/admin/developer-requests/'+id+'/approve',{admin:true,method:'POST',body:{domainVerified:true}});
 assert.equal(r.status,201);assert.match(r.body.developerKey,/^zrc_dev_[0-9a-f]{64}$/);
 assert.ok((await send('/api/products')).body.products.some(x=>x.id==='my-notes'));
 const repeated=await send('/api/admin/developer-requests/'+id+'/approve',{admin:true,method:'POST',body:{domainVerified:true}});assert.equal(repeated.status,404);
 const leaks=await send('/api/admin/developer-requests?status=approved',{admin:true});assert.equal(JSON.stringify(leaks.body).includes(r.body.developerKey),false);
});

test('developer key restricts all reading, moderating, reporting and deleting to owned products',async()=>{
 const applicant={name:'Independent Developer',email:'owner@myapp.net',projectName:'Own Project',productId:'own-project',kind:'project',websiteOrigin:'https://myapp.net',turnstileToken:'valid'};
 const req=await send('/api/developer/applications',{method:'POST',body:applicant});
 const approval=await send('/api/admin/developer-requests/'+req.body.requestId+'/approve',{method:'POST',admin:true,body:{domainVerified:true}});
 const token=approval.body.developerKey;
 const sent=async(path,{method='GET',body,credential=token}={})=>{
  const headers={Authorization:'Bearer '+credential,Origin:'http://127.0.0.1:8767'};
  if(body!==undefined)headers['Content-Type']='application/json';
  const r=await handleRequest(new Request('https://community-api.test'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),env,{verifyTurnstile:async()=>true});
  return {status:r.status,body:await r.json()};
 };
 const own=await send('/api/comments',{method:'POST',body:comment('own-project')});
 const foreign=await send('/api/comments',{method:'POST',body:comment('zrain-links','Something from a different product')});
 const devList=await sent('/api/developer/comments?status=all');
 assert.equal(devList.status,200);assert.deepEqual(devList.body.comments.map(c=>c.product_id),['own-project']);
 assert.equal((await sent('/api/developer/comments/'+foreign.body.id,{method:'DELETE'})).status,404);
 assert.equal((await sent('/api/developer/comments/'+foreign.body.id,{method:'PATCH',body:{status:'approved'}})).status,404);
 assert.equal((await sent('/api/developer/comments/'+own.body.id,{method:'PATCH',body:{status:'approved'}})).status,200);
 assert.equal((await sent('/api/developer/comments?status=all&productId=zrain-links')).body.comments.length,0);
 assert.equal((await sent('/api/developer/reports?productId=zrain-links')).body.reports.length,0);
 assert.equal((await sent('/api/developer/me',{credential:'invalid-key'})).status,401);
 assert.equal((await sent('/api/developer/comments/'+own.body.id,{method:'DELETE'})).status,200);
 assert.equal((await send('/api/admin/comments?status=all',{admin:true})).body.comments.some(x=>x.id===own.body.id),false);
 const audit=db.prepare('SELECT action,actor_type,product_id FROM moderation_audit ORDER BY id DESC').all();assert.ok(audit.some(x=>x.actor_type==='developer'&&x.action==='delete'&&x.product_id==='own-project'));
});

test('developer key rotation revokes old key and preserves scoped access',async()=>{
 const app={name:'Owner',email:'owner@domain.org',projectName:'App',productId:'owner-app',websiteOrigin:'https://domain.org',turnstileToken:'valid'};
 const request=await send('/api/developer/applications',{method:'POST',body:app});
 const approved=await send('/api/admin/developer-requests/'+request.body.requestId+'/approve',{method:'POST',admin:true,body:{domainVerified:true}});
 const apiCall=async(path,token,method='GET')=>{
  const resp=await handleRequest(new Request('https://community-api.test'+path,{method,headers:{Authorization:'Bearer '+token,Origin:'http://127.0.0.1:8767'}}),env);return {status:resp.status,body:await resp.json()};
 };
 const old=approved.body.developerKey;
 const rotated=await apiCall('/api/developer/keys/rotate',old,'POST');assert.equal(rotated.status,201);
 assert.notEqual(rotated.body.developerKey,old);
 assert.equal((await apiCall('/api/developer/me',old)).status,401);
 assert.equal((await apiCall('/api/developer/me',rotated.body.developerKey)).status,200);
 const keys=(await apiCall('/api/developer/keys',rotated.body.developerKey)).body.keys;
 assert.equal(keys.filter(x=>!x.revoked_at).length,1);
 assert.equal(JSON.stringify(keys).includes(rotated.body.developerKey),false);
});

test('anonymous author can edit or delete only own comment for 24h with private token',async()=>{
 const a=await send('/api/comments',{method:'POST',body:comment('zrain-links')});
 const b=await send('/api/comments',{method:'POST',body:comment('zrain-monitor'),ip:'10.0.0.8'});
 assert.match(a.body.manageToken,/^zrc_c_[0-9a-f]{64}$/);
 const manage=async(id,method,key,body)=>{
  const headers={'Origin':'http://127.0.0.1:8767','X-Comment-Token':key};if(body)headers['Content-Type']='application/json';
  const response=await handleRequest(new Request('https://community-api.test/api/comments/'+id,{method,headers,body:body?JSON.stringify(body):undefined}),env);return {status:response.status,body:await response.json()};
 };
 assert.equal((await manage(b.body.id,'DELETE',a.body.manageToken)).status,404);
 assert.equal((await manage(a.body.id,'PATCH',a.body.manageToken,{productId:'zrain-monitor',text:'Another suggestion after edit'})).status,404);
 const edit=await manage(a.body.id,'PATCH',a.body.manageToken,{productId:'zrain-links',text:'Another suggestion after edit'});
 assert.equal(edit.status,200);assert.equal(edit.body.status,'approved');
 assert.equal((await send('/api/comments?productId=zrain-links')).body.comments[0].text,'Another suggestion after edit');
 assert.equal((await manage(a.body.id,'DELETE','bad-token')).status,401);
 assert.equal((await manage(a.body.id,'DELETE',a.body.manageToken)).status,200);
 assert.equal((await manage(a.body.id,'DELETE',a.body.manageToken)).status,404);
});

test('public registration limits, unsafe URL rejection, no public email disclosure',async()=>{
 const base={name:'Dev',email:'test@provider.org',projectName:'Test App',productId:'newest-app',websiteOrigin:'https://provider.org',turnstileToken:'token'};
 assert.equal((await send('/api/developer/applications',{method:'POST',body:{...base,websiteOrigin:'http://localhost:9999'}})).status,422);
 assert.equal((await send('/api/developer/applications',{method:'POST',body:{...base,websiteOrigin:'https://127.0.0.1'}})).status,422);
 assert.equal((await send('/api/developer/applications',{method:'POST',body:base,verified:false})).status,403);
 assert.equal((await send('/api/developer/applications',{method:'POST',body:base})).status,201);
 assert.equal((await send('/api/developer/applications',{method:'POST',body:{...base,productId:'second-app'}})).status,429);
 assert.equal(JSON.stringify((await send('/api/products')).body).includes('test@provider.org'),false);
});

test('public category filter and oldest/newest pagination never mix products',async()=>{
 for(let n=0;n<6;n++){
  db.prepare('INSERT INTO comments(product_id,display_name,body,category,status) VALUES(?,?,?,?,?)')
   .run('zrain-links','Guest','Comment '+n,n%2?'suggestion':'discussion','approved');
  db.prepare('INSERT INTO comments(product_id,display_name,body,category,status) VALUES(?,?,?,?,?)')
   .run('zrain-monitor','Guest','Another '+n,'suggestion','approved');
 }
 const first=await send('/api/comments?productId=zrain-links&category=suggestion&sort=oldest&limit=2');
 assert.equal(first.status,200);assert.equal(first.body.comments.length,2);
 assert.ok(first.body.comments[0].id<first.body.comments[1].id);
 const second=await send('/api/comments?productId=zrain-links&category=suggestion&sort=oldest&limit=2&cursor='+first.body.nextCursor);
 assert.equal(second.body.comments.length,1);
 assert.ok(first.body.comments.every(x=>x.productId==='zrain-links'));
 assert.equal((await send('/api/comments?productId=zrain-links&sort=whatever')).status,400);
 assert.equal((await send('/api/comments?productId=zrain-links&category=unknown')).status,400);
});

test('admin can remove developer application contact data without revoking approved product ownership',async()=>{
 const app={name:'Owner',email:'private@account.org',projectName:'Project',productId:'owner-second',websiteOrigin:'https://account.org',turnstileToken:'token'};
 const apply=await send('/api/developer/applications',{method:'POST',body:app});
 const approval=await send('/api/admin/developer-requests/'+apply.body.requestId+'/approve',{admin:true,method:'POST',body:{domainVerified:true}});
 assert.equal(approval.status,201);
 const remove=await send('/api/admin/developer-requests/'+apply.body.requestId,{admin:true,method:'DELETE'});
 assert.equal(remove.status,200);
 const requests=await send('/api/admin/developer-requests?status=all',{admin:true});
 assert.equal(requests.body.requests.length,0);
 const header={Origin:'http://127.0.0.1:8767',Authorization:'Bearer '+approval.body.developerKey};
 const res=await handleRequest(new Request('https://community-api.test/api/developer/me',{headers:header}),env);
 const body=await res.json();assert.equal(res.status,200);assert.equal(body.products[0].id,'owner-second');
});

test('moderation audit is admin-only and never copies public comment text or developer secrets',async()=>{
 const c=await send('/api/comments',{method:'POST',body:comment('zrain-links','A string that should not enter audit logs')});
 await send('/api/admin/comments/'+c.body.id,{method:'PATCH',admin:true,body:{status:'approved'}});
 await send('/api/admin/comments/'+c.body.id,{method:'DELETE',admin:true});
 assert.equal((await send('/api/admin/audit')).status,401);
 const audit=await send('/api/admin/audit',{admin:true});assert.equal(audit.status,200);
 assert.ok(audit.body.events.some(x=>x.action==='delete'&&x.product_id==='zrain-links'));
 assert.equal(JSON.stringify(audit.body).includes('A string that should not enter audit logs'),false);
});


test('instant posting rejects contact details, links and spam without placing them online',async()=>{
 for(const text of ['More details at https://example.com','Contact me by test@example.com please','Repeated letters: aaaaaaaaaaaaaaaaaaaaa']){
   const r=await send('/api/comments',{method:'POST',body:comment('zrain-links',text),ip:'10.1.1.'+Math.floor(Math.random()*200+1)});
   assert.equal(r.status,422,text);
 }
 assert.equal((await send('/api/comments?productId=zrain-links')).body.comments.length,0);
});
test('admin can remove immediately published comments and public reads update',async()=>{
 const r=await send('/api/comments',{method:'POST',body:comment('zrain-monitor')});
 assert.equal(r.body.status,'approved');
 const before=await send('/api/comments?productId=zrain-monitor');assert.equal(before.body.comments.length,1);
 const deleted=await send('/api/admin/comments/'+r.body.id,{method:'DELETE',admin:true});assert.equal(deleted.status,200);
 const after=await send('/api/comments?productId=zrain-monitor');assert.equal(after.body.comments.length,0);
});
