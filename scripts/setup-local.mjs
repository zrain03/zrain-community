/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: scripts/setup-local.mjs
 * BM: Fail Setup local dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Setup local file according to Zrain Community contracts.
 */
import {randomBytes} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const p=resolve(root,'worker/.dev.vars');
if(existsSync(p)){console.log('Local secrets already exist; no changes made.');process.exit(0);}
const token=()=>randomBytes(36).toString('hex');
writeFileSync(p,'# LOCAL TEST SECRETS ONLY. Never deploy these.\nTURNSTILE_SECRET=1x0000000000000000000000000000000AA\nADMIN_TOKEN='+token()+'\nABUSE_HASH_KEY='+token()+'\n');
console.log('Created worker/.dev.vars (local only). Open the file to copy ADMIN_TOKEN into the local admin dashboard.');
