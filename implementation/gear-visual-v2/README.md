# Gear Hub — visual structure correction (17 October 2026)

Live: https://usarockhounding.com/gear/

## Why it was necessary

Rendered desktop (1440×900) and mobile (390×844) screenshots and element-geometry reports established that this was a **visual page hierarchy problem**, not just affiliate links:

| Observed dimension | Previous | Corrected |
| --- | ---: | ---: |
| Desktop total height | 19,390px | 12,530px (first measured v2 release) |
| Mobile total height | 36,369px | 22,168px (first measured v2 release) |
| Finder position desktop | 12,950px | 969px |
| Finder position mobile | 24,619px | 1,541px |
| First visible cards | 18 | 9 desktop / 6 mobile |
| Main content first pixel desktop | 318px | 89px |
| Main content first pixel mobile | 211px | 78px |

Root cause of top whitespace: `#main` had 86.4px padding on desktop (60.8px mobile) and an empty `.rha-page-heading` block consumed another 100px desktop/46px mobile. The catalog was before both task-navigation cards and the finder, and a large head-to-head comparison block buried the actual shopping grid.

Screenshots before and after were captured in Chromium, not generated artist impressions. Post-fix screenshots are in `qa/screenshots/gear/`.

## Production fixes
- Scoped to WordPress page ID 11580 in existing `rockhound-atlas` theme, no second theme or plugin required.
- Empty page-heading spacer hidden; main top padding reduced and hero compressed.
- Reordered the existing DOM to task-first: introduction → finder → equipment paths → shop → detailed buying checklist → other research tools.
- Collapsed extensive head-to-head comparison content in a semantic `<details>` block, with URL hash expansion.
- First catalog display is 9 products on desktop / 6 on mobile, not all 18.
- Made the first visible photographs eager-load; the original photograph files and merchant destinations remain unchanged.
- Standardized content padding, card density, mobile widths and navigation affordances.
- Rebuilt the hero's five-step journey as one row, not wrapped arrows.
- Retained all 128 underlying product cards, independent product description copy, SEO sources, and links, with the previous Gear Hub v1 fix.

New files:
- `inc/rha-gear-visual-v2.php`
- `assets/js/rha-gear-visual-v2.js`
- `assets/css/rha-gear-visual-v2.css`

The live theme `functions.php` includes once:

```php
require_once get_stylesheet_directory() . '/inc/rha-gear-visual-v2.php';
```

## Testing

GitHub Actions: `.github/workflows/gear-visual-capture.yml`.
- Renders actual 1440px desktop and 390px mobile screenshots.
- Checks early finder position, ordering, zero horizontal overflow, 128 products and progressive counts, coherent step row, functional finder, image-loading and browser errors.
- Archives desktop/mobile PNG/JPEG screenshots in `qa/screenshots/gear/` on the working branch.
- Production WordPress theme backup created during draft publish.

### Boundaries
Two product images remain reference representations. Amazon shortened redirects and exact-ASIN attribution have separate verification work; this structural release does not claim they have been fully validated. The 128 cards are still initially present in HTML and hidden progressively by the browser; server-side pagination is not implemented.
