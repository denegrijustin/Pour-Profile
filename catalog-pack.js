// Compact wire format for the reference catalog.
//
// The research catalog is ~727 KB as authored. Packing strips the parts the app
// can rebuild: top-level null placeholders, a `visibility`/`lifecycle` pair that
// refreshCatalog() recomputes on every load, a Bing search URL that is a pure
// function of the bottle's name, and default-valued user_state/barcode blocks.
// Hydrating puts back the exact structure the rest of the code expects. Nothing
// here changes a value — test/catalog-pack.test.mjs proves the hydrated catalog is
// identical (key for key, in order) to the original once refreshCatalog() has run.
//
// The point of this module is less the byte count (the data compresses to ~30 KB
// either way) than WHERE the data lives: as a static asset the Worker fetches once
// per isolate, instead of as ~700 KB of literals compiled into the Worker script.

// Top-level keys every record carries. Missing ones come back as null so the API
// keeps emitting `"vintage": null` rather than silently dropping the field.
export const TOP_LEVEL_KEYS = [
  "id", "name", "producer", "category", "subcategory", "country", "region", "vintage",
  "age_statement", "proof", "abv", "mash_bill", "grape", "typical_price_usd",
  "regional_availability", "ratings", "research", "tasting_profile", "recommendation",
  "user_state", "visibility", "image", "barcode", "last_verified"
];

// Objects that code reads with plain property access (r.ratings.jd_fit), so they
// must exist even when every field inside them was null and got packed away.
const OBJECT_KEYS = ["typical_price_usd", "regional_availability", "ratings", "research", "tasting_profile", "recommendation"];

// Recomputed by refreshCatalog(); storing them would only add bytes that get overwritten.
const DERIVED_KEYS = ["visibility", "lifecycle"];

const DEFAULT_USER_STATE = { tasted: false, user_rating: null, user_notes: null, want_to_try: false, favorite: false };
const DEFAULT_BARCODE = { upc: null, ean: null, source: null, verified: false };

/** The exact Bing lookup link the research export shipped, rebuilt from the name. */
export function lookupUrl(name) {
  const q = encodeURIComponent(`${name} official bottle`)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  return `https://www.bing.com/images/search?q=${q}`;
}

const altFor = (name) => `${name} bottle`;

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function packImage(rec) {
  const img = rec.image;
  if (!isPlainObject(img)) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(img)) {
    if (v === null || v === undefined) continue;
    if (k === "verified" && v === false) continue;
    if (k === "alt" && v === altFor(rec.name)) continue;
    if (k === "lookup_url" && v === lookupUrl(rec.name)) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Strip everything derivable. Pure; does not mutate its input. */
export function packCatalog(records) {
  return records.map((rec) => {
    const out = {};
    for (const [k, v] of Object.entries(rec)) {
      if (DERIVED_KEYS.includes(k) || v === null || v === undefined) continue;
      if (k === "image") continue;
      if (k === "user_state" && sameJson(v, DEFAULT_USER_STATE)) continue;
      if (k === "barcode" && sameJson(v, DEFAULT_BARCODE)) continue;
      // Nested objects are kept verbatim: dropping a null inside one changes which
      // keys exist, and that is the kind of drift a parity test should never need to excuse.
      out[k] = v;
    }
    const image = packImage(rec);
    if (image) out.image = image;
    return out;
  });
}

/** Rebuild the full record shape the Worker and scoring code expect. */
export function hydrateCatalog(packed) {
  return packed.map((p) => {
    const rec = {};
    for (const key of TOP_LEVEL_KEYS) rec[key] = p[key] === undefined ? null : p[key];
    for (const [k, v] of Object.entries(p)) if (!(k in rec)) rec[k] = v;
    for (const key of OBJECT_KEYS) if (rec[key] === null) rec[key] = {};
    rec.user_state = rec.user_state ?? { ...DEFAULT_USER_STATE };
    rec.barcode = rec.barcode ?? { ...DEFAULT_BARCODE };
    rec.image = {
      primary_url: null,
      verified: false,
      alt: altFor(rec.name),
      lookup_url: lookupUrl(rec.name),
      ...(p.image || {})
    };
    return rec;
  });
}

/**
 * Attach cited expert notes (data/expert-notes.json, keyed by id) to packed records as
 * `expert`. Records with nothing reliable get no field. Shared by the build and tests.
 */
export function attachExpertNotes(packed, notes = {}) {
  return packed.map((r) => {
    const e = notes[r.id];
    if (!e || e.confidence === "none") return r;
    const { notes: caveat, corrected, ...expert } = e;
    return { ...r, expert: { ...expert, caveat: caveat || null } };
  });
}
