/**
 * Pembangun / Developer: Zrain
 * Dicipta / Created: 2026-11-04
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: scripts/sync-zrain-ui.mjs
 * BM: Salin aset UI daripada library bersebelahan, tanpa memodifikasi projek lain.
 * EN: Synchronize UI assets from the adjacent shared library without modifying other projects.
 */
import { copyFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

// BM: Secara lalai, semua produk berada di bawah Zrain/Projects; path pilihan boleh dibekalkan.
// EN: Projects normally live under Zrain/Projects; an explicit library path can override it.
const root = resolve(import.meta.dirname, '..');
const library = resolve(process.argv[2] || root, ...(process.argv[2] ? [] : ['..','zrain-ui']));
const files = [
  ['src/brand.css', 'web/public/brand.css'],
  ['src/zrain-ui.js', 'web/public/zrain-ui.js']
];

// BM: Periksa kedua-dua input sebelum menyalin supaya library yang tidak lengkap gagal awal.
// EN: Check both inputs before copying so an incomplete library fails before altering files.
for (const [source] of files) await access(resolve(library, source));
for (const [source, target] of files) await copyFile(resolve(library, source), resolve(root, target));
console.log(`Zrain Community: synchronized ${files.length} UI assets from ${library}.`);
