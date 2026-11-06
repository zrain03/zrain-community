<!--
  Pembangun / Developer: Zrain
  Dicipta / Created: Unknown (rekod asal belum disahkan)
  Dikemas kini / Last updated: 2026-11-06
  Fail / File: README.md
  BM: Fail Readme dikekalkan mengikut kontrak Zrain Community.
  EN: Preserve the Readme file according to Zrain Community contracts.
-->
# Zrain Community v0.3.0

**One community system. Independent conversations for each product.**

Public-facing, account-free community comments for Zrain products and approved external developer sites, on genuinely free Cloudflare Workers/D1 and Firebase Hosting.

Brand: **Zrain**. Footer credit: **Developed by Zrain**. Tagline: **Made for people. Built with purpose.**

## Features

- Every registered product/tool has its own permanent community ID. 59 historical spaces plus 9 newly registered spaces (68 total).
- Anonymous comments, product-specific replies, suggestion/bug/appreciation categories, report buttons, Turnstile and moderation.
- Admin dashboard can review, search, paginate and **permanently delete any user's comment across ALL products**, resolve reports and register more products.
- Anonymous authors can edit or delete a recent comment for 24 hours in the same open embed tab using a separate private one-comment token. Edited content must pass the same automated checks before appearing publicly.
- External developer request form with manual domain proof, admin approval, independently scoped developer keys, key rotation and owner-only moderation dashboard.
- No private developer API key is needed for the ordinary copy/paste public embed. Keys are required only for developer management operations.
- Quotas, safe schema migrations, audit metadata, and safe error handling for zero-cost Free-tier operation.

## Begin here

- Beginner guide in Malay: [`docs/START-HERE-MS.md`](docs/START-HERE-MS.md)
- All 58 code snippets: [`docs/SNIPPETS-ALL-PRODUCTS.md`](docs/SNIPPETS-ALL-PRODUCTS.md)
- Production upgrade: [`docs/DEPLOYMENT-v0.3.md`](docs/DEPLOYMENT-v0.3.md)
- Security and limits: [`docs/SECURITY-v0.3.md`](docs/SECURITY-v0.3.md)
- Existing original docs under `docs/` are retained.

## Zrain UI Golden Reference (2026-11-04)

The official `@zrain/ui` stylesheet and DOM branding module are bundled directly in `web/public/brand.css` and `web/public/zrain-ui.js` for independent Firebase Hosting deployment. All seven full pages mount the same product identity and footer via `web/public/zrain-ui-config.js`. The separate embed iframe is intentionally untouched. The original Community menu owns its section tracking, so the hero has no false selection; touch and keyboard navigation remain available on small screens.

Use `npm run test:ui` for the dedicated integration assertions. With `Zrain/Projects/zrain-ui` installed alongside this project, `npm run ui:sync` refreshes the vendored CSS and JS, after which `npm run check` should be repeated. See [`docs/AUDIT-2026-11-04.md`](docs/AUDIT-2026-11-04.md), [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md) and [`FILE_PROVENANCE.json`](FILE_PROVENANCE.json) for traceability and verification limits. No Worker API, D1 migration or data-contract change is included in the UI repair.

## Source layout

- `worker/src/index.mjs`: Cloudflare Worker API.
- `worker/migrations/0003_developers_and_moderation.sql`: additive D1 migration for developer ownership, keys, audit, and anonymous comment management.
- `web/public/index.html`: approved Zrain Community v0.2.3 landing with header active state.
- `web/public/admin.html`: global admin moderation.
- `web/public/developers.html`: beginner-friendly integration wizard and external access request form.
- `web/public/developer-dashboard.html`: isolated dashboard for approved developers.
- `web/public/embed.js`: zero-dependency drop-in widget used by each product.
- `web/public/auto-embed.js`: shared-template helper; reads the product ID from a page meta tag, useful for families of tools.
- `scripts/generate-snippets.mjs`: regenerate code snippet documentation whenever the approved product manifest changes.

## Local development

Node.js >=22. From the root:

```powershell
npm run check
npm run dev:setup
npm run dev:api:offline
```

In a second terminal:

```powershell
npm run dev:web
```

Open `http://127.0.0.1:8767` (website), `http://127.0.0.1:8767/admin.html` (platform admin), `http://127.0.0.1:8767/developers.html` (onboarding), `http://127.0.0.1:8767/developer-dashboard.html` (scoped developer access). Port 8787 is **the API only**, so its `/` path returns 404. The local server simulates Turnstile; it is **not proof of production anti-spam verification**.

## Production

Use the release upgrade installer and follow the controlled sequence in `docs/DEPLOYMENT-v0.3.md`. Keep the existing D1 database ID, ADMIN_TOKEN, TURNSTILE_SECRET, ABUSE_HASH_KEY and public config unchanged. Never deploy the local `.dev.vars` file.

The source package itself **does not deploy or install anything**. Changes to live infrastructure occur only when the operator runs the release deployment commands with their own authenticated CLI.

## Boundaries / truthful status

- Implementation and local automated tests are complete for the functionality included, but cloud production verification is still required after migration and rollout.
- **Manual approval** is required for external developer registration, including independent domain ownership verification and private one-time key delivery. Fully automated signup/email verification is not enabled.
- Automatic email or push notifications are not enabled, as they require separate provider and abuse/sender verification decisions.
- The 57 already-existing product websites are **not automatically modified** by this release. To roll out, copy their matching snippets and deploy each product separately after a tested migration. Historical GitHub-based comments stay untouched until a separate data migration is checked.
- This is a reusable API and hosted widget, not a guarantee of unlimited free quotas or zero abuse risk.
