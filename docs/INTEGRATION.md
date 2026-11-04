<!--
  Pembangun / Developer: Zrain
  Dicipta / Created: Unknown (rekod asal belum disahkan)
  Dikemas kini / Last updated: 2026-11-04
  Fail / File: docs/INTEGRATION.md
  BM: Fail Integration dikekalkan mengikut kontrak Zrain Community.
  EN: Preserve the Integration file according to Zrain Community contracts.
-->
# Zrain Community integration

## 1. Each Zrain entry gets its own ID

Examples:

| Product | ID | Scope |
|---|---|---|
| Zrain Links | `zrain-links` | Only Links comments |
| Zrain Monitor | `zrain-monitor` | Only Monitor comments |
| Guess The Flag | `guess-the-flag` | Web and Android share a game community |
| Zrain Image Converter | `image-converter` | Just Image Converter |
| Zrain PDF Editor | `pdf-editor` | Just PDF Editor |

The first 57 IDs have already been seeded. Zrain Ecosystem and Zrain Community are also registered as public spaces, bringing the total to 59. Future IDs may be created via the secured admin dashboard, without redeploying the Worker. IDs must not be reused for a different product.

## 2. Add to a static HTML site

Inside the site's HTML, **near the end of the main section / below the content**, add:

```html
<section id="zrain-community"></section>
<script src="https://zrain-community.web.app/embed.js" data-product="zrain-links" data-target="#zrain-community" defer></script>
```

Or omit `data-target` and the script automatically inserts its own section after itself. This is the recommended way for the majority of Zrain static tools and Firebase websites.

The script creates an iframe to **`zrain-community.web.app`**, where the form is hosted. Only one Turnstile hostname is needed for this central embed. The parent page exchanges a resize message with the iframe; the parent accepts messages only from the iframe's exact origin and Window object and checks the random instance ID.

On projects using CSP, add `https://zrain-community.web.app` to `frame-src` and `script-src` (for the embed loader); the embedded site's CSP also needs `https://challenges.cloudflare.com` for Turnstile. Confirm actual CSP before release. Do not grant wildcards. This snippet does not require the product to use Cloudflare or Firebase authentication.

## 3. Flutter / Android

For Flutter, a first-phase option is a WebView pointing at:

```text
https://zrain-community.web.app/embed.html?product=guess-the-flag
```

Use the maintained `webview_flutter` package if already present or approved for the app. Flutter Web can use an iframe or HTML view using the same URL. Ensure Turnstile works in your Android WebView and that your Play Store user-generated-content moderation/reporting obligations are met **before** publishing; a WebView may behave differently from Chrome. This package does not yet ship a native Flutter UI component.

## 4. Per-tool pages

The source catalog from the last approved Zrain Ecosystem release contains 48 tools. Add the correct tool ID on **each individual tool detail page**, not just on the Image/PDF/Document/Developer/Productivity family landing pages. `data-products.json` lists the IDs.

## 5. Replacing old feedback

Do not display both feedback widgets simultaneously. Before any replacement, inspect where old feedback lives, export it safely and decide how to handle privacy and moderation. Do not delete or automatically import unverified user content.

## 6. New project checklist

1. Register a unique lowercase ID in Admin.
2. Add the one-line embed to the website, verify it renders and submits (pending moderation).
3. Approve a test message in Admin, confirm it displays only on that product.
4. Verify mobile layout and report flow.
5. Include community in the product's release checklist and Zrain Ecosystem entry.
