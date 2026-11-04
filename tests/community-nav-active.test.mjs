/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: tests/community-nav-active.test.mjs
 * BM: Fail Community nav active.test dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Community nav active.test file according to Zrain Community contracts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');

test('Zrain UI Golden Reference keeps approved navigation and assets',()=>{
 const index=read('web/public/index.html');
 const admin=read('web/public/admin.html');
 const css=read('web/public/community-nav.css');
 const js=read('web/public/community-nav.js');
 assert.match(index,/href="\/community-nav\.css\?v=20261104"/);
 assert.match(admin,/href="\/community-nav\.css\?v=20261104"/);
 assert.match(index,/src="\/community-nav\.js\?v=20261104"/);
 assert.match(css,/inset 0 -2px 0 #b95136/);
 assert.match(css,/\.main-nav a\[aria-current="location"\]/);
 assert.match(css,/\.main-nav a\[aria-current="page"\]/);
 assert.match(js,/classList\.toggle\('current'/);
 assert.match(js,/setAttribute\('aria-current', 'location'\)/);
 assert.match(admin,/href="\/admin\.html" aria-current="page"/);
 assert.doesNotMatch(admin,/class="mobile-menu"/);
 assert.match(admin,/zrain-ui-config\.js/);
 assert.match(index,/id="communityMount"/);
 assert.match(index,/src="\/embed\.js" data-product="zrain-community"/);
 for(const file of ['web/public/config.js','web/public/community-client.js','web/public/admin-client.js','web/public/brand.css'])assert.ok(existsSync(resolve(root,file)),`Missing existing production asset ${file}`);
});

test('click, scroll and keyboard keep active section exact without selecting the hero',()=>{
 let tops={'how-it-works':650,community:1450,'for-developers':2300};
 const events={};
 const nodes=Object.fromEntries(Object.keys(tops).map(id=>[id,{getBoundingClientRect:()=>({top:tops[id]})}]));
 function fakeLink(href){
  const attrs={href};const classes=new Set();const handlers={};
  return {classes,attrs,handlers,
   getAttribute(name){return attrs[name]??null;},
   setAttribute(name,value){attrs[name]=value;},
   removeAttribute(name){delete attrs[name];},
   classList:{toggle(name,active){if(active)classes.add(name);else classes.delete(name);}},
   addEventListener(name,fn){handlers[name]=fn;}
  };
 }
 const links=Object.keys(tops).map(id=>fakeLink('#'+id));
 const header={getBoundingClientRect:()=>({height:80}),querySelectorAll:()=>links};
 const document={querySelector:()=>header,getElementById:id=>nodes[id]??null};
 const window={addEventListener(name,fn){events[name]=fn;}};
 const sandbox={document,window,requestAnimationFrame:fn=>fn()};
 vm.runInNewContext(read('web/public/community-nav.js'),sandbox);
 const selected=()=>links.filter(a=>a.attrs['aria-current']==='location').map(a=>a.getAttribute('href'));
 assert.deepEqual(selected(),[],'Hero has no false active section');
 tops['how-it-works']=95;events.scroll();
 assert.deepEqual(selected(),['#how-it-works']);
 tops.community=87;events.scroll();
 assert.deepEqual(selected(),['#community']);
 tops['for-developers']=90;events.scroll();
 assert.deepEqual(selected(),['#for-developers']);
 links[1].handlers.click({button:0});
 assert.deepEqual(selected(),['#community'],'Click immediately highlights destination');
 events.wheel();
 assert.deepEqual(selected(),['#for-developers'],'User scrolling overrides pending click immediately');
});
