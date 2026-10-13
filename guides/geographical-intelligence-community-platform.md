# USA Rockhounding — Geographical Intelligence + Community Field Network

## Product goal

Answer the practical question better than generic rockhounding directories:

> Where can I go rockhounding near me, what might I find, how confident is the location, and can I legally collect there?

The atlas should separate **geological evidence**, **map precision**, **land/access authority**, and **community field experience** instead of treating every coordinate as an open collecting site.

## Record model

Every map record should carry:

- permanent record ID
- activity: rockhounding / metal detecting
- country, state/province, county/region
- locality name
- exact coordinate or explicit generalized/context coordinate
- precision class and reason
- materials / geological interest
- manager or evidence authority
- legal/access status: Ready, Conditional, Research, Protected
- status reason
- source URL(s)
- last verification date
- Near Me eligibility
- guide URL
- field-report count
- evidence/history revisions

A mineral occurrence, a public access point, a land boundary, a mining claim, and a legal collecting permission are separate objects and should never be silently merged.

## Map interaction standard

Every marker popup should include:

1. locality name and region
2. trust/access status
3. exact vs context precision
4. material or geological interest
5. coordinates when publishable
6. Google Maps / Apple Maps / OpenStreetMap
7. source / evidence
8. **Full Field Guide & Field Stories**
9. save/favorite action
10. warning that navigation does not create collecting permission

The same behavior should be used on USA, country and Global maps.

## Guide-page system

Every record gets a guide route, even when the record is not yet eligible for a fully promoted SEO page.

A field-ready guide should include:

- quick answer
- what might be found
- collecting/access status
- manager / property context
- coordinates and precision explanation
- source evidence and review date
- geology context
- hazards / field checklist
- Near Me comparison workflow
- related locations
- evidence history
- Public Testimony
- story/photo submission

Released editorial guides stay canonical. Unreleased records can use a dynamic guide until editorial enrichment promotes them.

## Community Field Stories

Each guide has a **Share Your Story & Photos** control.

Submission fields:

- optional display name
- permanent Contributor ID
- visit date
- experience title
- field report
- finds / observations
- access and condition notes
- up to five images

Submissions remain Pending until an administrator approves them. Only approved stories appear in the public testimony section.

Community reports never override official access/legal evidence.

## Permanent contributor identity

Anonymous contributors receive a permanent public ID such as:

`RH-7K4F2Q9M8T`

A private recovery key is stored separately from the public ID. The current browser remembers both, and a contributor can use the same ID + private key on another device.

This avoids requiring a full account while preventing casual impersonation of another contributor ID.

## Contribution reputation

Approved contributions earn points. Suggested badges:

- New Explorer
- Field Reporter
- Trail Contributor
- Trusted Rockhound
- Atlas Scout
- Atlas Steward
- Legendary Contributor

Points can reward useful components such as an approved field report, approved photos, access-condition details and find observations.

A global leaderboard can surface the highest-quality contributors.

Later versions should add **helpfulness votes** and an editor-set reliability score so volume alone does not determine reputation.

## Additional ideas for a stronger geographical intelligence platform

### 1. Evidence history, not just current status

Store every meaningful status revision:

- previous status
- new status
- source
- editor
- date
- reason

A user should be able to see why a location changed from Ready to Conditional or Protected.

### 2. Staleness engine

Automatically place records into a verification queue when:

- source was checked more than N months ago
- manager URL returns an error
- a community story reports a closure or changed fee
- land-manager data changes
- active mining-claim geometry changes near a mapped point

### 3. Community evidence escalation

A field report can flag:

- road closed
- access blocked
- fee changed
- permit now required
- no-collecting sign
- coordinate inaccurate
- manager changed
- seasonal closure

These flags should never directly change legal status. They create an editorial review task.

### 4. Geoprivacy

Sensitive minerals, archaeological contexts, caves, private sites and vulnerable localities should use generalized coordinates even when exact coordinates exist internally.

Public precision and internal precision should be separate fields.

### 5. Duplicate / spatial-cluster detection

Use GIS tooling to identify records that are likely the same locality based on:

- name similarity
- distance
- material similarity
- manager
- source lineage

Do not collapse records automatically; send suspected duplicates to review.

### 6. Geological confidence

Add a geological-evidence score distinct from permission/access confidence.

Example:

- Geological evidence: High
- Coordinate precision: Medium
- Access confidence: Low
- Legal collecting confidence: Unknown

This is far more useful than one overall score.

### 7. Near Me ranking

Rank nearby candidates by more than distance:

`score = distance + access confidence + status + material match + coordinate confidence + freshness + community evidence`

A nearby Research record should not automatically outrank a slightly farther Ready destination.

### 8. Spatial technology path

Current Leaflet implementation is appropriate for the present map.

When the location inventory becomes much larger, a migration path can be:

- MapLibre GL JS for large vector layers
- PostGIS for spatial queries
- vector tiles for map rendering
- QGIS / GRASS GIS for editorial analysis and batch QA

Do not adopt these merely for novelty; move when browser performance or spatial-query complexity justifies it.

## Search intent architecture

Use four principal intent families naturally, not by stuffing:

- **Rockhounding in [location]**
- **Metal Detecting in [location]**
- **Rockhounding Near Me**
- **Metal Detecting Near Me**

A locality page should primarily answer one place-specific intent. Near-Me language belongs in the locator workflow and supporting sections rather than being repeated mechanically.

## Data expansion rule

Import broad public geological datasets into a **Research layer** first.

Promotion to Conditional or Ready requires stronger evidence about:

- current manager
- public access
- mineral rights / active claims
- collecting rule
- current closure state
- coordinate safety

The objective is not simply to claim the largest number of pins. It is to create the largest useful, transparent and field-ready geographical intelligence system.


## Build-ready v1 contracts

The architecture now has concrete repository contracts:

- [Location record JSON Schema](../schemas/location-record.schema.json)
- [Field story JSON Schema](../schemas/field-story.schema.json)
- [Public contributor profile JSON Schema](../schemas/contributor.schema.json)
- [All-record migration rules](../data/README.md)
- [Location guide quality template](location-guide-template.md)
- [WordPress implementation contract](../implementation/wordpress-v1.md)

### Required behavior for every current record

Every current map record must be migrated, assigned a permanent ID and given a stable guide route. Records with incomplete evidence remain available as Research records instead of disappearing.

### Additional open-source scale ideas

Beyond Leaflet/MapLibre/PostGIS/QGIS/GRASS, useful components for later phases include:

- **Supercluster** — fast client/server-side point clustering for very dense marker inventories.
- **PMTiles** — single-file tiled archives that can serve vector layers from static/object storage without maintaining a custom tile server.
- **H3** — hierarchical hexagonal spatial indexing for coverage grids, nearby-cell precomputation, aggregate density and review prioritization.
- **GeoParquet** — portable columnar geospatial snapshots for large analytical/editorial datasets.

These are scaling tools, not substitutes for evidence quality. The authoritative product advantage remains the separation of geology, coordinates, ownership/access, collecting rules, freshness and community observations.
