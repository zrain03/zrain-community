<!--
  Pembangun / Developer: Zrain
  Dicipta / Created: Unknown (rekod asal belum disahkan)
  Dikemas kini / Last updated: 2026-11-04
  Fail / File: docs/SECURITY-v0.3.md
  BM: Fail Security v0.3 dikekalkan mengikut kontrak Zrain Community.
  EN: Preserve the Security v0.3 file according to Zrain Community contracts.
-->
# Security notes for Zrain Community v0.3

- Anonymous comments and reports require a server-verified Cloudflare Turnstile token from the approved hosted origin, and are subject to global/product/visitor daily quota counters.
- Product IDs identify conversations, but **do not authenticate developers**. Developer moderation requires a high-entropy key stored as a SHA-256 hash in D1. Every comment/report query and mutation is scoped to developer_products.
- The platform `ADMIN_TOKEN` can moderate and permanently delete comments across every product. Never give this token to external developers.
- Developer request includes personal contact data (name/email). It is visible to admin only. Applications must be cleaned up on a retention schedule; do not retain indefinitely.
- External domain ownership is reviewed by a human using `/.well-known/zrain-community.txt`. App approval is never automatic from a self-reported email or domain.
- Keys are shown once after approval or rotation. There is no key-recovery endpoint. Rotate a compromised key promptly.
- Comment management is granted with a separate per-comment short-lived token (24h), not based on username or IP. Edits return to pending moderation.
- No raw visitor IP is stored. Daily pseudonymous visitor identifiers are HMACed using `ABUSE_HASH_KEY`.
- Admin and developer dashboards keep bearer keys only in browser tab memory. Do not add keys to localStorage, query strings, client-side config, or analytics.
- Public content is rendered using textContent, not innerHTML. No user-provided HTML is accepted.
- `developer_keys` has owner and revocation status; database migration is additive and does not modify historic comments.
- The free tier can be exhausted. Daily quota caps, Turnstile validation and fail-closed errors reduce risk but do not guarantee unlimited traffic. There is no paid API or automatic billing upgrade.
- No email notification, login federation, native Push or automatic import of legacy feedback has been activated.
- Before production launch, perform Chrome/mobile end-to-end tests and independent security review (XSS, CSRF, SSRF, abuse, private key handling, D1 limits).
