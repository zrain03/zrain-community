/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/developer-dashboard.js
 * BM: Fail Developer dashboard dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Developer dashboard file according to Zrain Community contracts.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);const cfg=window.ZRAIN_COMMUNITY_CONFIG||{};const api=String(cfg.apiBase||'').replace(/\/$/,'');let key='',cursor=null;
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const action=(label,handler,danger=false)=>{const b=el('button',label);b.type='button';b.className='button'+(danger?' danger':'');b.addEventListener('click',async()=>{b.disabled=true;try{await handler();}catch(e){alert(e.message);}finally{b.disabled=false;}});return b;};
async function req(path,options={}){const r=await fetch(api+path,{...options,headers:{Authorization:'Bearer '+key,...(options.body?{'Content-Type':'application/json'}:{})}});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d;}
async function products(){
 const d=await req('/api/developer/me');$('developerName').textContent=d.developer.name+' · '+d.products.length+' products';const list=$('developerProducts'),sel=$('developerProductFilter');list.replaceChildren();sel.replaceChildren();const all=el('option','All my products');all.value='';sel.append(all);
 for(const p of d.products){const line=el('div');line.className='developer-product';line.append(el('strong',p.name),el('span',' · '+p.id));const o=el('option',p.name);o.value=p.id;sel.append(o);list.append(line);}
}
async function comments(append=false){
 const params=new URLSearchParams({status:$('developerStatusFilter').value,limit:'40'});const p=$('developerProductFilter').value;if(p)params.set('productId',p);if(append&&cursor)params.set('cursor',String(cursor));const d=await req('/api/developer/comments?'+params);
 const mount=$('developerComments');if(!append)mount.replaceChildren();for(const c of d.comments){const box=el('article');box.append(el('small','#'+c.id+' · '+c.product_name+' · '+c.status));box.append(el('p',c.display_name+': '+c.body));const actions=el('div');actions.className='admin-row-actions';
 const change=async fields=>{await req('/api/developer/comments/'+c.id,{method:'PATCH',body:JSON.stringify(fields)});await comments(false);};
 for(const status of ['approved','hidden','rejected']){if(c.status===status)continue;actions.append(action(status==='approved'?'Approve':status==='hidden'?'Hide':'Reject',()=>change({status})));}
 const road=el('select');road.className='admin-select';for(const [v,name] of [['','No roadmap status'],['under_review','Under review'],['planned','Planned'],['implemented','Implemented']]){const o=el('option',name);o.value=v;road.append(o);}road.value=c.roadmap_status||'';actions.append(road,action('Save status',()=>change({roadmapStatus:road.value||null})));
 actions.append(action('Delete',async()=>{if(!confirm('Permanently delete this comment and its replies?'))return;await req('/api/developer/comments/'+c.id,{method:'DELETE'});await comments(false);},true));box.append(actions);mount.append(box);
 }
 if(!mount.children.length)mount.append(el('p','No comments in this view.'));cursor=d.nextCursor;$('developerMore').classList.toggle('hidden',!cursor);
}
async function reports(){const d=await req('/api/developer/reports');const mount=$('developerReports');mount.replaceChildren();for(const r of d.reports){const row=el('article');row.append(el('small','Report #'+r.id+' · '+r.product_id+' · '+r.reason));row.append(el('p',r.comment_body||'Comment no longer exists.'));row.append(action('Resolve report',async()=>{await req('/api/developer/reports/'+r.id,{method:'PATCH',body:JSON.stringify({status:'resolved'})});await reports();}));mount.append(row);}if(!d.reports.length)mount.append(el('p','No open reports.'));}
async function keys(){const d=await req('/api/developer/keys');const m=$('developerKeyList');m.replaceChildren();for(const x of d.keys){m.append(el('div',x.key_prefix+'… · '+x.label+(x.revoked_at?' · revoked':' · active')));}}
async function unlock(){await products();await Promise.all([comments(),reports(),keys()]);$('developerLogin').classList.add('hidden');$('developerArea').classList.remove('hidden');$('developerKey').value='';}
$('developerLoginForm').addEventListener('submit',async e=>{e.preventDefault();key=$('developerKey').value.trim();try{await unlock();}catch(e){$('developerLoginStatus').textContent=e.message;key='';}});
$('developerLock').addEventListener('click',()=>{key='';$('newDeveloperKey').value='';$('newDeveloperKeyPanel').classList.add('hidden');$('developerArea').classList.add('hidden');$('developerLogin').classList.remove('hidden');});
$('developerRefresh').addEventListener('click',()=>void comments(false));$('developerReportsRefresh').addEventListener('click',()=>void reports());$('developerMore').addEventListener('click',()=>{if(cursor)void comments(true);});$('developerProductFilter').addEventListener('change',()=>void comments(false));$('developerStatusFilter').addEventListener('change',()=>void comments(false));
$('rotateDeveloperKey').addEventListener('click',async()=>{if(!confirm('Rotate your current key? Your old key will stop working immediately.'))return;try{const d=await req('/api/developer/keys/rotate',{method:'POST'});key=d.developerKey;$('newDeveloperKey').value=key;$('newDeveloperKeyPanel').classList.remove('hidden');await keys();}catch(e){alert(e.message);}});
$('copyNewDeveloperKey').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('newDeveloperKey').value);alert('Copied. Keep this key private.');}catch{alert('Copy manually before leaving this page.');}});
window.addEventListener('pagehide',()=>{key='';$('newDeveloperKey').value='';});
})();
