# Catalog research — what is missing and how to fill it

## Status

The catalog **engine** is complete and tested: visibility rules, lifecycle,
fit scoring, promotion, validation, search, and adopt-into-collection.

The catalog **data** is a 92-record starter set, not the 600 records the brief
asked for, and several fields are deliberately `null`.

## Why fields are null

The brief requires, for all 600 records: a working image URL, verified Kansas /
Kansas-City availability with supporting source URLs, real UPCs, real critic
scores, and a `last_verified` date.

The session that built this had **no outbound network access to any research
host**. Verified directly: producer sites, Total Wine, Wine-Searcher,
UPCitemdb, Open Food Facts and even Wikipedia all fail at the egress proxy.
Only a search tool returning titles and snippets was reachable — no page
content, and no image URLs.

That makes the brief's requirements mutually exclusive with its own rules:

- "every record must have a non-empty `image.primary_url`"
- "do not fabricate Kansas availability / UPCs / ratings"

Producing 600 records with populated image URLs would have meant inventing 600
URLs. That fails silently and expensively — the app shows 600 broken images and
600 unfounded availability claims, all looking authoritative. So those fields
are `null`, and `validateCatalog()` reports them as warnings.

What IS populated is product identity and 0-10 sensory estimates, flagged
`profile_source: "model_estimate"`. Those are modelling inputs, not claims of
measured fact, and they are what drives fit scoring.

## Filling the gap

`validateCatalog(records, { requireImages: true })` enforces the strict rules,
so a researched dataset can be checked before import. The record shape matches
`catalog_record.schema.json`.

Priority order, highest value first:

1. **Images.** Biggest visible improvement. Needs a run with network access that
   can fetch producer/retailer pages and confirm each URL resolves.
2. **Regional availability.** Requires retailer lookups (Total Wine, Lukas,
   Gomer's, Macadoodles). Until then `regional_availability.score` is a
   national-footprint estimate at confidence 0.3 and is explicitly not a Kansas
   claim.
3. **Sensory profiles from real tasting notes**, replacing the estimates. This
   also fixes the calibration issue below.
4. **UPCs**, which would make barcode scanning resolve against the catalog.

## Known calibration issue

With estimate-only profiles, fit scores cluster in the 60-85 band and nothing
reaches the brief's promotion threshold of 88 — so the absolute rule alone
promotes nothing and the catalog stays entirely invisible. `refreshCatalog`
therefore also runs a relative pass (top N per category, floor 72, same
availability floor and the same negative-trait veto) so recommendations exist.

Sharper profiles from real tasting notes should spread the distribution and make
the absolute thresholds meaningful; at that point `topNPerCategory: 0` turns the
relative pass off.

One known miss: Jim Beam Green Label is a stated favourite but scores 62,
because its estimated profile is conservative. That is exactly the kind of error
real tasting data corrects.
