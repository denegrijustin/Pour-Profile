// Bottle-image enrichment, executed inside the Cloudflare Worker.
//
// The research exports shipped 317 records with ZERO usable images: every
// `direct_image_url` was empty and every `image_verified` was FALSE. What they
// shipped instead, on all 317, is `image.lookup_url` — a *Bing image search
// URL*. That is a hint for a human, not a source: a search-results page is
// JS-rendered, returns thumbnails of unknown provenance, and would hand us the
// wrong expression constantly. So it is explicitly NOT scraped.
//
// The real resolver is Open Food Facts: free, no API key, no rate-limit games,
// and — critically — it returns *structured* product records. That means the
// candidate arrives with its own product name and brand attached, so the match
// can be scored name-against-name instead of guessing from a URL string.
//
// This runs in the Worker rather than at build time because the Worker has
// unrestricted outbound fetch.
//
// The accuracy rule from the brief drives everything below: "do not use generic
// category photos" and "do not use photos of the wrong expression". Matching is
// bidirectional and deliberately strict, and anything short of a confident match
// is stored for human confirmation rather than silently accepted.

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const OK_MIME = /^image\/(jpeg|jpg|png|webp|avif)$/i;
const UA = "PourDecisions/1.0 (personal bottle tracker; image enrichment)";

// Category words carry no identifying information — every bourbon record
// contains "bourbon". Size/proof noise is stripped for the same reason: "750ml"
// in a shop's product title is not evidence about which bottle this is.
const CATEGORY_WORDS = [
  "the", "a", "an", "of", "and", "with",
  "bourbon", "whiskey", "whisky", "wine", "bottle", "spirits", "distillery", "distilling",
  "straight", "kentucky", "tennessee",
  "sauvignon", "blanc", "vin", "vino", "750ml", "700ml", "ml", "cl", "proof", "abv", "alc",
  // Product-type words retailers/OFF append to every spirit. Like "bourbon" they
  // say what the thing is, not which one it is, and left in they sink precision.
  "scotch", "cognac", "vodka", "gin", "rum", "tequila", "liqueur", "liquor", "spirit",
  "alcohol", "alcoholic", "beverage", "litre", "liter"
];

// Dropped when matching IMAGES only. On a retailer page these words are shelf
// boilerplate, so ignoring them finds more photos. They must NOT be dropped when
// deciding whether two records are the same bottle: "Single Barrel" versus
// "Small Batch" is precisely the difference between two expressions.
const IMAGE_NOISE = ["small", "batch", "single", "barrel", "reserve"];

const STOPWORDS = new Set([...CATEGORY_WORDS, ...IMAGE_NOISE]);
const IDENTITY_STOPWORDS = new Set(CATEGORY_WORDS);

// A search-engine results page is a lookup hint, never a source to scrape.
const SEARCH_ENGINE = /(^|\.)(bing|google|duckduckgo|yahoo|yandex|baidu)\.[a-z.]+$/i;

/**
 * Fold the many spellings of the same fact onto one form BEFORE tokenizing, so
 * "12 Years Old", "12-year-old" and "12yo" all read as "12 year", and pack-size /
 * strength noise ("70cl", "40% vol", "750 ml") disappears. Open Food Facts titles
 * are full of both, and the old tokenizer counted every one of them against
 * precision, which pushed correct bottles under the 0.8 floor.
 */
export function normalizeNameText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/(\d+)\s*[- ]?\s*(?:years?|yrs?|y\.?o\.?|yo)(?:[- ]?olds?)?\b/g, "$1 year ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:cl|ml|l|oz|fl\.?\s?oz|ltr|litres?|liters?)\b/g, " ")
    // Strength as a percentage is noise; a PROOF number is not ("Old Forester 86
    // Proof" and "100 Proof" are different bottlings), so it is left alone.
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:%|percent)(?:\s*(?:vol|abv|alc)\b\.?)?/g, " ")
    .replace(/%/g, " ");
}

export function tokens(text, { identity = false } = {}) {
  const stop = identity ? IDENTITY_STOPWORDS : STOPWORDS;
  const words = normalizeNameText(text)
    .normalize("NFD")
    // Fold accents rather than shredding the word: without this "Rosé" becomes
    // "ros" and stops matching a catalogue that spells it "Rose".
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // Age and batch numbers are short but among the most distinguishing things in
  // a whiskey name — "46", "12 Year", "1910". They survive the length filter.
  const keep = (t) => !stop.has(t) && (t.length > 2 || (identity && /^\d+$/.test(t)));
  const kept = words.filter(keep);
  // Two-letter words are usually noise, but some producers are nothing else
  // ("Te Pa"). Dropping them there would leave the record unmatchable forever,
  // so the short-word filter only applies when something survives it.
  return kept.length ? kept : words.filter((t) => t.length >= 2 && !stop.has(t));
}

export function isSearchEnginePage(url) {
  try { return SEARCH_ENGINE.test(new URL(url).hostname); } catch { return false; }
}

/**
 * Score how well a candidate product's *own* name matches the record we want.
 * Scored in both directions on purpose:
 *
 *   coverage  — how much of OUR name the candidate accounts for. Catches the
 *               candidate being a different expression ("Angel's Envy Rye" vs
 *               a plain "Angel's Envy": "rye" goes unmatched).
 *   precision — how much of THEIR name we account for. Catches the candidate
 *               being a *more specific* bottle than we asked for ("Eagle Rare"
 *               vs "Eagle Rare 17 Year": "17" and "year" are unaccounted for).
 *
 * A one-directional score passes both of those, which is how the wrong bottle
 * ends up on a record.
 */
export function scoreNameMatch(wantName, wantProducer, candidateText, opts = {}) {
  const want = new Set([...tokens(wantName, opts), ...tokens(wantProducer, opts)]);
  const got = new Set(tokens(candidateText, opts));
  if (!want.size || !got.size) return { score: 0, coverage: 0, precision: 0 };

  let shared = 0;
  for (const t of want) if (got.has(t)) shared++;
  const coverage = shared / want.size;

  let backShared = 0;
  for (const t of got) if (want.has(t)) backShared++;
  const precision = backShared / got.size;

  return { score: coverage * 0.75 + precision * 0.25, coverage, precision };
}

/**
 * Are these two records the same bottle?
 *
 * Distinct from image matching, which tolerates a looser match to find more
 * photos. Here both kinds of error hurt: a false positive hides a bottle from
 * recommendations by claiming you own a different expression of it, and a false
 * negative recommends something already sitting on your shelf.
 *
 * The two directions read different fields, which is what makes it work:
 *
 *  - *coverage* — every distinguishing word of the catalog record must appear
 *    somewhere on the bottle, brand included, since catalogs and collections
 *    split the producer between fields inconsistently.
 *  - *precision* — measured against the bottle's NAME only. Brand fields carry
 *    corporate baggage ("Unshackled (The Prisoner Wine Company)"), and counting
 *    that against the match rejected a bottle the user demonstrably owned.
 */
export function isSameBottle(a, b) {
  const opts = { identity: true };
  const want = new Set([...tokens(a.name, opts), ...tokens(a.producer, opts)]);
  const haystack = new Set([...tokens(b.name, opts), ...tokens(b.producer, opts)]);
  const identity = new Set(tokens(b.name, opts));
  if (!want.size || !identity.size) return false;

  let covered = 0;
  for (const t of want) if (haystack.has(t)) covered++;
  const coverage = covered / want.size;

  let accounted = 0;
  for (const t of identity) if (want.has(t)) accounted++;
  const precision = accounted / identity.size;

  return coverage >= 0.8 && precision >= 0.6;
}

const WIKI_UA = `${UA} (https://pourprofile.elskatemm.com)`;

// The single acceptance gate. enrichOne uses it to pick the winner and the
// resolvers use it to decide whether another source is worth a subrequest.
export function passesGate(c, { autoAcceptAt = 0.7, minCoverage = 0.8, minPrecision = 0.8 } = {}) {
  return !!c && c.score >= autoAcceptAt && c.coverage >= minCoverage && c.precision >= minPrecision;
}

function labelFromOff(p) {
  const brands = Array.isArray(p.brands) ? p.brands.join(" ") : String(p.brands || "");
  return `${brands} ${p.product_name || p.product_name_en || ""}`.trim();
}

function scoreOffProducts(products, record) {
  return (Array.isArray(products) ? products : [])
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const imageUrl = p.image_front_url || p.image_url || p.image_front_small_url;
      if (!imageUrl || !/^https?:/i.test(imageUrl)) return null;
      const label = labelFromOff(p);
      const m = scoreNameMatch(record.name, record.producer, label, { identity: true });
      return { url: imageUrl, origin: "openfoodfacts", label, ...m };
    })
    .filter(Boolean);
}

async function getJson(url, fetchImpl, notes, what, ua = UA) {
  try {
    const res = await fetchImpl(url, { headers: { "User-Agent": ua, Accept: "application/json" } });
    if (!res.ok) { notes?.push(`${what} answered HTTP ${res.status}`); return null; }
    return await res.json();
  } catch (err) {
    notes?.push(`${what} unreachable: ${String((err && err.message) || err)}`);
    return null;
  }
}

/**
 * Look a record up in Open Food Facts and return scored candidates.
 * Never throws — a resolver that fails just yields nothing, but WHY it yielded
 * nothing is pushed onto `notes` (an HTTP 429/503 used to be indistinguishable
 * from "not in the database", which hid the real failure).
 *
 * Two endpoints are tried, newest first: the search-a-licious service (what OFF
 * points API users at; relevance-ranked) and the legacy cgi/search.pl (slow and
 * prone to 503s, but it covers older products). Each is tried with "producer
 * name" and then the bare name (OFF often files the parent company as the
 * brand). Later attempts only run while nothing verifiable has been found, to
 * spare the Worker's subrequest budget.
 */
export async function searchOpenFoodFacts(record, { fetchImpl = fetch, notes } = {}) {
  const queries = [...new Set(
    [[record.producer, record.name], [record.name]].map((p) => p.filter(Boolean).join(" ").trim()).filter(Boolean)
  )];
  if (!queries.length) return [];

  const fields = "code,product_name,brands,image_front_url,image_url";
  const endpoints = [
    (q) => ({
      what: "Open Food Facts search",
      url: `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=15&fields=${fields}`
    }),
    (q) => ({
      what: "Open Food Facts legacy search",
      url: "https://world.openfoodfacts.org/cgi/search.pl"
        + `?search_terms=${encodeURIComponent(q)}`
        + `&search_simple=1&action=process&json=1&page_size=24&fields=${fields}`
    })
  ];

  let found = [];
  outer:
  for (const endpoint of endpoints) {
    for (const q of queries) {
      const { what, url } = endpoint(q);
      const data = await getJson(url, fetchImpl, notes, what);
      if (!data) continue;
      found = found.concat(scoreOffProducts(data.hits || data.products, record));
      if (found.some((c) => passesGate(c))) break outer;
    }
  }

  const seen = new Set();
  return found
    .filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)))
    .sort((a, b) => b.score - a.score);
}

// Commons file titles are free text ("Eagle Rare bourbon bottle 2.jpg"): strip
// the extension and photo-description boilerplate before scoring, and refuse
// titles that are obviously not a product shot.
const COMMONS_NOISE = /\b(file|bottles?|photo|photograph|image|img|dsc|front|jpe?g|png|webp|cropped|crop|display|shelf|tasting)\b/gi;
const COMMONS_REJECT = /logo|label|advert|poster|sign\b|map\b|building|museum|distillery|factory|cocktail|glass|barrels?\b|cask|flag|stamp|coat of arms|\bcan\b|collage/i;

/**
 * Wikimedia Commons file search. Second-tier source for bottles OFF does not
 * carry (most craft/limited spirits and wines). Same strictness as everything
 * else: the file's TITLE must account for the whole bottle name and add nothing
 * distinguishing of its own, and only raster images of a sane size are offered.
 */
export async function searchWikimediaCommons(record, { fetchImpl = fetch, notes } = {}) {
  const terms = [record.producer, record.name].filter(Boolean).join(" ").trim();
  if (!terms) return [];
  const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2"
    + "&generator=search&gsrnamespace=6&gsrlimit=10"
    + `&gsrsearch=${encodeURIComponent(`${terms} bottle`)}`
    + "&prop=imageinfo&iiprop=url%7Cmime%7Csize&iiurlwidth=600";
  const data = await getJson(url, fetchImpl, notes, "Wikimedia Commons search", WIKI_UA);
  const pages = data?.query?.pages;
  const list = Array.isArray(pages) ? pages : Object.values(pages || {});

  return list.map((pg) => {
    const info = pg.imageinfo?.[0];
    const title = String(pg.title || "");
    if (!info || !/^image\/(jpeg|png|webp)$/i.test(info.mime || "")) return null;
    if (COMMONS_REJECT.test(title)) return null;
    if (info.width && info.height && Math.min(info.width, info.height) < 200) return null;
    const imageUrl = info.thumburl || info.url;
    if (!imageUrl) return null;
    const label = title.replace(/^file:/i, "").replace(/\.[a-z0-9]+$/i, "").replace(/_+/g, " ")
      .replace(COMMONS_NOISE, " ").replace(/\s+/g, " ").trim();
    const m = scoreNameMatch(record.name, record.producer, label, { identity: true });
    return {
      url: imageUrl, origin: "wikimedia-commons", label,
      sourcePage: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      ...m
    };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
}

/** Pull image candidates out of an HTML document, best-signal first. */
export function extractImageCandidates(html, baseUrl) {
  const out = [];
  const push = (url, origin, alt = "") => {
    if (!url) return;
    let abs;
    try { abs = new URL(url, baseUrl).toString(); } catch { return; }
    if (!/^https?:/i.test(abs)) return;
    if (/\.svg(\?|$)/i.test(abs)) return;                 // logos, not bottles
    if (/sprite|logo|icon|favicon|placeholder|badge/i.test(abs)) return;
    out.push({ url: abs, origin, alt });
  };

  const meta = (prop) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`, "ig");
    for (const tag of html.match(re) || []) {
      const m = tag.match(/content=["']([^"']+)["']/i);
      if (m) push(m[1], prop);
    }
  };
  meta("og:image");
  meta("twitter:image");

  // JSON-LD product images are usually the real product shot, and they arrive
  // next to the product's own name — which is what makes them scoreable.
  for (const block of html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || []) {
    const body = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    try {
      const walk = (node) => {
        if (!node) return;
        if (Array.isArray(node)) return node.forEach(walk);
        if (typeof node !== "object") return;
        if (node.image) {
          const imgs = Array.isArray(node.image) ? node.image : [node.image];
          imgs.forEach((i) => push(typeof i === "string" ? i : i && i.url, "json-ld", node.name || ""));
        }
        Object.values(node).forEach(walk);
      };
      walk(JSON.parse(body));
    } catch { /* malformed JSON-LD is common; ignore */ }
  }

  // Plain <img> tags, carrying their alt text so it can be scored.
  for (const tag of html.match(/<img[^>]+>/gi) || []) {
    const src = (tag.match(/(?:data-)?src=["']([^"']+)["']/i) || [])[1];
    const alt = (tag.match(/alt=["']([^"']*)["']/i) || [])[1] || "";
    push(src, "img", alt);
  }

  // De-duplicate, keeping the strongest-signalled copy of each URL.
  const rank = { "json-ld": 3, "og:image": 2, "twitter:image": 1, img: 0 };
  const byUrl = new Map();
  for (const c of out) {
    const prev = byUrl.get(c.url);
    if (!prev || rank[c.origin] > rank[prev.origin]) byUrl.set(c.url, c);
  }
  return [...byUrl.values()];
}

/** Score HTML-derived candidates, which have far weaker naming signal than OFF. */
export function scorePageCandidates(candidates, record) {
  return candidates
    .map((c) => {
      // The URL path often carries the product slug, so it is scored alongside
      // whatever alt/name text came with the tag.
      const text = `${c.alt || ""} ${decodeURIComponent(c.url).replace(/[/_-]/g, " ")}`;
      const m = scoreNameMatch(record.name, record.producer, text);
      const originBonus = { "json-ld": 0.1, "og:image": 0.05 }[c.origin] || 0;
      return { ...c, ...m, score: Math.min(1, m.score + originBonus) };
    })
    .sort((a, b) => b.score - a.score);
}

async function fetchText(url, fetchImpl) {
  const res = await fetchImpl(url, { headers: { "User-Agent": UA, Accept: "text/html,*/*" }, redirect: "follow" });
  if (!res.ok) throw new Error(`page ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!/text\/html|application\/xhtml/i.test(type)) throw new Error(`not html (${type})`);
  return await res.text();
}

/** Collect candidates from every resolver that applies to this record. */
export async function gatherCandidates(record, { fetchImpl = fetch } = {}) {
  const notes = [];
  const candidates = [...await searchOpenFoodFacts(record, { fetchImpl, notes })];
  if (!candidates.length) notes.push("no Open Food Facts match");

  // Open Food Facts is a grocery database; plenty of craft spirits and wines are
  // simply not in it. Only reach for Commons when OFF gave nothing verifiable.
  if (!candidates.some((c) => passesGate(c))) {
    const commons = await searchWikimediaCommons(record, { fetchImpl, notes });
    if (!commons.length) notes.push("no Wikimedia Commons match");
    candidates.push(...commons);
  }

  // A real producer/product page, if the record ever gets one. Today every
  // record's only URL is a Bing search, which is skipped by design.
  const page = record.sources?.[0]?.url || record.image?.source_url || record.image?.primary_url;
  if (page && /^https?:/i.test(page) && !isSearchEnginePage(page)) {
    try {
      const html = await fetchText(page, fetchImpl);
      candidates.push(...scorePageCandidates(extractImageCandidates(html, page), record));
    } catch (err) {
      notes.push(`source page unreadable: ${String(err.message || err)}`);
    }
  } else if (record.image?.lookup_url && isSearchEnginePage(record.image.lookup_url)) {
    notes.push("catalog only has a search-engine lookup link, not a product page");
  }

  // Verified candidates first (then by score), so a lower-scored but fully
  // verified image is never crowded out of the list by near-misses.
  candidates.sort((a, b) => (passesGate(b) - passesGate(a)) || (b.score - a.score));
  return { candidates: candidates.slice(0, 6), notes };
}

/**
 * Resolve one subject's image: find candidates, and — only when the match is
 * confident in both directions — download the winning image and hand the bytes
 * back. Storage is the caller's decision, because a bottle's photo and a catalog
 * record's photo live in different places.
 *
 * `subject` is `{ id, name, producer }`; anything else on it is ignored.
 *
 * Never throws; failures are returned so a batch can continue.
 */
export async function enrichOne(record, opts = {}) {
  const {
    fetchImpl = fetch,
    // Strict on purpose. `minCoverage` is the real guard: it means essentially
    // every distinguishing word in our bottle's name has to appear in the
    // candidate's name, which is what keeps a different expression out.
    autoAcceptAt = 0.7,
    minCoverage = 0.8
  } = opts;

  const result = { subject_id: record.id, status: "failed", source_page: null, candidates: [], confidence: 0 };

  const { candidates, notes } = await gatherCandidates(record, { fetchImpl });
  result.candidates = candidates.map((c) => ({
    url: c.url, score: Math.round(c.score * 100) / 100, origin: c.origin, label: c.label || c.alt || null
  }));

  if (!candidates.length) {
    result.match_reason = notes.join("; ") || "no images found for this bottle";
    return result;
  }

  // gatherCandidates puts verified candidates first, so this is the best
  // verified one if any exists, otherwise the closest miss (for the review note).
  const best = candidates[0];
  result.confidence = Math.round(best.score * 100) / 100;

  if (!passesGate(best, { autoAcceptAt, minCoverage })) {
    // Deliberately does NOT guess. A partial name match is exactly how the
    // wrong expression ends up on a record, which the brief forbids.
    result.status = "needs_review";
    result.match_reason = best.coverage < minCoverage
      ? `closest match "${best.label || best.alt || "unnamed"}" only accounts for ${Math.round(best.coverage * 100)}% of this bottle's name; left for confirmation`
      : best.precision < 0.8 ? "candidate contains additional expression details; left for confirmation" : `best candidate only scored ${result.confidence}; left for confirmation`;
    return result;
  }

  try {
    const { mime, buf } = await downloadImage(best.url, fetchImpl);
    result.status = "ok";
    result.image_url = best.url;
    result.source_page = best.origin === "openfoodfacts" ? "https://world.openfoodfacts.org/" : (best.sourcePage || best.url);
    result.mime = mime;
    result.buf = buf;
    result.bytes = buf.length;
    result.match_reason = `matched "${best.label || record.name}" via ${best.origin} at ${result.confidence}`;
  } catch (err) {
    result.status = "needs_review";
    result.match_reason = `found a candidate but could not fetch it: ${String(err.message || err)}`;
  }
  return result;
}

/** Fetch an image URL, rejecting anything that isn't actually a usable image. */
export async function downloadImage(url, fetchImpl = fetch) {
  const res = await fetchImpl(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`image ${res.status}`);
  const mime = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!OK_MIME.test(mime)) throw new Error(`unsupported type ${mime || "unknown"}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (!buf.length) throw new Error("empty image");
  if (buf.length > MAX_IMAGE_BYTES) throw new Error(`image too large (${Math.round(buf.length / 1024)} KB)`);
  return { mime, buf };
}
