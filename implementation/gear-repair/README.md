# USA Rockhounding Gear Hub — Production repair (17 October 2026)

Live page: https://usarockhounding.com/gear/

## Live findings
- 128 product cards/images from the existing `usarockhounding-gear-engine` plugin.
- 19 outgoing Amazon search URLs that are *not* direct exact-model product pages.
- 40 Amazon shortened links (39 link.amazon, one amzn.to), whose final destination/associate attribution is not verified from their short URL alone.
- Two visible products use reference/illustrative photography, already distinguished from an exact-package photo.

## What changed in WordPress
Three new files are installed inside the existing `rockhound-atlas` theme:
- `inc/rha-gear-hub-repair-v1.php`
- `assets/js/rha-gear-hub-repair-v1.js`
- `assets/css/rha-gear-hub-repair-v1.css`

Included exactly once in theme `functions.php`:

```php
require_once get_stylesheet_directory() . '/inc/rha-gear-hub-repair-v1.php';
```

This is a **theme compatibility layer**; it does not change the original plugin data or require a second plugin activation. It runs on WordPress page #11580 only.

### Changes
- Makes every product title and product photograph open the card's **existing** Amazon link.
- Does not fabricate product ASINs or overwrite Amazon short links.
- Re-labels search-page links honestly rather than claiming exact product verification.
- Distinguishes shortened URLs without falsely asserting verified Amazon Associates tracking.
- Removes non-Amazon outbound anchors from this page while keeping reference names readable.
- Adds 18-at-a-time progressive catalog browsing, useful quick categories, responsive three/two/one-column product cards, and empty-search feedback.
- Preserves 128 original product records, local photos, the plugin's shop search, category controls, and Gear Finder.
- Adds a readable text response if a local product image fails to load.

### Verification
Automated browser checks in `tests/gear-repair.spec.cjs`:
- Desktop/mobile layout, product links, product photos, search, category filters, and load-more.
- All 128 product image URL responses have correct image MIME types (completed successful GitHub Action).
- Gear Finder workflow and 32 internal guide links have a separate regression check.
- GitHub Actions workflow: `.github/workflows/gear-repair-check.yml`.

## Not yet independently verified
- The actual destinations and Amazon Associates tracking IDs inside the 40 Amazon short redirects. These may legitimately be Amazon links, but the short URL alone does not reveal the tracking ID.
- Two illustrative/reference images are **not** represented as verified photos of exact product packages.
- Browser-side pagination improves browsing but does not provide server-side catalog pagination; the original HTML still contains 128 cards and can be further optimized.

## Rollback
Remove the one theme `require_once` line and deploy the theme backup, if necessary. Do not delete the original `usarockhounding-gear-engine` plugin.
