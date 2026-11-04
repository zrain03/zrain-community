/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/auto-embed.js
 * BM: Fail Auto embed dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Auto embed file according to Zrain Community contracts.
 */
/** Zrain Community auto-integration for shared site templates.
 * Example: <meta name="zrain-product-id" content="merge-pdf">
 *          <script src="https://zrain-community.web.app/auto-embed.js" defer></script>
 * Never generates a product ID from a guessed URL or registers it automatically. */
(function(){
  'use strict';
  const current=document.currentScript;
  if(!current)return;
  const id=(current.dataset.product||document.querySelector('meta[name="zrain-product-id"]')?.content||document.body?.dataset?.zrainProductId||'').trim();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||id.length>80){console.warn('Zrain Community: add a registered product ID to meta[name="zrain-product-id"]');return;}
  if(document.querySelector('script[data-zrain-auto-loaded="true"]'))return;
  const s=document.createElement('script');
  const source=new URL(current.src,document.baseURI);
  s.src=source.origin+'/embed.js';s.dataset.product=id;
  const target=current.dataset.target;if(target)s.dataset.target=target;
  s.dataset.zrainAutoLoaded='true';s.async=true;
  current.insertAdjacentElement('afterend',s);
})();
