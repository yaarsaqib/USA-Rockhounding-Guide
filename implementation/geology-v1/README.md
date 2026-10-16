# Geological Intelligence Map v1 — USA Rockhounding

Live target: https://usarockhounding.com/rockhounding-map/

## What ships
- Macrostrat geologic map tiles as an opt-in Leaflet overlay with adjustable opacity.
- An "Inspect rock units" control: click unoccupied terrain for known map formations, ages and lithology.
- Read-only WordPress REST route `GET /wp-json/rha-geology/v1/point?lat=40&lng=-89` that proxies and caches Macrostrat map-unit data for one day.
- CC BY 4.0 attribution and strict separation between geologic occurrences and collecting permission.
- Existing Leaflet pins, trust statuses, popups, location pages and map baselayers are unchanged.

## Live deployment
Source was deployed as files inside the active theme `rockhound-atlas`:
- `inc/rha-geology-v1.php`
- `assets/js/rha-geology-v1.js`
- `assets/css/rha-geology-v1.css`

Add exactly once at the end of theme `functions.php`:

```php
require_once get_stylesheet_directory() . '/inc/rha-geology-v1.php';
```

Do **not** enable this module a second time through a plugin without removing the theme include.

## Integration method
The PHP module loads a Leaflet Map.addInitHook bridge before the existing `rh-map-locations` script by declaring a script dependency. This attaches to the existing `#geoMap`, avoiding a second map and avoiding edits to the `rockhounding-map-explorer` plugin.

## Tested
- The live page includes CSS and JS in dependency-correct order.
- The live REST API at `lat=40&lng=-89` returned mapped Bond Formation and additional geological descriptions.
- JavaScript passed syntax compilation.
- Confirm UI interactions manually across phone and desktop and validate raster tile availability at different zoom levels.

## Data ethics
Mapped units do not prove the presence of collectible specimens, permission to enter, or permission to remove material. Retain original source attribution and respect the CC BY 4.0 terms.

## Next upgrades
Add robust source-map references, lithology age filters, integration with relevant location-guide cards and geo-aware caching/performance instrumentation.
