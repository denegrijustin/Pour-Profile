# Pour Profile — Lady and JDAD

Track bourbon, wine, tequila, rum and scotch with a personal, persistent pour profile for Lady or JDAD. Every pour has an overall 0–10 rating and ten category-specific sensory questions. Each question records an observed intensity (0–10) and enjoyment (1–5); skipped questions stay unknown. Select the variety/style to strengthen matching within the same type.

The Profile tab shows category counts, average ratings and enjoyed flavor levels across all categories. Discover ranks the reference catalog using the selected person's actual preferences. Photo recommendations identify up to 30 readable bottles in a single-bottle or shelf photo, then rank them against that person's taste evidence. Same-category evidence is stronger than shared flavor carryover from other categories; disliked intensities reduce matches. Unknown flavors remain unscored. Photos and estimated bottle descriptors never become tasting answers automatically.

## Deployment of this upgrade

1. Back up the existing D1 database using Cloudflare D1 Time Travel/export.
2. Apply **only** `migrations/0010_full_pour_profiles.sql` to the existing database. It preserves profile IDs, tastings, statuses and wine preferences. JDAD keeps profile 1; Lady keeps profile 2. Old `spirits`, `wine` and `justin` client values are mapped to their corresponding person.
3. Set the existing Worker's `OPENAI_API_KEY` secret (for optional AI/photo features) to enable photo analysis. This key is server-side only. Image analysis uses the OpenAI Responses API with `store: false`; images are not persisted in D1/R2 by this feature. Photos require internet connectivity and can be sent to OpenAI when requested from Discover.
4. Run `npm install`, `npm test`, `npm run build`, then `npx wrangler deploy`. The GitHub-connected production build can deploy the code after the migration is applied.

Offline tasting queues retain the original person and request ID, so switching profiles cannot change attribution and retries do not duplicate a saved pour. Existing questionnaires are stored with their version and visible in the bottle timeline and pour history. Unknown profile slugs and attempts to edit another person's tasting are rejected. The person switcher is for this shared household app; it is not an authentication system.

Tests include database migration preservation, five-category persistence, person isolation, retry deduplication, cross-category scoring, invalid sensory data, and mocked multi-bottle photo analysis. A real photo smoke test additionally requires the production AI secret and a bottle/shelf photo.

---

The original architecture and historical notes follow. Their earlier family-based profile descriptions have been superseded by this upgrade.

# Pour Decisions

A personal bourbon and spirits tracker: log every pour, learn your palate, and get
explainable recommendations on what to try or buy next. Built as a mobile-first
Cloudflare Workers app (no build tooling required beyond a `cp` step).

> The previous life of this repository — a family road-trip companion for Upper
> Michigan — is preserved on the `archive/michigan-trip-2026` branch.

## Architecture

- **Frontend**: vanilla JS ES modules, no bundler. `index.html` + `styles.css` +
  a set of `view-*.js` modules wired together by `app.js`. Served as static
  assets by Cloudflare Workers.
- **Backend**: `worker.js`, a single Cloudflare Worker that serves the static
  assets and a REST API under `/api/*`, backed by **D1** (`pour-profile-db`).
- **Map**: MapLibre GL JS (loaded from unpkg) rendering free [OpenFreeMap](https://openfreemap.org)
  vector tiles — no API key required.
- **Barcode scanning**: two decoders. `BarcodeDetector` where the browser has it
  (Chrome/Android), and **ZXing** loaded on demand from a CDN everywhere else —
  which is what makes scanning work on **iOS Safari**, since it still ships no
  `BarcodeDetector`. The camera preview starts before either decoder is chosen,
  so the frame is never a dead black box, and a torch button appears when the
  camera reports one (useful in a dim bar). Manual barcode entry is always
  available, and is the only path that works offline, since ZXing and the
  product lookup both need the network.
- **Barcode/product lookup**: `worker.js` proxies UPCitemdb (trial tier) and
  Open Food Facts server-side, so no API keys ship to the client. Every
  externally-sourced field is shown with its source and confidence, and is
  never silently trusted.
- **Palate engine**: `palate-engine.js` — a small, deterministic, fully
  explainable weighted-affinity scorer (no opaque ML). Shared logic used by
  the Worker to compute `/api/palate` and `/api/match`.

## Data model

- `bottles` — the product (brand, expression, category, distillery, proof,
  mash bill, barcode, image + provenance, status tags like `favorite`/`want_to_try`).
- `tastings` — a specific pour (date, rating, serving style, venue, price,
  notes, flavor tags, would-order-again). A bottle can have many tastings.
- `venues` — where you drank it (bar, restaurant, distillery tasting room,
  home/private).
- `distilleries` — where a spirit is *from*, tracked separately from where you
  drank it, with an `is_sourced_whiskey` flag and a `confidence` field so a
  producer's headquarters is never casually treated as its distillation origin.
- `flavor_tags` / `bottle_flavor_tags` / `tasting_flavor_tags` — the flavor
  taxonomy (see `flavor-taxonomy.js`), attachable at the bottle level
  (producer/detected profile) or the tasting level (your personal experience).
- `brand_signals` — brand-level preference notes independent of any one bottle
  (e.g. "generally likes Rabbit Hole").
- `profiles` — one per drink family (**Spirits**, **Wine**), each with an
  enforced `focus` so the spirits profile never lists wine and vice versa. The
  `person` column records whose palate it represents (Justin / Lady) without
  making the switcher person-based. Status (`bottle_status`) and tastings are
  scoped per profile, while `bottles` stays a shared catalog.

See `migrations/` for the full schema and the seeded starting data (Justin's
known favorites/dislikes and initial discovery queue — every fact there is
either something he explicitly said or public distillery metadata marked with
a confidence level; no ratings or tasting notes are fabricated).

## Local development

```
npm install
npm run build      # copies frontend files into dist/
npx wrangler dev    # serves dist/ + worker.js locally, with live D1 binding
```

## Deploying

```
npm run deploy      # build + wrangler deploy
```

Requires the `pour-profile-db` D1 database bound in `wrangler.jsonc` (already
provisioned) and, optionally, an `OPENAI_API_KEY` Worker secret if you want
the label-photo-read helper (`/api/analyze-image`) to work — this is optional
and the rest of the app functions fully without it.

## What's built (Milestone 1)

- Bottom nav: Home, My Spirits, Scan, Discover (incl. Map), Profile
- Bottle vs. tasting data model, with status tags (`favorite`, `want_to_try`, etc.)
- Quick Log Pour (rating only required, everything else optional) + full tasting form
- Barcode scanning with manual fallback, provider-abstracted lookup, and a
  confirm/edit screen before anything saves — never trusts external data silently
- Deterministic, explainable palate engine with per-flavor confidence bands
- "Would I like this?" match scoring, reused for Liquor Store Mode (scan → BUY / TRY A POUR / PROBABLY SKIP)
- Bottle detail (tastings timeline, flavor experience, match explanation), 2–4 bottle comparison
- Map with My Tastings / Spirit Origins / Both toggle, map analytics (top venue, states/countries represented)
- PWA install, offline browsing of the last-synced collection, offline pour queueing with auto-sync
- JSON/CSV export
- Seeded with Justin's known favorites, dislikes, and starting discovery queue

## Bottle images

Three sources, each recorded with its provenance in `image_source` / `image_confidence`:

1. **Your own photo** (`user_photo`, high confidence) — tap "Add photo" on any bottle
   page. The image is downscaled to ~700px JPEG in the browser before upload, stored
   in the `pour-tracker` R2 bucket via the `PHOTOS` binding, and served from
   `GET /api/images/:bottleId` with a long cache lifetime. `bottle_images` in D1
   keeps the metadata row (mime type, storage location) and doubles as a fallback
   store if the R2 binding is ever absent.

   The R2 bucket is intentionally **private, with no public custom domain**: the
   Worker reads it through the binding, so photos are only reachable through
   `/api/images/:bottleId` rather than at a guessable public bucket URL.
2. **Barcode lookup image** (`barcode_api`, medium/low confidence) — populated
   automatically when a scan matches a product database, always shown for
   confirmation before saving.
3. **Manual URL** (`manual_url`, medium confidence) — paste an official producer
   image URL in the bottle's Edit sheet.

Seeded bottles deliberately ship with **no** image: guessing at retailer image
URLs risks showing the wrong bottle, which the app is explicitly designed not to
do. Photograph them as you go, or paste producer URLs.

Only JPEG/PNG/WEBP are accepted — SVG is rejected, since SVG can carry script.

## External ratings (outside opinion)

Community/critic scores live in `external_ratings` and are **never fed into the
palate engines**. The app's value is learning what *you* like, and the crowd
disagreeing with you is signal rather than error — Four Roses reviews well and
Justin dislikes it. Instead the bottle page shows both numbers side by side
("outside scores average 91, your palate says 30"), which is the
"good wine" vs "good wine *for me*" distinction from Lady's profile.

Entry is manual (no free API supplies this data — Whiskybase, Whiskystats,
Grapeminds and Wine-Searcher are paid, and Vivino has no public API; the
"Vivino APIs" in circulation are scrapers that breach its terms and are
deliberately not used) but it is **fully discrete — there is no free-text
field**:

- **Source** comes from a closed enum (`rating-sources.js`), so entries stay
  groupable; "Vivino" can't fragment into three spellings.
- **Scale** is taken from the source definition rather than from input, so a
  Vivino 4.2 can never be stored as if it were out of 100. Scores are
  normalized to a percentage only because that scale is authoritative.
- **Descriptors** are picked from the existing flavor taxonomy (spirits) or the
  0-10 wine dimensions — the same vocabulary the engines already speak.

The score/descriptor split matters: the *score* is an outside verdict and never
touches a palate model, but the *descriptors* describe the bottle, so they seed
its flavor tags / wine dimensions when it has none. That is what lets the app
answer "would I like this?" for a bottle nobody has tasted yet.

`POST /api/bottles/:id/enrich` adds free *factual* enrichment from Wikidata
(CC0, no key) — producer/entity identification only, never ratings, returned
with low confidence and an explicit "matched by name only" caveat.

The schema is provider-agnostic, so a paid source can be added later without
migrations.

## Cloudflare setup

- **D1**: `pour-profile-db` (binding `DB`)
- **R2**: `pour-tracker` (binding `PHOTOS`) — keep private, no custom domain
- **Custom domain**: set on the *Worker* (Workers & Pages → pour-profile →
  Settings → Domains & Routes), not on the R2 bucket
- **Optional secret**: `OPENAI_API_KEY` for the label-photo reader

## Phase 2 backlog

- True pixel-based map clustering (currently one marker per venue/distillery, each already showing an aggregate count)
- Automatic producer-image lookup with a verification step before saving
- Venue/business lookup during "Use Current Location" pour logging (currently manual venue entry)
- JSON import UI (the `/api/import` endpoint exists; needs a Profile-page file picker)
- LLM-assisted free-text tasting note parsing and flavor tag suggestion (`/api/analyze-image` exists for label photos; note-parsing is not yet wired up)
- Category-specific attribute editing UI for tequila/mezcal/scotch/rum/gin fields (`category_attrs` is modeled and stored; no dedicated edit form yet)
- Per-field "user corrected" provenance tracking in the UI (the `user_edited_fields` column is populated on every edit; nothing surfaces it yet)

### Bottle lookup

In Add Drink, enter a name or paste a Bottle Blue Book bottle-page URL and choose
**Search Bottle Blue Book**. Public bottle details and photos are imported without
AI. Review the exact expression/year and image before saving. Requires the `PHOTOS`
R2 binding, but no OpenAI or search API key. Drafts expire after 24 hours and use
the existing D1 tables; no database migration is needed.

Personal input is now a four-step Bad / OK / Like / Love reaction. The historical
numeric values remain internally for compatibility, but there is no numeric
rating input. Detailed sensory questions are optional. Bottle ratings use sourced
external reviews; only compatible 100-point scores are averaged, and other scales
are shown separately. Discover can sort by highest external reviews. Recommendations
compare source-stated flavors with the latest reaction to each bottle in the active
person's history, giving Love more weight than Like and penalizing Bad overlaps.
Bottle Blue Book adds community overall ratings; flavor terms continue to come
from separately attributed producer and critic descriptions. Existing bottles offer **Find details & image** for review
and enrichment without replacing a personal photo.

### Bottle Blue Book lookup

Add Drink → Search Bottle Blue Book reads public search and bottle pages on demand without an OpenAI key. Paste a Bottle Blue Book bottle URL or confirm an expression/year from search results. Details, photo bytes, source link and available community overall rating are saved through the existing research-draft flow. Images are copied into the app's photo storage only when confirmed; personal photos are preserved. Unknown fields stay blank and market estimates are labeled separately from MSRP. Flavor preferences continue to use attributed producer/critic descriptions, not community score categories. The photo-storage binding is required. Search is limited to three pages per lookup and may not cover the site's full catalog.
