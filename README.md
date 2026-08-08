# Pour Profile

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
- **Barcode scanning**: the browser's native `BarcodeDetector` API, with manual
  entry always available as a fallback (notably on iOS Safari, which doesn't
  support `BarcodeDetector` as of this build).
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

## Phase 2 backlog

- True pixel-based map clustering (currently one marker per venue/distillery, each already showing an aggregate count)
- R2-backed user bottle photo uploads (currently image URL only, with source/provenance tracked)
- Venue/business lookup during "Use Current Location" pour logging (currently manual venue entry)
- JSON import UI (the `/api/import` endpoint exists; needs a Profile-page file picker)
- LLM-assisted free-text tasting note parsing and flavor tag suggestion (`/api/analyze-image` exists for label photos; note-parsing is not yet wired up)
- Category-specific attribute editing UI for tequila/mezcal/scotch/rum/gin fields (`category_attrs` is modeled and stored; no dedicated edit form yet)
- Per-field "user corrected" provenance tracking in the UI (the `user_edited_fields` column is populated on every edit; nothing surfaces it yet)
