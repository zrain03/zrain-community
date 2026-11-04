<!--
  Pembangun / Developer: Zrain
  Dicipta / Created: Unknown (rekod asal belum disahkan)
  Dikemas kini / Last updated: 2026-11-04
  Fail / File: docs/START-HERE-MS.md
  BM: Fail Start here ms dikekalkan mengikut kontrak Zrain Community.
  EN: Preserve the Start here ms file according to Zrain Community contracts.
-->
# Zrain Community untuk semua produk: panduan paling mudah

**Sistem ini telah disediakan untuk 57 entri Zrain sedia ada dan Zrain Community sendiri.** Tetapi setiap website produk masih memerlukan snippet dipasang dan dideploy secara berasingan. Sumber ini tidak mengubah 57 projek tersebut secara automatik.

## Saya pengguna biasa. Macam mana nak komen?

1. Buka mana-mana produk yang sudah dipasang Zrain Community.
2. Scroll ke bahagian **Community**.
3. Isi nama samaran jika mahu, pilih jenis komen, dan tulis pendapat.
4. Selesaikan Turnstile dan tekan **Post comment**.
5. Komen akan disemak dahulu. Tidak perlu akaun atau GitHub.

Jika masih berada pada tab tersebut, anda boleh menyunting atau memadam komen sendiri untuk 24 jam selepas dihantar. Penyuntingan akan dikembalikan ke status menunggu semakan.

## Saya pembangun Zrain. Macam mana tambah pada projek yang sudah wujud?

1. Buka `https://zrain-community.web.app/developers.html`.
2. Pilih produk atau tool sebenar daripada senarai 59 ID semasa.
3. Klik **Copy integration code**.
4. Buka HTML website produk berkenaan. Paste kod sebelum penutup `</body>`.
5. Deploy website produk tersebut mengikut prosesnya sendiri.
6. Hantar satu komen percubaan. Buka admin Community untuk meluluskannya.
7. Sahkan komen itu **tidak** muncul di produk lain.

Tidak perlu API key untuk snippet public embed. Setiap produk mempunyai ruang komen sendiri kerana `data-product` ialah ID unik.

### Contoh khusus untuk tool

```html
<script src="https://zrain-community.web.app/embed.js"
        data-product="merge-pdf" defer></script>
```

Untuk tool lain, tukar `data-product` kepada ID yang wujud dalam senarai. Semua snippet tersedia dalam `SNIPPETS-ALL-PRODUCTS.md`.

### Nak pilih tempat tertentu?

```html
<section id="ruangan-komuniti"></section>
<script src="https://zrain-community.web.app/embed.js"
        data-product="merge-pdf"
        data-target="#ruangan-komuniti" defer></script>
```

### Cara lebih mudah untuk keluarga tools atau laman yang berkongsi template

Dalam HTML setiap tool, letakkan ID unik sekali dalam metadata:

```html
<meta name="zrain-product-id" content="merge-pdf">
```

Kemudian pada template/layout yang digunakan bersama oleh semua tool, tambahkan hanya **satu** skrip ini:

```html
<script src="https://zrain-community.web.app/auto-embed.js" defer></script>
```

Skrip membaca ID daripada metadata halaman, bukan mengagak daripada URL. Setiap tool masih mempunyai perbincangannya sendiri. **Hanya satu daripada `embed.js` atau `auto-embed.js` diperlukan pada satu halaman.**

### Bila buat projek baharu

Jika projek Zrain sendiri, buka Admin, pilih **Register a new Zrain product**, tetapkan ID kekal yang belum digunakan, kemudian gunakan snippet dengan ID tersebut. Nama produk boleh berubah, ID kekal supaya komen lama tidak hilang.

## Saya developer luar Zrain

1. Pergi ke `https://zrain-community.web.app/developers.html`.
2. Isi permohonan: nama, emel hubungan, nama projek, ID unik, hostname HTTPS dan tujuan.
3. Sistem memberi **verification code**. Letakkan teks itu dalam fail `/.well-known/zrain-community.txt` pada website sendiri.
4. Hubungi `zrain.dev@gmail.com` dengan ID permohonan. Pemilik Zrain menyemak fail pada website anda secara manual.
5. Jika diluluskan, admin akan menjana **developer key** yang ditunjukkan sekali sahaja dan memberikan key melalui saluran peribadi yang selamat.
6. Masuk ke `https://zrain-community.web.app/developer-dashboard.html` untuk melihat dan mengurus komen produk **milik anda sahaja**.
7. Gunakan snippet public (tidak memerlukan key) pada laman website sendiri. Jangan letakkan developer key dalam JavaScript, GitHub, screenshot, atau kod aplikasi Android.

**Penting:** Permohonan masih disemak secara manual. Sistem belum menghantar emel secara automatik atau mengesahkan pemilikan domain sendiri. Ini disengajakan supaya pengguna tidak mendapat hak moderasi pada domain orang lain dan supaya tiada API emel berbayar diperlukan.

## Untuk admin Zrain

1. Buka `/admin.html`, masukkan `ADMIN_TOKEN` daripada password manager.
2. Pilih `All products (admin only)` dan status `All` untuk lihat komen semua pengguna merentas semua produk.
3. Guna carian, filter dan butang `Load more comments` jika komen melebihi 60.
4. Pada mana-mana komen, pilih Approve, Hide, Reject, Save status atau **Delete**.
5. Delete memadam komen itu secara kekal, termasuk balasan dan report yang berkaitan. Ia tidak memadam komen produk lain.
6. Bahagian `Developer access requests` memaparkan permohonan developer luar. **Semak sendiri** verification file dan kod sebelum menekan Approve. Developer key ditunjukkan sekali sahaja.
7. Jangan kongsi `ADMIN_TOKEN`. Semua developer luar menggunakan key berasingan yang hanya mengakses produk milik mereka.

## Troubleshooting

- Widget kosong: semak `data-product` wujud dalam katalog Community, dan halaman `embed.html` berfungsi.
- `404 Product not found`: ID belum didaftarkan atau dinyahaktifkan.
- `503 Community configuration incomplete`: Worker belum selesai migrasi atau secrets belum lengkap.
- `403 Anti-spam verification failed`: Turnstile token salah/luput atau hostname tidak sepadan.
- `429`: had harian telah dicapai. Tunggu hari berikutnya, jangan guna paid overage.
- Admin key tidak berfungsi: hanya `ADMIN_TOKEN` Cloudflare Worker yang aktif. Jangan hantar key dalam chat.
- Developer key tidak berfungsi: ia mungkin sudah di-rotate/revoke; hubungi admin untuk bantuan.
- Browser embedded menyekat cookie/storage: sistem komen tidak memerlukan login dan tidak menggunakan third-party cookies.

## Keselamatan dan kos

Sistem menggunakan Cloudflare Worker Free dan D1 dengan kuota aplikasi ketat. Pengguna tidak dibenarkan menambah bil, mengaktifkan Blaze, atau upgrade perkhidmatan berbayar tanpa kelulusan yang jelas. Terdapat operasi semakan manual dan had kapasiti; perkhidmatan bukan tanpa had.

Komen sedia ada dalam sistem feedback produk yang lain tidak dipadam oleh source/upgrade ini. Migrasi komen lama memerlukan salinan data asal dan pemetaan ID produk yang tepat.
