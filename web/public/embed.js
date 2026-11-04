/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/embed.js
 * BM: Fail Embed dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Embed file according to Zrain Community contracts.
 */
/* Drop-in integration for all Zrain products. Runs without bundler or dependencies. */
(function(){
  'use strict';
  const current=document.currentScript;
  if(!current)return;
  const id=(current.dataset.product||'').trim();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||id.length>80){console.error('Zrain Community: invalid data-product');return;}
  const source=new URL(current.src,document.baseURI);
  const base=source.origin;
  const mountId=current.dataset.target;
  let parent=mountId?document.querySelector(mountId):null;
  if(!parent){parent=document.createElement('section');current.insertAdjacentElement('afterend',parent);}
  if(parent.dataset.zrainCommunityMounted==='true')return;
  parent.dataset.zrainCommunityMounted='true';
  parent.style.width='100%';
  const frame=document.createElement('iframe');
  const key='zrain-community-'+(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2));
  frame.title='Zrain Community comments for '+id;
  frame.src=base+'/embed.html?product='+encodeURIComponent(id)+'&instance='+encodeURIComponent(key);
  frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
  frame.style.cssText='display:block;width:100%;height:520px;border:0;background:transparent;';
  frame.setAttribute('allow','');
  parent.append(frame);
  function receive(event){
    if(event.origin!==base||event.source!==frame.contentWindow)return;
    if(event.data?.type!=='zrain-community:height'||event.data.instance!==key)return;
    const height=Number(event.data.height);
    if(Number.isFinite(height)&&height>=260&&height<=20000)frame.style.height=Math.ceil(height)+'px';
  }
  window.addEventListener('message',receive);
  window.addEventListener('pagehide',()=>window.removeEventListener('message',receive),{once:true});
})();
