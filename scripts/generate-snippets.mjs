/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: scripts/generate-snippets.mjs
 * BM: Fail Generate snippets dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Generate snippets file according to Zrain Community contracts.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const entries=JSON.parse(readFileSync(resolve(root,'data-products.json'),'utf8'));
const lines=['<!--','  Pembangun / Developer: Zrain','  Dicipta / Created: Unknown (rekod asal belum disahkan)','  Dikemas kini / Last updated: 2026-11-04','  Fail / File: docs/SNIPPETS-ALL-PRODUCTS.md','  BM: Snippet bagi semua produk; jana semula selepas manifest berubah.','  EN: Product-specific snippets; regenerate after changing the manifest.','-->','','# Community code snippets for existing Zrain products','','Each product has a permanent, independent community ID. Copy the correct snippet into that product website.','Do not paste developer API keys into public HTML.','','## Usage','','1. Find the product in the list below.','2. Paste its snippet into the actual public product HTML near the end, before `</body>`.','3. Publish the product website using its own deployment process.','4. Verify its comments are separate from every other product.','','**Note:** This file is a reference only. It does not modify or deploy the other 57 projects.',''];
for(const p of entries){
 lines.push(`### ${p.name} (${p.id})`,'','```html',`<script src="https://zrain-community.web.app/embed.js" data-product="${p.id}" defer></script>`,'```','');
}
writeFileSync(resolve(root,'docs/SNIPPETS-ALL-PRODUCTS.md'),lines.join('\n'));
console.log(`Generated ${entries.length} unique product snippets.`);
