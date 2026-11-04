<!--
  Pembangun / Developer: Zrain
  Dicipta / Created: Unknown (rekod asal belum disahkan)
  Dikemas kini / Last updated: 2026-11-04
  Fail / File: docs/AI_HANDOFF.md
  BM: Fail Ai handoff dikekalkan mengikut kontrak Zrain Community.
  EN: Preserve the Ai handoff file according to Zrain Community contracts.
-->
# Zrain Community: AI / Developer Handoff

BM: Projek ini ialah sistem Community berpusat untuk komen berasingan mengikut product ID, bukannya identity provider bersama. `worker/src/index.mjs` mengendalikan API dengan Cloudflare D1, sementara `web/public` ialah laman statik Firebase dan iframe embed. Jangan gabungkan database atau authentication dengan projek Zrain lain.

EN: This is a central Community comment service with separate conversations per product ID, not a shared identity provider. `worker/src/index.mjs` handles the Cloudflare D1 API; `web/public` contains the Firebase static site and independently embedded iframe. Do not merge databases or authentication with other Zrain products.

## Critical contracts / Kontrak kritikal

- `data-products.json` and `worker/migrations/0002_seed_products.sql` have synchronized, stable product IDs. Migrations are additive; do not erase migration history.
- `web/public/embed.js` + `web/public/embed.html` are published embeddable contracts used on other sites. Never add global header/footer or change the `data-product` contract without explicit compatibility review.
- Public comment APIs, moderation authorization, developer-scoped keys, admin secrets, anonymous edit tokens, Turnstile checks and quotas are validated by `tests/api.test.mjs`. Do not weaken them for UI changes.
- `web/public/config.js` contains a public API base and a public Turnstile **site** key, not the private verification secret. Worker private secrets stay outside Git and ZIP releases.
- `@zrain/ui` is vendored into `web/public/brand.css` and `web/public/zrain-ui.js` for static hosting. `web/public/zrain-ui-config.js` mounts only header/footer branding. Community's section nav remains controlled by `web/public/community-nav.js`.
- All full HTML pages load the shared assets. `embed.html` deliberately does not load the shared header/footer. Do not break third-party embed sizing or click behavior.
- Zrain UI uses the official logo, credit `Developed by Zrain`, and footer-only tagline `Made for people. Built with purpose.`

## Runbook / Panduan

PowerShell at project root:

```powershell
npm run check
npm run test:ui
npm run preflight:production
```

Developer smoke check: read [`AUDIT-2026-11-04.md`](AUDIT-2026-11-04.md) and the existing [`DEPLOYMENT.md`](DEPLOYMENT.md) before any live operations. With a sibling `zrain-ui` repo, `npm run ui:sync` updates the two vendored UI assets. Review changed files and rerun tests. Never commit `.dev.vars`, local DB snapshots, `.firebase`, `.wrangler` or `node_modules`.

## Known verification boundaries

The supplied ZIP is a source snapshot without reliable creation history for most legacy files. `FILE_PROVENANCE.json` therefore records unverified dates where appropriate. Offline automated tests do not constitute production signoff. Independent live smoke tests and security review remain required for real deployment.
