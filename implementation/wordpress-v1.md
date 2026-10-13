# WordPress implementation contract — Location Intelligence + Community Field Network v1

This document translates the repository record model into a production architecture for USA Rockhounding.

## 1. One record, one permanent identity

Every existing map pin becomes a permanent location record.

Recommended public ID:

`RH-8F3M2K7Q9P`

The ID never changes when a title, coordinate, source, status or guide text changes.

Legacy/unverified pins are imported as `research`, not discarded.

## 2. Storage model

For scale, avoid putting all location/search fields into WordPress postmeta.

Recommended custom tables:

### `wp_rh_locations`

Core public/searchable fields:

- internal numeric key
- permanent `record_id`
- activity
- title
- slug
- country/state/county/locality
- publishable latitude/longitude
- coordinate visibility and precision class
- status
- material summary/index
- access status/confidence
- geological confidence
- last verified
- next review
- near-me eligibility
- sensitive flag

### `wp_rh_location_sources`

One-to-many evidence rows. Each source records the claims it supports.

### `wp_rh_location_history`

Append-only status/evidence history.

### `wp_rh_contributors`

Server-side contributor identity:

- internal key
- public `contributor_id`
- optional display name
- **hashed recovery secret only**
- points
- badge
- approved contribution counters
- reliability state
- created/last-active timestamps

Never store the recovery secret in plaintext.

### `wp_rh_stories`

- story ID
- record ID
- contributor ID
- visit date
- story text
- findings
- access notes
- condition flags
- moderation state
- submitted/reviewed timestamps

### `wp_rh_story_photos`

References approved media and stores captions/alt text/rights attestation.

## 3. Guide routes

Every record gets a route such as:

`/location/[slug]/`

Three publication modes:

- **dynamic** — generated from structured record data
- **editorial** — high-quality long-form guide overrides/enriches the dynamic body
- **protected_stub** — safe information only; exact coordinates withheld

The permanent record ID is the join key so content upgrades never break map links.

## 4. Marker popup contract

A map click opens one stable popup, not a flashing/reopening sequence.

Popup contains:

- title
- state/county
- status badge
- coordinate precision
- materials
- access/collecting status
- last verified
- coordinates when publishable
- map/navigation actions
- **Open Full Guide**
- story count
- **Share Story** shortcut

Do not load the entire guide into the popup.

## 5. Public story submission

The form is embedded on every guide.

### First contribution

The server generates:

- public Contributor ID, e.g. `RC-7K4F2Q9M8T`
- long random private recovery code

The public ID can be displayed. The recovery code is shown once and stored locally for convenience; the server stores only a strong hash.

### Later contribution, same device

The stored ID/recovery token authenticates the contribution automatically.

### Later contribution, new device

The person enters:

- Contributor ID
- recovery code

If valid, the same identity is restored.

A contributor may rotate the recovery code after successful recovery.

## 6. Moderation workflow

Every submission begins as `pending`.

Admin actions:

- approve
- reject
- request review/edit
- mark as potential access/legal change
- flag image-rights problem
- flag spam/abuse

Only approved submissions appear in Public Testimony.

A community condition flag creates an editorial task; it never directly changes the legal/access status of the location.

## 7. Photo handling

Before publication:

- verify file type from content, not filename alone
- set file-size/dimension limits
- generate safe derivative sizes
- strip unnecessary EXIF/location metadata
- require uploader rights attestation
- allow admin rejection per image
- keep original/private moderation metadata separate from the public asset

## 8. Contribution points and badges

Suggested v1 scoring after approval:

- approved field story: +10
- approved useful photo: +2 each, max +10 per story
- useful access/condition report: +5
- confirmed coordinate correction: +8
- source/evidence improvement accepted by editor: +8
- helpfulness milestone/editor quality bonus: +5

Suggested badge thresholds:

- 0: New Explorer
- 25: Field Reporter
- 75: Trail Contributor
- 200: Trusted Rockhound
- 500: Atlas Scout
- 1,000: Atlas Steward
- 2,500: Legendary Contributor

Points are awarded only after moderation. Add per-record/time caps so repeated low-value submissions cannot game the leaderboard.

## 9. Public contributor profile

Route example:

`/contributors/RC-7K4F2Q9M8T/`

Show:

- Contributor ID
- badge
- points
- approved story/photo counts
- optional display name
- approved contributions
- helpfulness score

Do not expose recovery material, email, IP, browser identifiers or moderation notes.

## 10. REST contract

Suggested namespace:

`/wp-json/rh/v1/`

Read endpoints:

- `GET /locations`
- `GET /locations/{record_id}`
- `GET /locations/{record_id}/stories`
- `GET /nearby?lat=&lng=&radius=&material=&status=`
- `GET /contributors/{contributor_id}`

Write endpoints:

- `POST /stories`
- `POST /contributors/create`
- `POST /contributors/recover`
- `POST /contributors/rotate-recovery`
- `POST /location-flags`

Write endpoints require nonce/session controls where applicable, strict rate limiting, validation and anti-spam protections.

## 11. Near Me search

Do not rank by distance only.

A practical ranking model combines:

- distance
- Ready/Conditional/Research status
- access confidence
- collecting-rule confidence
- coordinate confidence
- material match
- verification freshness
- approved community evidence

A slightly farther Ready location should usually beat a very close Research-only pin.

## 12. Spatial architecture

### Current / first deployment

Use Leaflet for map UI, with browser clustering for dense marker sets.

### Scale-up path

Use **Supercluster** for fast point clustering before a full renderer migration.

When data volume/layers outgrow the current approach:

- MapLibre GL JS for WebGL/vector maps
- PMTiles for low-maintenance vector-tile delivery from static/object storage
- PostGIS for radius searches, spatial joins and boundary relationships
- H3 for spatial bucketing, precomputed nearby cells and aggregate heat/coverage analysis
- GeoParquet for portable analytical snapshots/exports
- QGIS/GRASS GIS for editorial spatial QA and duplicate/boundary analysis

Keep map software licensing separate from tile/data licensing.

## 13. Separate evidence layers

Never collapse these into one concept:

- location/collecting record
- mineral occurrence
- geology polygon/unit
- land-management boundary
- mining claim
- protected area
- closure
- legal permission
- community observation

A visitor-facing record can reference these layers, but none automatically proves another.

## 14. Sensitive-location policy

Production may retain exact internal coordinates only when necessary and appropriately protected.

The public API, map, repository exports and page source must contain only:

- exact safe coordinates
- generalized coordinates
- or no coordinates

Do not rely on hiding an exact value with CSS/JavaScript.

## 15. Staleness and review queues

Automatically create review tasks when:

- verification date expires
- source URL fails repeatedly
- approved community story reports a closure/rule change
- manager changes
- location is flagged inaccurate
- nearby land/claim status materially changes

Historical evidence remains visible; a stale source does not prove that a restriction ended.

## 16. High-quality guide enrichment

Use the permanent route from day one.

Editorial enrichment should prioritize:

1. Ready/Conditional records with search demand
2. records near population centers
3. material-specific intent
4. records with strong official/geological evidence
5. records receiving community reports
6. stale/high-risk records requiring clarification

Use the repository's `guides/location-guide-template.md` for each enriched guide.
