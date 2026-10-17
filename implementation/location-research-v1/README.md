# USA Rockhounding: complete atlas status audit + 100k+ scientific research discovery

Date: October 17, 2026.

**Live site:** https://usarockhounding.com/rockhounding-map/

## Exact on-map inventory (checked from deployed source data)

| Source | Count |
| --- | ---: |
| Packaged 50-state rockhounding atlas | 5,865 |
| WordPress official/operator supplemental records | 7 |
| Already published USGS MRDS mineral-resource research supplement | 11,000 |
| **Total existing listed records** | **16,872** |

### Current classifications (after two operational overrides)

| Status | Number |
| --- | ---: |
| Ready | 189 |
| Conditional | 214 |
| Research only | 14,926 |
| Protected or viewing only | 458 |
| Policy/control reference | 1,085 |
| Total | 16,872 |

These are the **site's current modeled classes**, not newly guaranteed on-the-ground collecting permissions. The original core audit found **3,870 county geology leads** with unresolved parcel ownership, mineral estate and/or collecting authorization. Changing all of them to Ready would knowingly misrepresent the field evidence.

## Downloadable exact inventory

- `audit/location-status/all-displayed-locations-current-status.csv` — each of the 16,872 displayed records, with status, state, name, source, checked_at, blockers and prioritized recheck type.
- `audit/location-status/all-inventory-by-state.csv` — totals by state and collecting status.
- `audit/location-status/all-core-locations-current-status.csv` — only the 5,865 core locations.
- `audit/location-status/state-by-state-status-review.csv` — the 50-state core counts.
- `audit/location-status/current-atlas-audit.json` — transparent aggregate audit, source bucket breakdown, condition/ready audit samples and named official BLM area matching.

**A file's `checked_at` field is its source data's recorded evidence review date, not proof of a fresh October 17 field-manager verification.** The new audit explicitly flags records still needing rechecks; it does not invent permission.

## 100,000+ real USGS records available as on-demand research points

The live USGS MRDS count endpoint reported at least:

| State | USGS MRDS mineral-resource records |
| --- | ---: |
| California | 42,772 |
| Nevada | 15,408 |
| Arizona | 12,944 |
| Montana | 10,274 |
| Colorado | 17,670 |
| Utah | 13,716 |
| **Six-state subtotal** | **112,784** |

These are **mines, deposits, prospects and other mineral-resource occurrences**. They are not 112,784 legally accessible, public, ready-to-collect sites. See the official BLM guidance (https://www.blm.gov/programs/recreation/rockhounding), which explicitly excludes claimed or restricted locations and many other conditions.

The existing map had an 11,000-record snapshot. We added a distinct **opt-in on-demand USGS research layer**:

- `inc/rha-research-window-v1.php`
- `assets/js/rha-research-window-v1.js`
- `assets/css/rha-research-window-v1.css`

The new `GET /wp-json/rha-atlas/v1/research-window` endpoint safely queries USGS MRDS by a small map viewport with a maximum 300 returned occurrences, bounded geographic size, fixed original source host, input validation and transient caching. Users can pan and zoom nationally; no 100,000-element browser render or duplicated fake collecting pins. The existing 11,000-record supplement is deduplicated by USGS record ID in the extra layer.

**Live proof:** a Phoenix-area USGS viewport returned 24 official records, all tagged `research`, such as Sand and Gravel Quarry (historical Past Producer record). Not verified for collecting or access.

## Public-status semantics fix

- `inc/rha-atlas-status-safety-v1.php`
- `assets/js/rha-atlas-status-safety-v1.js`
- `assets/css/rha-atlas-status-safety-v1.css`

Research-only records no longer display directions and plot-public-place controls as though they were verified collecting destinations. Status labels, original records, filters and markers stay intact.

## Live deployment and QA

Theme: `rockhound-atlas`. The two modules are included in its live `functions.php` after the existing MRDS source module. WordPress staging publish made a theme backup. Source is versioned here.

Browser QA in `tests/atlas-research-window.spec.cjs` tests one map, 200/400 API responses, research-only status, no fake Ready entries, visual controls, and suppressed research navigation. GitHub Actions workflow: `.github/workflows/atlas-research-window-check.yml`.

## Remaining status verification work

Exact legal collecting status of **each** of the 16,872 sites has **not** been reverified with managers in this run. The recorded source dates and blockers identify which need review. In particular, a county-level geology marker with unknown parcel ownership should remain Research; a protected site must not be promoted; BLM legal access depends on exact parcel, existing claims, special areas, closures, current rules and specific collection methods. The system is designed to add verified sites over time, without making up 100,000 Ready locations.
