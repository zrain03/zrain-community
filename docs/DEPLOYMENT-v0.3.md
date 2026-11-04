<!--
  Pembangun / Developer: Zrain
  Dicipta / Created: Unknown (rekod asal belum disahkan)
  Dikemas kini / Last updated: 2026-11-04
  Fail / File: docs/DEPLOYMENT-v0.3.md
  BM: Fail Deployment v0.3 dikekalkan mengikut kontrak Zrain Community.
  EN: Preserve the Deployment v0.3 file according to Zrain Community contracts.
-->
# Upgrade production Zrain Community v0.3

This is an **additive upgrade** from the approved v0.2.3 UI.

## Target and resources

- Firebase project and Hosting site: `zrain-community` / `zrain-community`.
- Cloudflare Worker: `zrain-community-api`.
- Existing Cloudflare D1: `zrain-community-db` with binding `DB`.
- Existing Worker secrets: `ADMIN_TOKEN`, `TURNSTILE_SECRET`, `ABUSE_HASH_KEY` (do not rotate unless compromised).
- This upgrade must **not** create a second database, change secrets, or deploy to any other Zrain product.

## Safe sequence

1. Confirm Firebase Spark ($0) and Cloudflare Workers Free. Do not enable paid billing.
2. From a local project copy, run `npm run check` and `npm run preflight:production`.
3. Apply D1 additive migration `0003_developers_and_moderation.sql` to the existing database, using the current UUID already saved in local `worker/wrangler.jsonc`:

   `cd worker && npx wrangler d1 migrations apply zrain-community-db --remote`

4. Deploy Worker with existing bindings/secrets: `npx wrangler deploy`.
5. Confirm `/api/health` returns `configured: true`.
6. Confirm Hosting site and deploy frontend: `cd ../web && firebase hosting:sites:get zrain-community --project zrain-community && firebase deploy --only hosting --project zrain-community`.
7. Open `/admin.html`, `/developers.html`, and `/developer-dashboard.html`, then test with two different products.

### Recommended assisted installer

The release ZIP has `apply-and-deploy.mjs` which performs a safe three-way merge of changed files on top of the existing Windows project (requires `git` command), local tests and checks, migration, Worker deployment, API health check, and Firebase Hosting deployment. The CLI **does not copy** any `.dev.vars`, local database, Worker UUID config, Firebase public site key, or tokens.

```
node apply-and-deploy.mjs --deploy
```

Run it from the **extracted release folder**, not inside the worker folder. It refuses missing prerequisites and will not overwrite unexpected changes when a three-way merge conflicts.

### Required production verification

Perform a real Turnstile request on the published site. Unit tests and `/api/health` do not prove the live challenge works.

- Submit a message to `zrain-community`, approve in admin, verify it appears only there.
- Submit to another product, verify not visible in `zrain-community`.
- In admin choose **All** statuses + **All products**, search a phrase, paginate, delete a targeted test comment.
- Submit external developer application, inspect verification file manually, approve, copy the one-time developer key, and sign in via developer dashboard.
- Verify developer account can only moderate its own product and gets `404` for a different project's comment.
- Verify no uncaught errors on desktop or mobile and no admin/secret key is publicly embedded.

### Rollout to existing products

The 57 product code snippets are in `docs/SNIPPETS-ALL-PRODUCTS.md`. Each product still needs integration and deployment in its own repository. Preserve old feedback data until mapping and migration are checked. Do not deploy product code automatically as part of this upgrade.

### Known boundaries

- Developer applications require **manual ownership verification** and manual secure delivery of keys. Automatic signup/email verification requires an independently verified email delivery solution that remains genuinely no-cost.
- Browser push/email notifications are **not enabled**. No external paid email provider is introduced.
- Native Android/iOS integration requires an app-specific WebView/widget release and user-generated-content moderation review.
- This is a release candidate until production verification is completed by the operator.
