<!--
  Pembangun / Developer: Zrain
  Dicipta / Created: Unknown (rekod asal belum disahkan)
  Dikemas kini / Last updated: 2026-11-04
  Fail / File: docs/DEPLOYMENT.md
  BM: Fail Deployment dikekalkan mengikut kontrak Zrain Community.
  EN: Preserve the Deployment file according to Zrain Community contracts.
-->
# Deploy Zrain Community (Spark / Cloudflare free tiers)

Production has NOT been deployed by the package creator. Create resources and check official Free / Spark entitlements first.

## A. Cloudflare D1 and Worker

1. In `worker`, install dependencies: `npm install`.
2. Login: `npx wrangler login`. Check the account (`npx wrangler whoami`) and Free plan.
3. Create the D1 database: `npx wrangler d1 create zrain-community-db`.
4. Copy the returned database UUID into **`worker/wrangler.jsonc`** in place of the local-only UUID `00000000-0000-4000-8000-000000000000`. Keep the binding exactly `DB`.
5. Run database migrations: `npx wrangler d1 migrations apply zrain-community-db --remote`. This seeds all 59 product IDs.
6. In Cloudflare Turnstile create a **real managed widget** for hostname `zrain-community.web.app`. Copy its public site key; keep the secret private. No `Any Hostname` needed because all embeds run on the community hostname.
7. Create three different 48+-character random secrets, using e.g. `node -e "console.log(require('node:crypto').randomBytes(36).toString('hex'))"`. Keep them in a password manager, not a text file or Git.
8. Set secrets individually using `npx wrangler secret put TURNSTILE_SECRET`, `npx wrangler secret put ADMIN_TOKEN`, `npx wrangler secret put ABUSE_HASH_KEY`. Paste the secret when Wrangler prompts. Do not use test keys.
9. Check `TURNSTILE_HOSTNAME=zrain-community.web.app`, `ALLOWED_ORIGINS`, all daily caps and `workers_dev=true` in `worker/wrangler.jsonc`.
10. `npx wrangler deploy` from `worker/` after the production preflight passes. Check `https://zrain-community-api.zrain-dev.workers.dev/api/health` returns `configured:true` before allowing public traffic. If the domain differs, use the actual deployed Worker origin consistently in the web config.

## B. Firebase Hosting for the embed and docs

1. Use **a separate Spark Firebase project** called `zrain-community` if available. Do not confuse it with the existing `zrain-ecosystem` project. Set up Hosting so the site ID is `zrain-community`.
2. Configure `web/public/config.js` from the project root with:

```powershell
node scripts/configure-web.mjs --api https://zrain-community-api.zrain-dev.workers.dev --sitekey YOUR_REAL_SITE_KEY
```

3. Verify **`npm run check`** and **`npm run preflight:production`**. The production preflight explicitly rejects local API/test site keys and a missing D1 UUID. It cannot validate remote secrets: also inspect Cloudflare and the health endpoint.
4. From `web/` run `firebase hosting:sites:get zrain-community --project zrain-community`. Confirm the correct site **before deploying**.
5. From `web/` run `firebase deploy --only hosting --project zrain-community`.
6. Open `https://zrain-community.web.app` and verify iframe loads, comment goes to pending, admin can approve and public can see it; verify Turnstile hostname and Siteverify production success.

## C. Rollout safety

Only after the above E2E test passes, integrate into the **57 existing** public product/tool pages. Test Zrain Links versus Zrain Monitor isolation before rollout. Keep existing feedback in place until the migration strategy is approved, and introduce a common Community section instead of double feedback. Never deploy to any other Zrain Firebase project by default.

### Costs and limits

Cloudflare Workers Free provides 100,000 daily requests per account; free tier also hard-limits D1 daily row reads and writes. This app's maximum 200 comments and 60 reports per day are lower, but these settings do not measure all account usage. Monitor D1 and Workers analytics, and avoid any plan upgrade or billable payment method. Use Cloudflare's production Turnstile credentials, not its documented dummy test keys.
