/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: scripts/configure-web.mjs
 * BM: Fail Configure web dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Configure web file according to Zrain Community contracts.
 */
import {writeFileSync} from 'node:fs';import {resolve} from 'node:path';
const args=process.argv.slice(2);
const get=name=>{const at=args.indexOf('--'+name);return at>=0?args[at+1]:undefined;};
const api=get('api'),key=get('sitekey');
if(!api||!key){console.error('Usage: node scripts/configure-web.mjs --api https://YOUR-WORKER.workers.dev --sitekey YOUR_SITE_KEY');process.exit(1);}
let parsed;try{parsed=new URL(api);}catch{throw Error('Invalid API URL');}
if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.pathname!=='/'&&parsed.pathname!==''||parsed.search||parsed.hash)throw Error('API must be an HTTPS origin without path/query');
if(!/^[a-zA-Z0-9_-]{12,100}$/.test(key))throw Error('Invalid Turnstile site key');
const dest=resolve(import.meta.dirname,'../web/public/config.js');
const content='// Public config only. Never put secrets here.\nwindow.ZRAIN_COMMUNITY_CONFIG = Object.freeze('+JSON.stringify({apiBase:parsed.origin,siteKey:key},null,2)+');\n';
writeFileSync(dest,content,'utf8');console.log('Wrote public config.js. Remember to run npm run preflight:production.');
