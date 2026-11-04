/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/admin-client.js
 * BM: Fail Admin client dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Admin client file according to Zrain Community contracts.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);const cfg=window.ZRAIN_COMMUNITY_CONFIG||{};
const api=String(cfg.apiBase||'').replace(/\/$/,'');let secret='';let products=[];let nextCommentCursor=null;
function el(tag,cl,text){const node=document.createElement(tag);if(cl)node.className=cl;if(text!==undefined)node.textContent=text;return node;}
function message(target,text,fail=false){target.textContent=text;target.className='status '+(fail?'error':'ok');}
async function call(path,options={}){
 const res=await fetch(api+path,{...options,headers:{'Authorization':'Bearer '+secret,'Accept':'application/json',...(options.body?{'Content-Type':'application/json'}:{})}});
 const data=await res.json();if(!res.ok)throw Error(data.error||'Request failed');return data;
}
async function refreshProducts(){
 const data=await call('/api/admin/products');products=data.products;const select=$('productFilter');const selected=select.value;
 select.replaceChildren();const empty=el('option','','All products (admin only)');empty.value='';select.append(empty);
 for(const p of products){const o=el('option','',`${p.name} (${p.id})${p.enabled?'':' · disabled'}`);o.value=p.id;select.append(o);}select.value=selected;
}
function button(label,callback,danger=false){const b=el('button','button'+(danger?' danger':''),label);b.type='button';b.addEventListener('click',async()=>{b.disabled=true;try{await callback();}catch(e){alert(e.message);}finally{b.disabled=false;}});return b;}
async function setStatus(c,status,roadmapStatus){await call('/api/admin/comments/'+c.id,{method:'PATCH',body:JSON.stringify({...(status?{status}:{}),...(roadmapStatus!==undefined?{roadmapStatus}:{})})});await refresh();}
function renderComment(c){
 const box=el('article');box.append(el('small','',`#${c.id} · ${c.product_name} [${c.product_id}] · ${c.status} · ${c.created_at}`));
 const title=el('div','comment-top');title.append(el('strong','',c.display_name),el('span','tag',c.category));box.append(title,el('p','',c.body));
 if(c.parent_id)box.append(el('small','','Reply to #'+c.parent_id));
 const actions=el('div','admin-row-actions');
 if(c.status!=='approved')actions.append(button('Approve',()=>setStatus(c,'approved')));
 if(c.status!=='hidden')actions.append(button('Hide',()=>setStatus(c,'hidden')));
 if(c.status!=='rejected')actions.append(button('Reject',()=>setStatus(c,'rejected')));
 const select=el('select','admin-select');select.setAttribute('aria-label','Roadmap status');
 for(const [v,label]of [['','No roadmap status'],['under_review','Under review'],['planned','Planned'],['implemented','Implemented']]){const o=el('option','',label);o.value=v;select.append(o);}select.value=c.roadmap_status||'';
 actions.append(select,button('Save status',()=>setStatus(c,null,select.value||null)));
 actions.append(button('Delete',async()=>{if(!confirm(`Permanently delete comment #${c.id} and its replies?`))return;await call('/api/admin/comments/'+c.id,{method:'DELETE'});await refresh();},true));
 box.append(actions);return box;
}
async function refresh(append=false){
 const status=$('statusFilter').value,p=$('productFilter').value;
 const query=new URLSearchParams({status,limit:'60'});if(p)query.set('productId',p);const q=$('commentSearch').value.trim();if(q)query.set('q',q);if(append&&nextCommentCursor)query.set('cursor',String(nextCommentCursor));
 const [data,stats]=await Promise.all([call('/api/admin/comments?'+query),call('/api/admin/stats')]);
 const rows=$('commentRows');if(!append)rows.replaceChildren();
 for(const c of data.comments)rows.append(renderComment(c));
 if(!rows.children.length)rows.append(el('div','empty','No comments in this view.'));
 nextCommentCursor=data.nextCursor||null;$('loadMoreComments').classList.toggle('hidden',!nextCommentCursor);
 const count=Object.fromEntries(stats.counts.map(c=>[c.status,c.count]));
 $('summary').textContent=`${stats.activeProducts} products · ${count.pending||0} pending · ${count.approved||0} approved · ${stats.openReports} open reports`;
}
async function refreshReports(){
 const p=$('productFilter').value,q=new URLSearchParams({status:'open'});if(p)q.set('productId',p);
 const data=await call('/api/admin/reports?'+q),rows=$('reportRows');rows.replaceChildren();
 for(const r of data.reports){const box=el('article');box.append(el('small','',`Report #${r.id} · ${r.product_id} · ${r.reason} · comment #${r.comment_id}`));box.append(el('p','',r.comment_body||'[comment deleted]'));box.append(button('Mark resolved',async()=>{await call('/api/admin/reports/'+r.id,{method:'PATCH',body:JSON.stringify({status:'resolved'})});await refreshReports();await refresh();}));rows.append(box);}
 if(!data.reports.length)rows.append(el('div','empty','No open reports.'));
}
async function refreshRequests(){
 const data=await call('/api/admin/developer-requests?status='+encodeURIComponent($('requestStatus').value));
 const mount=$('developerRequestRows');mount.replaceChildren();
 for(const item of data.requests){
  const box=el('article');box.append(el('strong','',item.requested_product_name+' · '+item.requested_product_id));
  box.append(el('p','',`Applicant: ${item.developer_name} · Contact: ${item.email}`));
  box.append(el('p','',`Site: ${item.website_origin} · Type: ${item.kind}`));
  box.append(el('p','',`Reason: ${item.purpose||'Not specified'}`));
  const proof=el('div','');proof.append(el('small','','Expected verification file content: '+item.verification_code));
  const link=el('a','button secondary','Check verification file ↗');link.href=item.website_origin+'/.well-known/zrain-community.txt';link.target='_blank';link.rel='noopener noreferrer';proof.append(link);box.append(proof);
  const actions=el('div','admin-row-actions');
  if(item.status==='pending')actions.append(button('Approve after verifying ownership',async()=>{
   if(!confirm('Have you independently checked the file and its exact verification code on the applicant website?'))return;
   const result=await call('/api/admin/developer-requests/'+item.id+'/approve',{method:'POST',body:JSON.stringify({domainVerified:true})});
   $('issuedKey').value=result.developerKey;$('issuedKeyPanel').classList.remove('hidden');
   alert('Approved. The private key is visible ONCE below. Share it with the verified developer through a secure channel.');
   await refreshRequests();await refreshProducts();
  }));
  if(item.status==='pending')actions.append(button('Reject',async()=>{
   if(!confirm('Reject this access request?'))return;
   await call('/api/admin/developer-requests/'+item.id+'/reject',{method:'POST'});await refreshRequests();
  },true));actions.append(button('Delete application data',async()=>{if(!confirm('Remove this application record? An already approved developer account will remain active.'))return;await call('/api/admin/developer-requests/'+item.id,{method:'DELETE'});await refreshRequests();},true));box.append(actions);mount.append(box);
 }
 if(!data.requests.length)mount.append(el('div','empty','No developer applications in this view.'));
}
$('refreshRequests').addEventListener('click',()=>void refreshRequests());$('requestStatus').addEventListener('change',()=>void refreshRequests());
async function refreshAudit(){const result=await call('/api/admin/audit');const list=$('auditRows');list.replaceChildren();for(const entry of result.events){const box=el('div','',entry.created_at+' · '+entry.actor_type+' · '+entry.action+' · '+entry.product_id+' · #'+entry.comment_id);list.append(box);}if(!result.events.length)list.append(el('div','empty','No moderation activity recorded yet.'));}
$('refreshAudit').addEventListener('click',()=>void refreshAudit());
$('copyIssuedKey').addEventListener('click',async()=>{
 if(!$('issuedKey').value)return;
 try{await navigator.clipboard.writeText($('issuedKey').value);alert('Copied. Keep this key private.');}
 catch{alert('Clipboard unavailable. Select the key using keyboard and copy it before clearing.');}
});
$('clearIssuedKey').addEventListener('click',()=>{$('issuedKey').value='';$('issuedKeyPanel').classList.add('hidden');});
$('loadMoreComments').addEventListener('click',()=>{if(nextCommentCursor)void refresh(true);});
$('commentSearch').addEventListener('change',()=>{nextCommentCursor=null;void refresh();});
async function unlock(){await call('/api/admin/stats');$('loginView').classList.add('hidden');$('dashboard').classList.remove('hidden');$('adminKey').value='';await refreshProducts();await Promise.all([refresh(),refreshReports(),refreshRequests(),refreshAudit()]);}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();secret=$('adminKey').value;try{await unlock();}catch(err){secret='';message($('loginStatus'),err.message,true);}});
$('logout').addEventListener('click',()=>{$('issuedKey').value='';$('issuedKeyPanel').classList.add('hidden');secret='';$('dashboard').classList.add('hidden');$('loginView').classList.remove('hidden');});
$('productFilter').addEventListener('change',()=>{nextCommentCursor=null;void refresh();void refreshReports();});$('statusFilter').addEventListener('change',()=>void refresh());$('refresh').addEventListener('click',()=>void refresh());$('refreshReports').addEventListener('click',()=>void refreshReports());
$('productForm').addEventListener('submit',async e=>{
 e.preventDefault();try{await call('/api/admin/products',{method:'POST',body:JSON.stringify({id:$('newProductId').value.trim(),name:$('newProductName').value.trim(),kind:$('newKind').value})});message($('registerStatus'),'Product registered. Add its embed snippet to the product website.');$('productForm').reset();await refreshProducts();await refresh();}
 catch(err){message($('registerStatus'),err.message,true);}
});
})();
