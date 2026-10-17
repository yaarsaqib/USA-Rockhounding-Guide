# Geological Intelligence — Location Guide v2

## Site deployment
Live USA Rockhounding `rockhound-atlas` theme after controlled staging publish.

Three source files:
- `inc/rha-geology-guide-v2.php`
- `assets/js/rha-geology-guide-v2.js`
- `assets/css/rha-geology-guide-v2.css`

Enable once from `functions.php`:

```php
require_once get_stylesheet_directory() . '/inc/rha-geology-guide-v2.php';
```

## How the enhancement works
The theme detects registered state-specific Leaflet location map handles, such as `rha-mt-location-map` and `rha-al-location-map`. It injects a dependency so a small Leaflet `L.Map.addInitHook` bridge executes before the existing map initializer.

The bridge only operates on a map whose container ID is `rha-mt-location-map` inside `rha-mt-location-map-section`. No other map is created. It appends a Geological research control alongside the original controls and a collapsed in-place details panel below the same map.

- Optional Macrostrat geology raster overlay with opacity control.
- Inspect mode: tap map terrain to request mapped rock-unit descriptions from the existing v1 WordPress REST endpoint.
- "Geology at guide point" appears only when the original guide payload has an exact public primary coordinate.
- If a guide intentionally lacks a public primary coordinate, no geology result is fabricated at the guide location.
- User-controlled layer and request cancellation; existing land-status, claims, pin and popup behavior remains owned by its original Leaflet module.

## Access and research separation
Mapped rock formations do not establish mineral finds, legal collecting permissions, public access or specimen availability. Geo tiles and descriptions: Macrostrat (CC BY 4.0); include credit.

## Current validation
- Source JS syntax compiled cleanly.
- Live Alabama guide `/rockhounding-map/alabama/alabama-gold-camp-public-prospecting-program/` serves v2 CSS/JS before original location map script and retains exactly one location map.
- Previous v1 endpoint already returned real US geologic map units, including at Illinois and Montana test coordinates.
- Browser click-flow, mobile, and full state-by-state visual regression suite remain to be tested; do not treat HTML inclusion as proof of visible UI behavior.

## Dependencies
Requires Geological Intelligence Map v1's `/rha-geology/v1/point` REST endpoint and existing original location-guide Leaflet maps.

## Rollback
Remove the single `require_once .../inc/rha-geology-guide-v2.php` line from theme `functions.php`, or restore the backup theme. Leave v1 and current location-map files untouched.
