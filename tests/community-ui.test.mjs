/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: tests/community-ui.test.mjs
 * BM: Fail Community ui.test dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Community ui.test file according to Zrain Community contracts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=(file)=>readFileSync(resolve(root,file),'utf8');
const home=read('web/public/index.html');
const admin=read('web/public/admin.html');
const css=read('web/public/community.css');

test('Community home and admin use the shared shell',()=>{
 for(const html of [home,admin]){
  assert.match(html, /<script defer src="https:\/\/zrain\.web\.app\/ui\/v2\/layout\.js" data-product="zrain-community"/);
 }
 assert.match(home,/data-native/);
 assert.match(admin,/data-zrain-content/);
});
test('Community feedback uses the real product embed',()=>{
 assert.match(home,/frame\.src=origin\+'\/embed\.html\?product='/);
 assert.match(home,/communityId:'zrain-community'/);
 assert.doesNotMatch(home,/frame\.srcdoc\s*=/);
 assert.match(home,/location\.hash==='#community'/);
});
test('No named product comparison appears in public landing',()=>{
 assert.doesNotMatch(home,/Zrain Links|Zrain Monitor/i);
});
test('Buttons and navigation deliberately suppress default underlines',()=>{
 assert.match(css,/body\.community-site a \{ text-decoration:none; \}/);
 assert.match(css,/body\.community-site \.button \{[^}]*text-decoration:none/);
});
test('Admin exposes one mount for the shared footer and no legacy logo',()=>{
 assert.ok(existsSync(resolve(root,'web/public/brand.css')));
 assert.equal((admin.match(/<footer data-zrain-footer>/g)||[]).length,1);
 assert.doesNotMatch(admin,/<img class="zrain-footer__logo"/);
});
test('Original admin selectors and configuration scripts remain accessible',()=>{
 for(const id of ['loginView','loginForm','adminKey','loginStatus','dashboard','summary','logout','productFilter','statusFilter','commentRows','refresh','reportRows','refreshReports','productForm','newProductId','newProductName','newKind','registerStatus']){
  assert.ok(admin.includes(`id="${id}"`),`Missing admin ID ${id}`);
 }
 assert.match(admin,/src="\/config\.js"/);
 assert.match(admin,/src="\/admin-client\.js"/);
});
test('Mobile and keyboard accessibility are included',()=>{
 assert.match(admin,/class="skip-link"/);
 assert.match(home,/class="community-skip" href="#zrain-product-content"/);
 assert.ok(home.includes("progress.setAttribute('aria-label','Page progress')"));
 assert.match(read('web/public/community-nav.css'),/overflow-x: auto/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

// English stays active even for visitors with an older saved language preference.
test('native pages use English without a language switch',()=>{
 for(const name of ['index.html','guidelines.html','privacy.html']) {
  const page=read('web/public/'+name);
  assert.doesNotMatch(page,/const langButton = element\(doc,'button','zr-lang-switch'\)/);
  assert.doesNotMatch(page,/localStorage\?\.getItem\('zrain-language'\)==='bm'/);
  assert.match(page,/function setLanguage\(value\)\{\s*language='en';/);
  assert.match(page,/function refreshLanguage\(\)\{language='en';/);
 }
});

// The English view data is self-contained; obsolete BM dictionaries cannot change it.
test('native views retain English content without Malay dictionaries',()=>{
 for(const name of ['index.html','guidelines.html','privacy.html']) {
  const page=read('web/public/'+name);
  const start=page.indexOf('const defaultViews = ['),end=page.indexOf('const localize=',start);
  assert.ok(start>=0 && end>start,name);
  const block=page.slice(start,end);
  assert.doesNotMatch(block,/\b(?:bm|labelBM):/);
  const data=new Function(block+';return {defaultViews,feedbackView}')();
  assert.equal(data.defaultViews[0].eyebrow.en,'01 / WHAT ZRAIN UI DOES');
  assert.equal(data.feedbackView.label,'Feedback');
  if(name==='index.html') {
   const a=page.indexOf('const communityViews='),b=page.indexOf('const ui=mountZrainCompact',a);
   assert.ok(a>=0 && b>a);const own=page.slice(a,b);
   assert.doesNotMatch(own,/\b(?:bm|labelBM):/);
   const views=new Function(own+';return communityViews')();
   assert.equal(views[0].headline[0].en,'Every thought matters.');
  }
 }
});

// The embedded game keeps the same English output for old two-argument callers.
test('embedded game translation compatibility returns English',()=>{
 for(const name of ['index.html','guidelines.html','privacy.html']) {
  const declaration=read('web/public/'+name).match(/const tr=\(en\)=>en;/)?.[0];
  assert.ok(declaration,name);
  const translate=new Function(declaration+';return tr')();
  assert.equal(translate('Buttons: ','Butang: '),'Buttons: ');
 }
});

// Legacy language requests cannot change visible contact labels away from English.
test('contact labels remain English for legacy BM requests',()=>{
 for(const path of ["web/public/index.html","web/public/guidelines.html","web/public/privacy.html"]) {
  const source=read(path);
  const declaration=source.match(/const setLanguage=lang=>\{mail\.querySelector\('strong'\)[^\r\n]+?\};/)?.[0];
  assert.ok(declaration,path);
  const fields={mail:{},community:{},small:{},attrs:{}};const mail={querySelector(){return fields.mail}};const community={querySelector(selector){return selector==='strong'?fields.community:fields.small},setAttribute(k,v){fields.attrs[k]=v}};const change=new Function('mail','community',declaration+';return setLanguage')(mail,community);change('bm');assert.equal(fields.mail.textContent,'Email');assert.equal(fields.community.textContent,'Community');assert.equal(fields.small.textContent,'Leave a note');assert.equal(fields.attrs['aria-label'],'Open product Community');
 }
});

// Embedded feedback must shrink when its contents shrink, even if the iframe was taller.
test('feedback resize follows content height and can shrink',()=>{
 const source=read('web/public/community-client.js');
 const declaration='function resize(){'+source.split('function resize(){')[1].split(String.fromCharCode(10))[0].trim();
 let bottom=900;const sent=[];const parent={postMessage(message){sent.push(message)}};const win={parent,scrollY:0};const content={getBoundingClientRect(){return {bottom}}};
 const resize=new Function('instance','window','resizeContent',declaration+';return resize')('example',win,content);
 resize();bottom=380;resize();assert.equal(sent[0].height,908);assert.equal(sent[1].height,388);assert.equal(sent[1].instance,'example');
});
