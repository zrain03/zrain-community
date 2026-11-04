/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/developer-onboarding.js
 * BM: Fail Developer onboarding dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Developer onboarding file according to Zrain Community contracts.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id),cfg=window.ZRAIN_COMMUNITY_CONFIG||{},api=String(cfg.apiBase||'').replace(/\/$/,'');
let widget=null,selectedProduct='';
const message=(text,kind='')=>{$('applicationStatus').textContent=text;$('applicationStatus').className='status '+kind;};
const htmlSnippet=id=>`<!-- Zrain Community: ${id} -->\n<script src="https://zrain-community.web.app/embed.js" data-product="${id}" defer></script>`;
async function load(){
 try{
  const r=await fetch(api+'/api/products');const d=await r.json();if(!r.ok)throw Error(d.error||'Catalog unavailable');
  const select=$('productSelect');select.replaceChildren();for(const p of d.products){const o=document.createElement('option');o.textContent=p.name+' ('+p.id+')';o.value=p.id;select.append(o);}
  if(!d.products.length)throw Error('No registered products');
  const change=()=>{selectedProduct=select.value;$('snippet').value=htmlSnippet(selectedProduct);};select.addEventListener('change',change);change();
 }catch(e){$('snippetStatus').textContent='Could not load product list: '+e.message;}
}
$('copySnippet').addEventListener('click',async()=>{if(!selectedProduct)return;try{await navigator.clipboard.writeText($('snippet').value);$('snippetStatus').textContent='Copied. Paste this in your website HTML.';}catch{$('snippetStatus').textContent='Please select the code and copy manually.';}});
$('copyVerification').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('verificationCode').value);}catch{} });
function turnstileToken(){return widget!==null&&window.turnstile?window.turnstile.getResponse(widget):'';}
function initTurnstile(){if(!window.turnstile||!cfg.siteKey)return;widget=window.turnstile.render('#applicationTurnstile',{sitekey:cfg.siteKey,theme:'light'});}
const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=initTurnstile;script.onerror=()=>message('Anti-spam verification is temporarily unavailable.','error');document.head.append(script);
$('applicationForm').addEventListener('submit',async e=>{
 e.preventDefault();const token=turnstileToken();if(!token){message('Complete the Turnstile verification first.','error');return;}
 const body={name:$('devName').value.trim(),email:$('devEmail').value.trim(),projectName:$('devProject').value.trim(),productId:$('devSlug').value.trim(),websiteOrigin:$('devOrigin').value.trim(),kind:$('devKind').value,purpose:$('devPurpose').value.trim(),turnstileToken:token};
 $('submitApplication').disabled=true;message('Sending request...');
 try{
  const r=await fetch(api+'/api/developer/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');
  $('verificationPath').textContent=d.verificationPath;$('verificationCode').value=d.verificationCode;
  $('verificationPanel').classList.remove('hidden');const mail='mailto:zrain.dev@gmail.com?subject='+encodeURIComponent('Zrain Community access request #'+d.requestId)+'&body='+encodeURIComponent('My application ID: '+d.requestId+'\nProduct ID: '+body.productId+'\nVerification URL: '+d.verificationPath+'\nPlease review my website ownership verification.');$('contactApproval').href=mail;
  message('Request received. Follow the verification instructions shown below.','ok');$('verificationPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(err){message(err.message,'error');}finally{$('submitApplication').disabled=false;if(widget!==null&&window.turnstile)window.turnstile.reset(widget);}
});
void load();
})();
