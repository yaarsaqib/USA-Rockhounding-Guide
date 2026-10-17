# Geological Intelligence v4 — true geological polygon filtering

Live: https://usarockhounding.com/rockhounding-map/

## What is implemented

Reuses the national Leaflet `#geoMap` and the individual guides' `#rha-mt-location-map`. No second map, new location pins, or changes to land-access statuses.

- Adds **Filter actual map polygons** within the existing Geology panel.
- Uses **Macrostrat carto MVT** vector tiles from `https://tiles.macrostrat.org/carto/{z}/{x}/{y}.mvt`.
- Uses Leaflet.VectorGrid v1.3.0 pinned bundle (currently loaded from jsDelivr CDN). It is loaded only on map/guide pages.
- The existing **Geological era** and **Rock type** dropdowns now filter the visible geological unit polygons while polygon mode is on, in addition to the v3 inspected-unit list.
- Classification uses numerical ages (`best_t_age`, `best_b_age` and alternate source field names), falling back to named time intervals. Unknown ages and lithologies are not guessed.
- Visual layer is underneath land-status and mining-claim overlays and existing map markers/popup controls, with Leaflet `interactive:false`.
- Below zoom 5, original geology raster stays visible and a message asks visitors to zoom into a state.
- If vector tile loading fails repeatedly, the old geology raster is restored, never left blank.
- Turning off polygon filtering restores the original geology raster's opacity and layer behavior.

## Site implementation

In the existing active `rockhound-atlas` theme:
- `inc/rha-geology-vector-v4.php`
- `assets/js/rha-geology-vector-v4.js`
- `assets/css/rha-geology-vector-v4.css`

Included once in `functions.php`:
```php
require_once get_stylesheet_directory() . '/inc/rha-geology-vector-v4.php';
```

## Source licensing and accuracy

Macrostrat geological data and tiles: CC BY 4.0 with original source references (the existing source citation API provides original map source references when available). Leaflet.VectorGrid package 1.3.0 is published under Beerware licensing. The new feature preserves its third-party notices.

**Important:** Geological polygons represent mapped geologic units, not permission to access, collect specimens, or guarantee mineral finds.

## Validation

- WordPress draft rendered the v4 dependency before original Leaflet map JS on national map, Montana, Alabama and Alaska.
- Each of the four pages retained exactly one original map container.
- Real vector tile browser preflight tested in GitHub Actions: https://github.com/yaarsaqib/USA-Rockhounding-Guide/actions/runs/39031372306
- Full desktop/mobile Chromium live regression workflow: `Geological vector v4 browser checks` in this branch.
- WordPress published to the live theme with backup before running live browser tests.

## Known boundaries

- Does not reclassify the original rockhounding site's field-access trust statuses.
- Geological vector polygons are loaded only in opt-in mode and when zoomed into a state.
- The map layer filters polygons locally in the visitor browser, not on Macrostrat's server.
- This feature deliberately avoids changing other state-guide map designs and their page layout.
