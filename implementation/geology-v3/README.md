# Geological Intelligence v3 — age / lithology inspection and source references

**Production:** Deployed on https://usarockhounding.com/ (theme: `rockhound-atlas`)

## Changes
- Visitors can filter mapped rock-unit **inspection results** by geological era (Precambrian, Paleozoic, Mesozoic and Cenozoic) and rock type (sedimentary, igneous, metamorphic and unconsolidated).
- Results with insufficient evidence remain **Unclassified**, rather than receiving speculative age or rock classifications.
- Each inspected unit now includes its original `source_id`, with a button that retrieves and displays the available Macrostrat source-map bibliography.
- Adds read-only, server-side cached `GET /wp-json/rha-geology/v1/source?source_id=133`.
- Includes optional numerical age fields when Macrostrat supplies them.
- Keeps the original national map, location guide maps, status markers, existing popups, BLM land overlays and claims overlays unchanged.

**Important:** The raster geology map itself is **not** filtered by these dropdowns. Filtering applies to the mapped unit descriptions returned when a visitor inspects one point.

## Source files
- `inc/rha-geology-filters-v3.php`
- `assets/js/rha-geology-filters-v3.js`
- `assets/css/rha-geology-filters-v3.css`

Also updates previous `geology-v1` and `geology-v2` files to include source IDs, best numerical age fields and refreshed browser-cache versions.

Install by placing v3 files in the same active theme folders and adding once to the existing theme `functions.php`:

```php
require_once get_stylesheet_directory() . '/inc/rha-geology-filters-v3.php';
```

Do not register it twice. v3 requires v1's point endpoint and v1/v2 map-panel markup.

## Operational safeguards
- Public source endpoint accepts only positive numeric source IDs, queries only the fixed Macrostrat HTTPS host, limits response sizes and caches successful lookup results for seven days.
- Original Macrostrat source citations and license apply (CC BY 4.0).
- Geological map units are **not proof** of collecting permission, accessible specimens, land ownership or site safety.
- Avoid exposing withheld/sensitive exact coordinates in guide-point lookups.
- Advanced thematic vector-tile filtering, comprehensive browser accessibility testing and full 50-state visual testing remain future work.

## Test evidence
- Live national, Montana, Alabama and Alaska pages load v3 assets in script order with one local location map per guide.
- Macrostrat source endpoint returned original source details for IDs 133, 25 and 7.
- Desktop and mobile Chromium Playwright regression: https://github.com/yaarsaqib/USA-Rockhounding-Guide/actions/runs/39029429976 (successful).
