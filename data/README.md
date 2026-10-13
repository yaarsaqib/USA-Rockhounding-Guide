# Location record migration and publication rules

## Non-negotiable migration rule

Every existing USA Rockhounding location/pin should receive a permanent `record_id` and enter the unified record system.

Do **not** delete a location merely because its evidence is weak.

Instead:

- verified and field-ready locations -> `ready`
- usable but condition-dependent locations -> `conditional`
- incomplete, legacy or weak-evidence locations -> `research`
- sensitive/no-collecting locations that must remain discoverable for safety/context -> `protected`

Every migrated record receives a stable guide route. Records without a full editorial article use a dynamic guide until they are enriched.

## Identity

A record ID is permanent. Title changes, source changes, coordinate corrections and status changes must not create a new ID unless the old record was proven to represent a different physical locality.

## Coordinate policy

Public data may contain only coordinates safe to publish.

Never place hidden exact coordinates for sensitive/private/vulnerable localities in this public repository. Store those only in access-controlled production storage.

## Minimum import fields

A legacy record may enter the system with:

- permanent record ID
- title/locality
- state/region
- public coordinate or explicit withheld/generalized state
- status = `research`
- at least one source/evidence lineage reference, even if that reference is only the legacy dataset
- last verification timestamp
- stable guide slug

Incomplete records remain visible but clearly marked for editorial review.

## Deduplication

Do not automatically merge suspected duplicates. Generate a review candidate when locality name, distance, materials and source lineage indicate a likely duplicate.

## Promotion

A record may move from Research to Conditional/Ready only when the editorial system has enough evidence for the specific claims being promoted: location, manager/ownership, access, collecting rule, material/geological evidence and current closure state.

Community reports can trigger review but never directly promote or downgrade legal status.
