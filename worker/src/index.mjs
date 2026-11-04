/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: worker/src/index.mjs
 * BM: Fail Index dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Index file according to Zrain Community contracts.
 */
/** Zrain Community API. Shared infrastructure; separate product IDs and threads. */
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORIES=new Set(['discussion','suggestion','bug_report','appreciation']);
const STATES=new Set(['pending','approved','rejected','hidden']);
const ROADMAP=new Set(['under_review','planned','implemented']);
const REPORT_REASONS=new Set(['spam','abusive','off_topic','other']);
const TEST_SECRET='1x0000000000000000000000000000000AA';

class BadRequest extends Error {}
function response(data,status=200,extra={}) {
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...extra}});
}
function error(message,status=400){return response({error:message},status);}
function idValid(s){return typeof s==='string' && s.length<=80 && SLUG.test(s);}
function numberParam(s){const n=Number(s);return Number.isSafeInteger(n)&&n>0?n:null;}
function clamp(n,fallback,max){const v=Number(n);return Number.isSafeInteger(v)&&v>0?Math.min(v,max):fallback;}
function limit(env,key,fallback,max){return clamp(env[key],fallback,max);}
function allowedOrigins(env){return String(env.ALLOWED_ORIGINS||'https://zrain-community.web.app').split(',').map(x=>x.trim()).filter(Boolean);}
function cors(request,env){
  const origin=request.headers.get('Origin');
  return origin && allowedOrigins(env).includes(origin) ? {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-Comment-Token','Access-Control-Max-Age':'600'} : {};
}
function cleanText(v,max){if(typeof v!=='string')return null;const s=v.trim();return s.length<=max?s:null;}
async function readJson(request){
  if(!String(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))throw new BadRequest('JSON request required');
  if(Number(request.headers.get('Content-Length')||0)>8192)throw new BadRequest('Request too large');
  const reader=request.body?.getReader(); if(!reader)throw new BadRequest('Request body required');
  const chunks=[];let count=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;count+=value.byteLength;if(count>8192){await reader.cancel();throw new BadRequest('Request too large');}chunks.push(value);}}finally{reader.releaseLock();}
  const all=new Uint8Array(count);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength;}
  try{const out=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));if(!out||typeof out!=='object'||Array.isArray(out))throw Error();return out;}catch{throw new BadRequest('Invalid JSON object');}
}
async function hmac(key,message){
  const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(message)));
  return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');
}
async function constantTimeMatch(a,b){
  if(!a||!b)return false;
  const digest=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
  const [x,y]=await Promise.all([digest(a),digest(b)]);
  let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;
}
function production(env){return env.TURNSTILE_HOSTNAME==='zrain-community.web.app';}
function secretsReady(env){
  return typeof env.ADMIN_TOKEN==='string' && env.ADMIN_TOKEN.length>=40 &&
    typeof env.ABUSE_HASH_KEY==='string' && env.ABUSE_HASH_KEY.length>=40 &&
    typeof env.TURNSTILE_SECRET==='string' && env.TURNSTILE_SECRET.length>=30 &&
    (!production(env)||env.TURNSTILE_SECRET!==TEST_SECRET);
}
async function verifySiteverify(token,env){
  const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),5500);
  try{
    const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:controller.signal});
    if(!r.ok)return false;
    const result=await r.json();
    if(result.success!==true)return false;
    // For development keys Cloudflare returns localhost/127.0.0.1.
    const hosts=production(env)?['zrain-community.web.app']:['localhost','127.0.0.1','zrain-community.web.app'];
    return hosts.includes(result.hostname);
  }catch{return false;}finally{clearTimeout(timeout);}
}
async function validTurnstile(payload,env,verify){
  const token=cleanText(payload.turnstileToken,2048);
  if(!token||!env.TURNSTILE_SECRET)return false;
  return await verify(token,env);
}
function visitorIp(request){return request.headers.get('CF-Connecting-IP')||'local';}
async function visitorKey(request,env){
  if(typeof env.ABUSE_HASH_KEY!=='string'||env.ABUSE_HASH_KEY.length<40)throw Error('Abuse hashing not configured');
  // Hashed daily identifier only. No raw IP or email stored in D1.
  return await hmac(env.ABUSE_HASH_KEY,`${new Date().toISOString().slice(0,10)}:${visitorIp(request)}`);
}
async function consume(db,scope,key,maximum){
  const date=new Date().toISOString().slice(0,10);
  const row=await db.prepare(`INSERT INTO quota_counters(scope,quota_key,day,count) VALUES(?,?,?,1)
    ON CONFLICT(scope,quota_key,day) DO UPDATE SET count=count+1 WHERE count < ?
    RETURNING count`).bind(scope,key,date,maximum).first();
  return !!row;
}
async function getProduct(db,id){if(!idValid(id))return null;return db.prepare('SELECT id,name,kind,enabled FROM products WHERE id=?').bind(id).first();}
function parseBody(body){
  const text=cleanText(body.text,1000),name=cleanText(body.name??'',40),type=body.category||'discussion';
  if(!text||text.length<8)return {error:'Comment must be 8 to 1000 characters'};
  if(name&&name.length<2)return {error:'Name must be 2 to 40 characters'};
  if(!CATEGORIES.has(type))return {error:'Invalid comment category'};
  const parent=body.parentId==null?null:numberParam(body.parentId);
  if(body.parentId!=null&&!parent)return {error:'Invalid parent comment'};
  return {text,name:name||'Guest',type,parent};
}
// Immediate publication only for content passing basic automated safety checks.
// No third-party moderation API or paid dependency. This is deliberately not a
// comprehensive detection system: public reports and admin deletion stay essential.
function publicSafetyCheck(text){
  if(/(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|app|dev|xyz|shop)\b)/i.test(text))
    return 'Please remove links from public comments.';
  if(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)||/(?:\+?\d[\s().-]*){10,}/.test(text))
    return 'Please do not include contact information.';
  if(/(.)\1{12,}/u.test(text)||text.split(/\s+/u).length>220)
    return 'Please shorten repetitive or unusually long messages.';
  return null;
}
function publicComment(row){return {id:row.id,productId:row.product_id,parentId:row.parent_id,name:row.display_name,text:row.body,category:row.category,roadmapStatus:row.roadmap_status,createdAt:row.created_at};}
async function publicList(db,url){
  const productId=url.searchParams.get('productId');const product=await getProduct(db,productId);
  if(!product||product.enabled!==1)return error('Product not found',404);
  const pageSize=clamp(url.searchParams.get('limit'),10,20);
  const cursor=url.searchParams.get('cursor');if(cursor&&!numberParam(cursor))return error('Invalid cursor');
  const category=url.searchParams.get('category')||'all';
  if(category!=='all'&&!CATEGORIES.has(category))return error('Invalid category',400);
  const order=url.searchParams.get('sort')||'newest';
  if(!['newest','oldest'].includes(order))return error('Invalid sort order',400);
  const newest=order==='newest';
  const checks=["product_id=?","status='approved'","parent_id IS NULL"],args=[product.id];
  if(category!=='all'){checks.push('category=?');args.push(category);}
  if(cursor){checks.push('id '+(newest?'<':'>')+' ?');args.push(Number(cursor));}
  const result=await db.prepare(`SELECT * FROM comments WHERE ${checks.join(' AND ')} ORDER BY id ${newest?'DESC':'ASC'} LIMIT ?`)
    .bind(...args,pageSize+1).all();
  const rows=result.results||[];const page=rows.slice(0,pageSize);const ids=page.map(x=>x.id);let replies=[];
  if(ids.length){
    const place=ids.map(()=>'?').join(',');
    const result2=await db.prepare(`SELECT * FROM comments WHERE product_id=? AND status='approved' AND parent_id IN (${place}) ORDER BY id ASC`).bind(productId,...ids).all();
    replies=(result2.results||[]).map(publicComment);
  }
  return response({product:{id:product.id,name:product.name},comments:page.map(c=>({...publicComment(c),replies:replies.filter(r=>r.parentId===c.id)})),nextCursor:rows.length>pageSize?page.at(-1)?.id:null},200,{'Cache-Control':'public, max-age=15'});
}
async function postComment(request,env,verify){
  const body=await readJson(request);const product=await getProduct(env.DB,body.productId);
  if(!product||product.enabled!==1)return error('Product not found',404);
  const fields=parseBody(body);if(fields.error)return error(fields.error,422);
  const risk=publicSafetyCheck(fields.text);if(risk)return error(risk,422);
  if(fields.parent){
    const parent=await env.DB.prepare("SELECT id FROM comments WHERE id=? AND product_id=? AND status='approved' AND parent_id IS NULL").bind(fields.parent,product.id).first();
    if(!parent)return error('Parent comment not found in this product',404);
  }
  if(!await validTurnstile(body,env,verify))return error('Anti-spam verification failed',403);
  const key=await visitorKey(request,env);
  if(!await consume(env.DB,'comment-global','all',limit(env,'MAX_GLOBAL_POSTS_PER_DAY',200,500)))return error('Daily community limit reached',429);
  if(!await consume(env.DB,'comment-product',product.id,limit(env,'MAX_PRODUCT_POSTS_PER_DAY',25,100)))return error('This product has reached its daily limit',429);
  if(!await consume(env.DB,'comment-visitor',key,limit(env,'MAX_VISITOR_POSTS_PER_DAY',5,20)))return error('Daily posting limit reached',429);
  const result=await env.DB.prepare(`INSERT INTO comments(product_id,parent_id,display_name,body,category,status) VALUES(?,?,?,?,?,'approved')`).bind(product.id,fields.parent,fields.name,fields.text,fields.type).run();
  const id=Number(result.meta?.last_row_id||0);
  const manageToken='zrc_c_'+tokenString(32);
  const hash=await sha256hex(manageToken);
  // Token expires after 24h. No user login or email is necessary.
  const expiresAt=new Date(Date.now()+24*60*60*1000).toISOString();
  await env.DB.prepare('INSERT INTO comment_management(comment_id,token_hash,expires_at) VALUES(?,?,?)').bind(id,hash,expiresAt).run();
  return response({ok:true,id,status:'approved',manageToken,manageExpiresAt:expiresAt,message:'Published! Your comment is now visible.'},201);
}
async function reportComment(request,env,verify){
  const body=await readJson(request);const product=await getProduct(env.DB,body.productId);const commentId=numberParam(body.commentId);
  if(!product||product.enabled!==1||!commentId)return error('Product/comment not found',404);
  if(!REPORT_REASONS.has(body.reason))return error('Invalid report reason',422);
  const found=await env.DB.prepare("SELECT id FROM comments WHERE id=? AND product_id=? AND status='approved'").bind(commentId,product.id).first();
  if(!found)return error('Comment not found in this product',404);
  if(!await validTurnstile(body,env,verify))return error('Anti-spam verification failed',403);
  const key=await visitorKey(request,env);
  if(!await consume(env.DB,'report-global','all',limit(env,'MAX_REPORTS_PER_DAY',60,200)))return error('Daily report limit reached',429);
  if(!await consume(env.DB,'report-visitor',key,limit(env,'MAX_VISITOR_REPORTS_PER_DAY',3,10)))return error('Daily report limit reached',429);
  await env.DB.prepare('INSERT INTO reports(product_id,comment_id,reason) VALUES(?,?,?)').bind(product.id,commentId,body.reason).run();
  return response({ok:true,message:'Report received.'},201);
}
async function adminAuth(request,env){
  const header=request.headers.get('Authorization')||'';
  const provided=header.startsWith('Bearer ')?header.slice(7):'';
  if(!provided||provided.length>500||!await constantTimeMatch(provided,env.ADMIN_TOKEN||''))return false;
  return true;
}
async function adminList(db,url){return listModeration(db,url);}
async function adminUpdate(db,id,request){
  const body=await readJson(request);const hasStatus=Object.hasOwn(body,'status'),hasRoadmap=Object.hasOwn(body,'roadmapStatus');
  if(!hasStatus&&!hasRoadmap)return error('No updates provided');
  if(hasStatus&&!STATES.has(body.status))return error('Invalid status');
  if(hasRoadmap&&body.roadmapStatus!==null&&!ROADMAP.has(body.roadmapStatus))return error('Invalid roadmap status');
  const old=await db.prepare('SELECT * FROM comments WHERE id=?').bind(id).first();if(!old)return error('Comment not found',404);
  await db.prepare("UPDATE comments SET status=?,roadmap_status=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
    .bind(hasStatus?body.status:old.status,hasRoadmap?body.roadmapStatus:old.roadmap_status,id).run();
  return response({ok:true});
}
async function adminStats(db){
  const counts=await db.prepare('SELECT status,COUNT(*) AS count FROM comments GROUP BY status').all();
  const reports=await db.prepare("SELECT COUNT(*) AS count FROM reports WHERE status='open'").first();
  const products=await db.prepare('SELECT COUNT(*) AS count FROM products WHERE enabled=1').first();
  return response({counts:counts.results||[],openReports:reports?.count||0,activeProducts:products?.count||0});
}
async function adminReports(db,url){
  const status=url.searchParams.get('status')||'open';if(!['open','resolved','all'].includes(status))return error('Invalid status');
  const p=url.searchParams.get('productId');if(p&&!idValid(p))return error('Invalid product ID');
  const conditions=[],bind=[];if(status!=='all'){conditions.push('r.status=?');bind.push(status);}if(p){conditions.push('r.product_id=?');bind.push(p);}
  const where=conditions.length?'WHERE '+conditions.join(' AND '):'';
  const r=await db.prepare(`SELECT r.*, c.body AS comment_body, c.status AS comment_status FROM reports r LEFT JOIN comments c ON r.comment_id=c.id ${where} ORDER BY r.id DESC LIMIT 60`).bind(...bind).all();
  return response({reports:r.results||[]});
}
async function adminProducts(db){const r=await db.prepare('SELECT id,name,kind,enabled,created_at FROM products ORDER BY name').all();return response({products:r.results||[]});}
async function adminRegister(db,request){
  const body=await readJson(request);const id=body.id,name=cleanText(body.name,100),kind=body.kind||'project';
  if(!idValid(id)||!name||name.length<2||!['project','tool'].includes(kind))return error('Invalid product ID, name or kind',422);
  if(await getProduct(db,id))return error('This product ID is already registered',409);
  await db.prepare('INSERT INTO products(id,name,kind) VALUES(?,?,?)').bind(id,name,kind).run();return response({ok:true,id},201);
}
async function adminUpdateProduct(db,id,request){
  if(!idValid(id))return error('Invalid product ID');const body=await readJson(request);
  if(typeof body.enabled!=='boolean')return error('enabled must be boolean');
  const p=await getProduct(db,id);if(!p)return error('Product not found',404);
  await db.prepare('UPDATE products SET enabled=? WHERE id=?').bind(body.enabled?1:0,id).run();return response({ok:true});
}

/* v0.3 additive features: public onboarding, scoped developer moderation,
   global admin pagination, audit trail and visitor comment management. */
async function sha256hex(value){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function tokenString(bytes=32){
  const raw=new Uint8Array(bytes);crypto.getRandomValues(raw);
  return [...raw].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function requestedOrigin(value){
  if(typeof value!=='string'||value.length>220)return null;
  try{
    const u=new URL(value);
    if(u.protocol!=='https:'||u.username||u.password||u.port||u.pathname!=='/'||u.search||u.hash)return null;
    const host=u.hostname;
    if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.test')||host.endsWith('.example')||!host.includes('.')||host.length>150||!/^[-a-z0-9.]+$/i.test(host))return null;
    if(/^\d+\.\d+\.\d+\.\d+$/.test(host)||host.startsWith('['))return null;
    return u.origin;
  }catch{return null;}
}
function emailValid(value){return typeof value==='string'&&value.length<=200&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);}
function cursorInput(url){const val=url.searchParams.get('cursor');return val?numberParam(val):2147483647;}
function searchTerm(url){const q=url.searchParams.get('q')||'';return q.length<=80?q.trim():null;}
async function listModeration(db,url,ownerId=null){
  const state=url.searchParams.get('status')||'pending';
  if(state!=='all'&&!STATES.has(state))return error('Invalid status');
  const prod=url.searchParams.get('productId');if(prod&&!idValid(prod))return error('Invalid product ID');
  const after=cursorInput(url);if(!after)return error('Invalid cursor');
  const q=searchTerm(url);if(q===null)return error('Search term too long');
  const size=clamp(url.searchParams.get('limit'),40,80),bind=[],where=['c.id < ?'];bind.push(after);
  if(ownerId){where.push('EXISTS (SELECT 1 FROM developer_products dp WHERE dp.product_id=c.product_id AND dp.developer_id=?)');bind.push(ownerId);}
  if(state!=='all'){where.push('c.status=?');bind.push(state);}
  if(prod){where.push('c.product_id=?');bind.push(prod);}
  if(q){where.push('(instr(lower(c.body),lower(?))>0 OR instr(lower(c.display_name),lower(?))>0 OR instr(lower(p.name),lower(?))>0)');bind.push(q,q,q);}
  const r=await db.prepare(`SELECT c.*,p.name AS product_name FROM comments c JOIN products p ON p.id=c.product_id WHERE ${where.join(' AND ')} ORDER BY c.id DESC LIMIT ?`)
    .bind(...bind,size+1).all();
  const items=r.results||[],page=items.slice(0,size);
  return response({comments:page,nextCursor:items.length>size?page.at(-1)?.id:null});
}
async function audit(db,actorType,actorId,action,productId,commentId){
  await db.prepare('INSERT INTO moderation_audit(actor_type,actor_id,action,product_id,comment_id) VALUES(?,?,?,?,?)').bind(actorType,actorId,action,productId,commentId??null).run();
}
async function scopedModerate(db,id,request,actorType,actorId,isDelete){
  const row=await db.prepare('SELECT * FROM comments WHERE id=?').bind(id).first();
  if(!row)return error('Comment not found',404);
  if(actorType==='developer'){
    const own=await db.prepare('SELECT 1 AS yes FROM developer_products WHERE developer_id=? AND product_id=?').bind(actorId,row.product_id).first();
    if(!own)return error('Comment not found',404);
  }
  if(isDelete){
    await db.prepare('DELETE FROM comments WHERE id=?').bind(id).run();
    await audit(db,actorType,actorId,'delete',row.product_id,id);
    return response({ok:true,deleted:1});
  }
  const body=await readJson(request);
  const hasStatus=Object.hasOwn(body,'status'),hasRoadmap=Object.hasOwn(body,'roadmapStatus');
  if(!hasStatus&&!hasRoadmap)return error('No updates provided');
  if(hasStatus&&!STATES.has(body.status))return error('Invalid status');
  if(hasRoadmap&&body.roadmapStatus!==null&&!ROADMAP.has(body.roadmapStatus))return error('Invalid roadmap status');
  await db.prepare("UPDATE comments SET status=?,roadmap_status=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
    .bind(hasStatus?body.status:row.status,hasRoadmap?body.roadmapStatus:row.roadmap_status,id).run();
  await audit(db,actorType,actorId,'moderate',row.product_id,id);
  return response({ok:true});
}
async function userManage(request,env,id,verb){
  const provided=request.headers.get('X-Comment-Token')||'';
  if(!/^zrc_c_[0-9a-f]{64}$/.test(provided))return error('Comment management key required',401);
  const hash=await sha256hex(provided);
  const row=await env.DB.prepare(`SELECT c.*, m.expires_at FROM comments c JOIN comment_management m ON m.comment_id=c.id
      WHERE c.id=? AND m.token_hash=? AND m.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')`).bind(id,hash).first();
  if(!row)return error('Comment not found or key expired',404);
  if(verb==='DELETE'){
    await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(id).run();
    await audit(env.DB,'visitor','anonymous','delete',row.product_id,id);
    return response({ok:true});
  }
  const body=await readJson(request);
  if(body.productId!==row.product_id)return error('Comment not found',404);
  const text=cleanText(body.text,1000);
  if(!text||text.length<8)return error('Comment must be 8 to 1000 characters',422);
  const risk=publicSafetyCheck(text);if(risk)return error(risk,422);
  await env.DB.prepare("UPDATE comments SET body=?,status='approved',roadmap_status=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(text,id).run();
  await audit(env.DB,'visitor','anonymous','edit_published',row.product_id,id);
  return response({ok:true,status:'approved',message:'Your changes are published.'});
}
async function applicationRequest(request,env,verify){
  const b=await readJson(request);
  const name=cleanText(b.name,80),email=cleanText(b.email,200),projectName=cleanText(b.projectName,100);
  const id=b.productId,kind=b.kind||'project',url=requestedOrigin(b.websiteOrigin),purpose=cleanText(b.purpose||'',350);
  if(!name||name.length<2||!emailValid(email)||!projectName||projectName.length<2||!idValid(id)||!['project','tool'].includes(kind)||!url||purpose===null)
    return error('Check name, email, product ID, website (HTTPS root URL), and project details',422);
  if(await getProduct(env.DB,id))return error('This product ID is already registered',409);
  if(!await validTurnstile(b,env,verify))return error('Anti-spam verification failed',403);
  const visitor=await visitorKey(request,env);
  if(!await consume(env.DB,'application-global','all',limit(env,'MAX_APPLICATIONS_PER_DAY',15,50)))return error('Daily request limit reached',429);
  if(!await consume(env.DB,'application-visitor',visitor,limit(env,'MAX_VISITOR_APPLICATIONS_PER_DAY',1,2)))return error('One application per day',429);
  const challenge='zrain-community-verification='+tokenString(16);
  const r=await env.DB.prepare(`INSERT INTO developer_requests(developer_name,email,requested_product_id,requested_product_name,kind,website_origin,purpose,verification_code)
    VALUES(?,?,?,?,?,?,?,?)`).bind(name,email,id,projectName,kind,url,purpose,challenge).run();
  return response({ok:true,requestId:r.meta?.last_row_id,status:'pending',verificationCode:challenge,verificationPath:url+'/.well-known/zrain-community.txt',message:'Place this verification code in the file shown, then contact Zrain for approval. No key is issued until ownership is reviewed.'},201);
}
async function requestsList(db,url){
  const status=url.searchParams.get('status')||'pending';
  if(!['pending','approved','rejected','all'].includes(status))return error('Invalid status');
  const cursor=cursorInput(url);if(!cursor)return error('Invalid cursor');
  const r=await db.prepare(`SELECT * FROM developer_requests WHERE id < ? AND (?='all' OR status=?) ORDER BY id DESC LIMIT 41`).bind(cursor,status,status).all();
  const rows=r.results||[];
  return response({requests:rows.slice(0,40),nextCursor:rows.length>40?rows[39].id:null});
}
async function processRequest(db,id,mode,request){
  const application=await db.prepare('SELECT * FROM developer_requests WHERE id=? AND status=\'pending\'').bind(id).first();
  if(!application)return error('Pending application not found',404);
  if(mode==='reject'){
    await db.prepare("UPDATE developer_requests SET status='rejected',reviewed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND status='pending'").bind(id).run();
    return response({ok:true,status:'rejected'});
  }
  const body=await readJson(request);
  if(body.domainVerified!==true)return error('Confirm independent ownership verification before approval',422);
  if(await getProduct(db,application.requested_product_id))return error('Product ID already exists',409);
  const developerId='dev_'+tokenString(12),token='zrc_dev_'+tokenString(32),hash=await sha256hex(token),prefix=token.slice(0,15);
  if(typeof db.batch!=='function')return error('Atomic DB batch support required',503);
  await db.batch([
    db.prepare('INSERT INTO developers(id,display_name,email,source_request_id) VALUES(?,?,?,?)').bind(developerId,application.developer_name,application.email,id),
    db.prepare('INSERT INTO products(id,name,kind) VALUES(?,?,?)').bind(application.requested_product_id,application.requested_product_name,application.kind),
    db.prepare('INSERT INTO developer_products(developer_id,product_id,website_origin) VALUES(?,?,?)').bind(developerId,application.requested_product_id,application.website_origin),
    db.prepare('INSERT INTO developer_keys(developer_id,key_hash,key_prefix,label) VALUES(?,?,?,?)').bind(developerId,hash,prefix,'Initial key'),
    db.prepare("UPDATE developer_requests SET status='approved',reviewed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND status='pending'").bind(id)
  ]);
  return response({ok:true,developerId,productId:application.requested_product_id,developerKey:token,message:'Show this key once to the verified owner through a secure channel. It cannot be recovered.'},201);
}
async function deleteDeveloperRequest(db,id){
  const found=await db.prepare('SELECT id,status FROM developer_requests WHERE id=?').bind(id).first();
  if(!found)return error('Application not found',404);
  if(typeof db.batch!=='function')return error('Atomic DB batch support required',503);
  await db.batch([
    db.prepare('UPDATE developers SET source_request_id=NULL WHERE source_request_id=?').bind(id),
    db.prepare('DELETE FROM developer_requests WHERE id=?').bind(id)
  ]);
  return response({ok:true,deleted:1});
}
async function adminAudit(db,url){
  const cursor=cursorInput(url);if(!cursor)return error('Invalid cursor');
  const rows=await db.prepare('SELECT id,actor_type,action,product_id,comment_id,created_at FROM moderation_audit WHERE id<? ORDER BY id DESC LIMIT 51').bind(cursor).all();
  const items=rows.results||[];return response({events:items.slice(0,50),nextCursor:items.length>50?items[49].id:null});
}
async function developerIdentity(request,env){
  const raw=request.headers.get('Authorization')||'';
  const token=raw.startsWith('Bearer ')?raw.slice(7):'';
  if(!/^zrc_dev_[0-9a-f]{64}$/.test(token))return null;
  const hash=await sha256hex(token);
  const row=await env.DB.prepare(`SELECT d.id,d.display_name,d.email,d.enabled,k.id AS key_id
    FROM developer_keys k JOIN developers d ON d.id=k.developer_id
    WHERE k.key_hash=? AND k.revoked_at IS NULL AND d.enabled=1`).bind(hash).first();
  return row||null;
}
async function devProductList(db,identity){
  const r=await db.prepare(`SELECT p.id,p.name,p.kind,p.enabled,dp.website_origin FROM developer_products dp JOIN products p ON p.id=dp.product_id WHERE dp.developer_id=? ORDER BY p.name`).bind(identity.id).all();
  return response({developer:{id:identity.id,name:identity.display_name},products:r.results||[]});
}
async function devReports(db,url,identity){
  const product=url.searchParams.get('productId');if(product&&!idValid(product))return error('Invalid product');
  const r=await db.prepare(`SELECT r.*,c.body AS comment_body,c.status AS comment_status
    FROM reports r JOIN developer_products dp ON dp.product_id=r.product_id AND dp.developer_id=?
    LEFT JOIN comments c ON c.id=r.comment_id
    WHERE r.status='open' AND (? IS NULL OR r.product_id=?) ORDER BY r.id DESC LIMIT 60`).bind(identity.id,product||null,product||null).all();
  return response({reports:r.results||[]});
}
async function devResolveReport(db,id,identity){
  const row=await db.prepare('SELECT r.id,r.product_id FROM reports r JOIN developer_products dp ON dp.product_id=r.product_id WHERE r.id=? AND dp.developer_id=?').bind(id,identity.id).first();
  if(!row)return error('Report not found',404);
  await db.prepare("UPDATE reports SET status='resolved' WHERE id=?").bind(id).run();
  return response({ok:true});
}
async function developerKeys(db,identity){
  const r=await db.prepare('SELECT id,key_prefix,label,created_at,revoked_at FROM developer_keys WHERE developer_id=? ORDER BY id DESC LIMIT 20').bind(identity.id).all();
  return response({keys:r.results||[]});
}
async function devRotateKey(db,identity){
  // Rotate the current key atomically; never leave an accidentally active second key.
  const token='zrc_dev_'+tokenString(32),hash=await sha256hex(token);
  if(typeof db.batch!=='function')return error('Atomic DB batch support required',503);
  await db.batch([
    db.prepare('INSERT INTO developer_keys(developer_id,key_hash,key_prefix,label) VALUES(?,?,?,?)').bind(identity.id,hash,token.slice(0,15),'Rotated key'),
    db.prepare("UPDATE developer_keys SET revoked_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND developer_id=? AND revoked_at IS NULL").bind(identity.key_id,identity.id)
  ]);
  return response({ok:true,developerKey:token,message:'Copy and store this new key now. Your old key is no longer valid.'},201);
}

export async function handleRequest(request,env,options={}) {
  const headers=cors(request,env);
  const origin=request.headers.get('Origin');
  const url=new URL(request.url),path=url.pathname.replace(/\/$/,'')||'/';
  const finish=r=>{const h=new Headers(r.headers);for(const [k,v]of Object.entries(headers))h.set(k,v);return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h});};
  if(request.method==='OPTIONS')return new Response(null,{status:origin&&allowedOrigins(env).includes(origin)?204:403,headers:{...headers,'Cache-Control':'no-store'}});
  if(path==='/api/health'&&request.method==='GET')return finish(response({status:'ok',service:'zrain-community',configured:!!env.DB&&secretsReady(env)}));
  if(!env.DB||!secretsReady(env))return finish(error('Community configuration incomplete',503));
  const verify=options.verifyTurnstile||verifySiteverify;
  try {
    if(path==='/api/products'&&request.method==='GET') {
      const r=await env.DB.prepare('SELECT id,name,kind FROM products WHERE enabled=1 ORDER BY name').all();return finish(response({products:r.results||[]},200,{'Cache-Control':'public,max-age=120'}));
    }
    if(path==='/api/comments'&&request.method==='GET')return finish(await publicList(env.DB,url));
    if(path==='/api/comments'&&request.method==='POST'){
      if(!origin||!allowedOrigins(env).includes(origin))return finish(error('Origin not allowed',403));
      return finish(await postComment(request,env,verify));
    }
    if(path==='/api/reports'&&request.method==='POST'){
      if(!origin||!allowedOrigins(env).includes(origin))return finish(error('Origin not allowed',403));
      return finish(await reportComment(request,env,verify));
    }
    // Anonymous users may manage only a comment for which they received a private, short-lived key.
    const own=path.match(/^\/api\/comments\/(\d+)$/);
    if(own&&['PATCH','DELETE'].includes(request.method)){
      if(!origin||!allowedOrigins(env).includes(origin))return finish(error('Origin not allowed',403));
      return finish(await userManage(request,env,numberParam(own[1]),request.method));
    }
    if(path==='/api/developer/applications'&&request.method==='POST'){
      if(!origin||!allowedOrigins(env).includes(origin))return finish(error('Origin not allowed',403));
      return finish(await applicationRequest(request,env,verify));
    }
    if(path.startsWith('/api/admin/')) {
      if(origin&&!allowedOrigins(env).includes(origin))return finish(error('Origin not allowed',403));
      if(!await adminAuth(request,env))return finish(error('Unauthorized',401));
      if(path==='/api/admin/stats'&&request.method==='GET')return finish(await adminStats(env.DB));
      if(path==='/api/admin/comments'&&request.method==='GET')return finish(await adminList(env.DB,url));
      if(path==='/api/admin/reports'&&request.method==='GET')return finish(await adminReports(env.DB,url));
      if(path==='/api/admin/products'&&request.method==='GET')return finish(await adminProducts(env.DB));
      if(path==='/api/admin/products'&&request.method==='POST')return finish(await adminRegister(env.DB,request));
      if(path==='/api/admin/developer-requests'&&request.method==='GET')return finish(await requestsList(env.DB,url));
      if(path==='/api/admin/audit'&&request.method==='GET')return finish(await adminAudit(env.DB,url));
      const requestDelete=path.match(/^\/api\/admin\/developer-requests\/(\d+)$/);
      if(requestDelete&&request.method==='DELETE')return finish(await deleteDeveloperRequest(env.DB,numberParam(requestDelete[1])));
      const app=path.match(/^\/api\/admin\/developer-requests\/(\d+)\/(approve|reject)$/);
      if(app&&request.method==='POST')return finish(await processRequest(env.DB,numberParam(app[1]),app[2],request));
      const cm=path.match(/^\/api\/admin\/comments\/(\d+)$/);
      if(cm&&request.method==='PATCH')return finish(await scopedModerate(env.DB,numberParam(cm[1]),request,'admin','zrain',false));
      if(cm&&request.method==='DELETE')return finish(await scopedModerate(env.DB,numberParam(cm[1]),request,'admin','zrain',true));
      const rm=path.match(/^\/api\/admin\/reports\/(\d+)$/);
      if(rm&&request.method==='PATCH'){
        const body=await readJson(request);if(body.status!=='resolved')return finish(error('Invalid status'));
        await env.DB.prepare("UPDATE reports SET status='resolved' WHERE id=?").bind(Number(rm[1])).run();return finish(response({ok:true}));
      }
      const pm=path.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
      if(pm&&request.method==='PATCH')return finish(await adminUpdateProduct(env.DB,pm[1],request));
    }
    // Developer keys are only for server-side usage and the hosted developer dashboard.
    if(path.startsWith('/api/developer/')) {
      if(origin&&!allowedOrigins(env).includes(origin))return finish(error('Origin not allowed',403));
      const identity=await developerIdentity(request,env);
      if(!identity)return finish(error('Unauthorized',401));
      if(path==='/api/developer/me'&&request.method==='GET')return finish(await devProductList(env.DB,identity));
      if(path==='/api/developer/comments'&&request.method==='GET')return finish(await listModeration(env.DB,url,identity.id));
      if(path==='/api/developer/reports'&&request.method==='GET')return finish(await devReports(env.DB,url,identity));
      if(path==='/api/developer/keys'&&request.method==='GET')return finish(await developerKeys(env.DB,identity));
      if(path==='/api/developer/keys/rotate'&&request.method==='POST')return finish(await devRotateKey(env.DB,identity));
      const cm=path.match(/^\/api\/developer\/comments\/(\d+)$/);
      if(cm&&request.method==='PATCH')return finish(await scopedModerate(env.DB,numberParam(cm[1]),request,'developer',identity.id,false));
      if(cm&&request.method==='DELETE')return finish(await scopedModerate(env.DB,numberParam(cm[1]),request,'developer',identity.id,true));
      const rm=path.match(/^\/api\/developer\/reports\/(\d+)$/);
      if(rm&&request.method==='PATCH'){
        const body=await readJson(request);if(body.status!=='resolved')return finish(error('Invalid status'));
        return finish(await devResolveReport(env.DB,numberParam(rm[1]),identity));
      }
    }
    return finish(error('Not found',404));
  }catch(e){
    if(e instanceof BadRequest)return finish(error(e.message,400));
    // Fail closed; never expose private DB schema/credentials to visitors.
    console.error('Zrain Community API error',e instanceof Error?e.name:'unknown');
    return finish(error('Temporarily unavailable. Please try again later.',503));
  }
}
export default {fetch(request,env){return handleRequest(request,env);}};
