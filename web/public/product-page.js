/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/product-page.js
 * BM: Fail Product page dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Product page file according to Zrain Community contracts.
 */
(()=>{
  'use strict';
  const params=new URLSearchParams(location.search);
  const id=params.get('product')||'';
  const title=document.getElementById('productTitle');
  const desc=document.getElementById('productDesc');
  const fail=document.getElementById('productError');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||id.length>80){
    document.getElementById('communityMount').hidden=true;
    fail.hidden=false;fail.textContent='Invalid product community link.';
    return;
  }
  const nice=id.split('-').map(v=>v.slice(0,1).toUpperCase()+v.slice(1)).join(' ');
  title.replaceChildren(document.createTextNode(nice),(()=>{const x=document.createElement('span');x.className='zrc-accent';x.textContent='.';return x;})());
  document.title=nice+' | Zrain Community';
  desc.textContent=`Thoughts, suggestions and issues for ${nice}. No account required.`;
  // The embed contains the actual shared comments system and its captcha. No fake preview.
  const s=document.createElement('script');s.src='/embed.js';s.dataset.product=id;s.dataset.target='#communityMount';
  document.body.append(s);
  const api=String(window.ZRAIN_COMMUNITY_CONFIG?.apiBase||'').replace(/\/$/,'');
  if(!api.startsWith('https://')&&!['localhost','127.0.0.1'].includes(location.hostname))return;
  fetch(api+'/api/products',{headers:{Accept:'application/json'}})
    .then(r=>r.ok?r.json():null).then(data=>{
      const product=data?.products?.find(x=>x.id===id);
      if(!product)return;
      title.firstChild.textContent=product.name;
      document.title=product.name+' | Zrain Community';
      desc.textContent=`Thoughts, suggestions and issues for ${product.name}. No account required.`;
    }).catch(()=>{});
})();
