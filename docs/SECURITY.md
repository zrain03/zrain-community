<!--
  Pembangun / Developer: Zrain
  Dicipta / Created: Unknown (rekod asal belum disahkan)
  Dikemas kini / Last updated: 2026-11-04
  Fail / File: docs/SECURITY.md
  BM: Fail Security dikekalkan mengikut kontrak Zrain Community.
  EN: Preserve the Security file according to Zrain Community contracts.
-->
# Moderation and privacy notes

- No registration and no email address required. Name and comment text are user-provided content; public display uses `textContent` only.
- Only moderated `approved` comments appear in the public API. `pending`, `hidden`, `rejected` and reports are admin-only.
- 1-level replies only, to an approved root comment **within the same product**. Server-side `product_id` check rejects cross-product reply attempts.
- Reports are not publicly enumerable. The report API also verifies comment ownership and Turnstile.
- Write limits: 200 comments daily globally, 25/product daily, 5/visitor daily; reports 60 globally, 3/visitor daily. These may be changed lower in the Worker config.
- Anonymous abuse throttling stores HMAC(day, Cloudflare-Connecting-IP) values in quota counters, **not raw IPs**; daily identifiers are unlinkable across days if the HMAC key remains secret.
- Do not send sensitive personal information, contact details, files or tokens in comments. Admin should remove such data and enforce clear community guidelines.
- Admin dashboard accepts the secret in an input and keeps it **only in memory**. It never persists credentials in localStorage, cookies or URLs. Use HTTPS and protect the admin password.
- The API permits CORS only from the central community-hosting origin and configured local development origins. **CORS is not authentication.** For admin calls, the backend always validates its secret; for public writes it always verifies Turnstile.
- Turnstile siteverify hostname is validated on the server. Production mode disables Cloudflare dummy test secret.
- Worker fails closed if the admin token, HMAC key or Turnstile secret is missing or short. D1 limits also fail rather than charging if the account is Free.
- Admin content deletion is permanent; make a legitimate backup/export plan before mass moderation changes. The initial version has no comment editing, automatic anti-spam ML classification, appeals, in-browser block user or ban-by-user-ID because there are no login accounts. For abuse spikes disable registration or writes at the edge.
- To meet app-store policies for user-generated content, implement an enforceable moderation and reporting policy, with staff checks and blocking requirements as applicable, before launching in Android apps.
