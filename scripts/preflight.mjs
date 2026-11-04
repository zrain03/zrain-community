/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: scripts/preflight.mjs
 * BM: Fail Preflight dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Preflight file according to Zrain Community contracts.
 */
import {readFileSync,existsSync} from 'node:fs';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');const read=p=>readFileSync(resolve(root,p),'utf8');
const prod=process.argv.includes('--production');
const worker=read('worker/wrangler.jsonc'),config=read('web/public/config.js');
const manifest=JSON.parse(read('data-products.json'));const migrations=read('worker/migrations/0002_seed_products.sql');
const ids=new Set(manifest.map(x=>x.id));
if(!existsSync(resolve(root,'worker/migrations/0003_developers_and_moderation.sql')))throw Error('Developer/moderation migration missing');
for(const page of ['developers.html','developer-dashboard.html'])if(!existsSync(resolve(root,'web/public/'+page)))throw Error('Developer page missing: '+page);
if(manifest.length!==59||ids.size!==59||!ids.has('zrain-ai')||!ids.has('zrain-gifts')||!ids.has('zrain-ecosystem')||!ids.has('zrain-community'))throw Error('57 existing products plus Zrain Ecosystem and Zrain Community must be present');
for(const x of manifest){if(!migrations.includes("'"+x.id+"'"))throw Error('Missing seed: '+x.id);}
if(!worker.includes('"name": "zrain-community-api"'))throw Error('Wrong Worker');
if(!worker.includes('"binding": "DB"'))throw Error('Missing DB binding');
if(prod){
 if(worker.includes('localhost')||worker.includes('127.0.0.1'))throw Error('Local origins must not be in the production Worker configuration');
 if(worker.includes('00000000-0000-4000-8000-000000000000'))throw Error('D1 UUID still has the local-only placeholder');
 if(!/database_id"\s*:\s*"[0-9a-f]{8}-[0-9a-f-]{27,36}"/i.test(worker))throw Error('Invalid D1 database UUID');
 if(/127\.0\.0\.1|localhost|1x00000000000000000000AA|REPLACE_ME|devMode/.test(config))throw Error('Production config contains test host or test key');
 if(!/https:\/\/[^"\s]+\.workers\.dev/.test(config))throw Error('Production API URL must be a Cloudflare workers.dev host');
 if(!existsSync(resolve(root,'web/firebase.json'))||!read('web/firebase.json').includes('zrain-community'))throw Error('Wrong Firebase Hosting site');
}
console.log('Zrain Community '+(prod?'production':'source')+' preflight: PASS');
if(prod)console.log('This check does not prove that remote secrets, Firebase ownership or Turnstile validation are configured. Verify those separately before deploying.');
