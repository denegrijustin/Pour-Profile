import { buildPalateProfile, scoreMatch } from "./palate-engine.js";

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await routeApi(request, url, env);
      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error(err);
      return json({ error: String(err && err.message || err) }, 500);
    }
  }
};

async function routeApi(request, url, env) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/api/bottles" && method === "GET") return listBottles(url, env);
  if (pathname === "/api/bottles" && method === "POST") return createBottle(request, env);
  const bottleMatch = pathname.match(/^\/api\/bottles\/(\d+)$/);
  if (bottleMatch && method === "GET") return getBottle(Number(bottleMatch[1]), env);
  if (bottleMatch && method === "PATCH") return updateBottle(Number(bottleMatch[1]), request, env);
  if (bottleMatch && method === "DELETE") return deleteBottle(Number(bottleMatch[1]), env);

  if (pathname === "/api/tastings" && method === "GET") return listTastings(url, env);
  if (pathname === "/api/tastings" && method === "POST") return createTasting(request, env);
  const tastingMatch = pathname.match(/^\/api\/tastings\/(\d+)$/);
  if (tastingMatch && method === "PATCH") return updateTasting(Number(tastingMatch[1]), request, env);
  if (tastingMatch && method === "DELETE") return deleteTasting(Number(tastingMatch[1]), env);

  if (pathname === "/api/venues" && method === "GET") return listVenues(env);
  if (pathname === "/api/venues" && method === "POST") return createVenue(request, env);

  if (pathname === "/api/distilleries" && method === "GET") return listDistilleries(env);
  if (pathname === "/api/distilleries" && method === "POST") return createDistillery(request, env);
  const distMatch = pathname.match(/^\/api\/distilleries\/(\d+)$/);
  if (distMatch && method === "PATCH") return updateDistillery(Number(distMatch[1]), request, env);

  if (pathname === "/api/flavor-tags" && method === "GET") return listFlavorTags(env);
  if (pathname === "/api/brand-signals" && method === "GET") return listBrandSignals(env);

  if (pathname === "/api/palate" && method === "GET") return getPalateProfile(env);
  if (pathname === "/api/match" && method === "POST") return postMatch(request, env);

  const photoMatch = pathname.match(/^\/api\/bottles\/(\d+)\/photo$/);
  if (photoMatch && method === "PUT") return putBottlePhoto(Number(photoMatch[1]), request, env);
  if (photoMatch && method === "DELETE") return deleteBottlePhoto(Number(photoMatch[1]), env);
  const imageMatch = pathname.match(/^\/api\/images\/(\d+)$/);
  if (imageMatch && method === "GET") return getBottleImage(Number(imageMatch[1]), env);

  const barcodeMatch = pathname.match(/^\/api\/barcode\/([A-Za-z0-9]+)$/);
  if (barcodeMatch && method === "GET") return lookupBarcode(barcodeMatch[1], env);

  if (pathname === "/api/search" && method === "GET") return globalSearch(url, env);
  if (pathname === "/api/stats" && method === "GET") return getStats(env);

  if (pathname === "/api/export.json" && method === "GET") return exportJson(env, url);
  if (pathname === "/api/export.csv" && method === "GET") return exportCsv(env);
  if (pathname === "/api/import" && method === "POST") return importJson(request, env);

  if (pathname === "/api/analyze-image" && method === "POST") return analyzeImage(request, env);

  return json({ error: "Not found" }, 404);
}

// ---------- helpers ----------

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

function safeParse(str, fallback) {
  if (str == null) return fallback;
  if (typeof str !== "string") return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

async function all(env, sql, ...params) {
  const stmt = params.length ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
  const res = await stmt.all();
  return res.results || [];
}

async function first(env, sql, ...params) {
  const stmt = params.length ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
  return await stmt.first();
}

async function run(env, sql, ...params) {
  const stmt = params.length ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
  return await stmt.run();
}

async function attachFlavorTags(env, bottles) {
  if (!bottles.length) return bottles;
  const ids = bottles.map((b) => b.id);
  const placeholders = ids.map(() => "?").join(",");
  const rows = await all(
    env,
    `SELECT bft.bottle_id, ft.name FROM bottle_flavor_tags bft JOIN flavor_tags ft ON ft.id = bft.flavor_tag_id WHERE bft.bottle_id IN (${placeholders})`,
    ...ids
  );
  const byBottle = new Map();
  for (const r of rows) {
    if (!byBottle.has(r.bottle_id)) byBottle.set(r.bottle_id, []);
    byBottle.get(r.bottle_id).push(r.name);
  }
  return bottles.map((b) => ({ ...b, flavor_tags: byBottle.get(b.id) || [], status_tags: safeParse(b.status_tags, []), category_attrs: safeParse(b.category_attrs, {}) }));
}

async function attachTastingSummary(env, bottles) {
  if (!bottles.length) return bottles;
  const ids = bottles.map((b) => b.id);
  const placeholders = ids.map(() => "?").join(",");
  const rows = await all(
    env,
    `SELECT bottle_id, AVG(rating) as avg_rating, COUNT(*) as tasting_count, MAX(tasted_at) as last_tasted FROM tastings WHERE bottle_id IN (${placeholders}) GROUP BY bottle_id`,
    ...ids
  );
  const byBottle = new Map(rows.map((r) => [r.bottle_id, r]));
  return bottles.map((b) => {
    const s = byBottle.get(b.id);
    return { ...b, avg_rating: s && s.avg_rating != null ? Math.round(s.avg_rating * 10) / 10 : null, tasting_count: s ? s.tasting_count : 0, last_tasted: s ? s.last_tasted : null };
  });
}

// ---------- bottles ----------

async function listBottles(url, env) {
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const sort = url.searchParams.get("sort") || "newest";
  const distilleryId = url.searchParams.get("distillery_id");

  let sql = "SELECT b.*, d.name as distillery_name, d.city as distillery_city, d.state_region as distillery_state, d.country as distillery_country FROM bottles b LEFT JOIN distilleries d ON d.id = b.distillery_id WHERE 1=1";
  const params = [];
  if (distilleryId) { sql += " AND b.distillery_id = ?"; params.push(Number(distilleryId)); }
  if (category) { sql += " AND b.category = ?"; params.push(category); }
  if (status) { sql += " AND b.status_tags LIKE ?"; params.push(`%"${status}"%`); }
  if (q) { sql += " AND (b.name LIKE ? OR b.brand LIKE ? OR b.expression LIKE ?)"; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += {
    newest: " ORDER BY b.created_at DESC",
    alphabetical: " ORDER BY b.name ASC",
    proof: " ORDER BY b.proof DESC",
    price: " ORDER BY b.msrp ASC"
  }[sort] || " ORDER BY b.created_at DESC";

  let bottles = await all(env, sql, ...params);
  bottles = await attachFlavorTags(env, bottles);
  bottles = await attachTastingSummary(env, bottles);

  if (sort === "highest_rated") bottles.sort((a, b) => (b.avg_rating || -1) - (a.avg_rating || -1));

  const profile = await computeProfile(env);
  const brandSignals = await all(env, "SELECT brand, sentiment FROM brand_signals");
  bottles = bottles.map((b) => ({ ...b, palate_match: matchForBottle(b, profile, brandSignals, []).matchPercent }));
  if (sort === "highest_match") bottles.sort((a, b) => b.palate_match - a.palate_match);

  return json({ bottles });
}

async function getBottle(id, env) {
  const bottle = await first(env, "SELECT b.*, d.name as distillery_name, d.city as distillery_city, d.state_region as distillery_state, d.country as distillery_country, d.lat as distillery_lat, d.lon as distillery_lon, d.is_sourced_whiskey, d.confidence as distillery_confidence, d.notes as distillery_notes FROM bottles b LEFT JOIN distilleries d ON d.id = b.distillery_id WHERE b.id = ?", id);
  if (!bottle) return json({ error: "Not found" }, 404);
  const [withTags] = await attachFlavorTags(env, [bottle]);
  const tastings = await all(
    env,
    `SELECT t.*, v.name as venue_name, v.city as venue_city, v.state_region as venue_state, v.lat as venue_lat, v.lon as venue_lon, v.is_private as venue_is_private
     FROM tastings t LEFT JOIN venues v ON v.id = t.venue_id WHERE t.bottle_id = ? ORDER BY t.tasted_at DESC, t.id DESC`,
    id
  );
  const tastingIds = tastings.map((t) => t.id);
  let tagsByTasting = new Map();
  if (tastingIds.length) {
    const placeholders = tastingIds.map(() => "?").join(",");
    const rows = await all(env, `SELECT ttf.tasting_id, ft.name FROM tasting_flavor_tags ttf JOIN flavor_tags ft ON ft.id = ttf.flavor_tag_id WHERE ttf.tasting_id IN (${placeholders})`, ...tastingIds);
    for (const r of rows) {
      if (!tagsByTasting.has(r.tasting_id)) tagsByTasting.set(r.tasting_id, []);
      tagsByTasting.get(r.tasting_id).push(r.name);
    }
  }
  const fullTastings = tastings.map((t) => ({ ...t, flavor_tags: tagsByTasting.get(t.id) || [] }));

  const profile = await computeProfile(env);
  const brandSignals = await all(env, "SELECT brand, sentiment FROM brand_signals");
  const liked = await all(env, "SELECT id, name, category, status_tags FROM bottles WHERE status_tags LIKE '%favorite%' OR status_tags LIKE '%\"like\"%'");
  const disliked = await all(env, "SELECT id, name, category, status_tags FROM bottles WHERE status_tags LIKE '%dislike%' OR status_tags LIKE '%avoid%'");
  const likedWithTags = await attachFlavorTags(env, liked);
  const dislikedWithTags = await attachFlavorTags(env, disliked);
  const match = scoreMatch({ flavorTags: withTags.flavor_tags, proof: withTags.proof, brand: withTags.brand, category: withTags.category }, profile, brandSignals, likedWithTags.filter((b) => b.id !== id), dislikedWithTags.filter((b) => b.id !== id));

  return json({ bottle: withTags, tastings: fullTastings, match });
}

function matchForBottle(bottle, profile, brandSignals, likedBottles) {
  return scoreMatch({ flavorTags: bottle.flavor_tags || [], proof: bottle.proof, brand: bottle.brand, category: bottle.category }, profile, brandSignals, likedBottles, []);
}

async function computeProfile(env) {
  const bottles = await all(env, "SELECT id, status_tags FROM bottles");
  const bottlesWithTags = await attachFlavorTags(env, bottles);
  const tastings = await all(env, "SELECT id, bottle_id, rating, would_drink_again, would_order_again, would_buy_bottle FROM tastings");
  const tastingIds = tastings.map((t) => t.id);
  let tagsByTasting = new Map();
  if (tastingIds.length) {
    const placeholders = tastingIds.map(() => "?").join(",");
    const rows = await all(env, `SELECT ttf.tasting_id, ft.name FROM tasting_flavor_tags ttf JOIN flavor_tags ft ON ft.id = ttf.flavor_tag_id WHERE ttf.tasting_id IN (${placeholders})`, ...tastingIds);
    for (const r of rows) {
      if (!tagsByTasting.has(r.tasting_id)) tagsByTasting.set(r.tasting_id, []);
      tagsByTasting.get(r.tasting_id).push(r.name);
    }
  }
  const tastingsWithTags = tastings.map((t) => ({ ...t, flavor_tags: tagsByTasting.get(t.id) || [] }));
  return buildPalateProfile(bottlesWithTags, tastingsWithTags);
}

function fieldsFromBody(b) {
  const fields = ["name", "brand", "expression", "category", "subcategory", "distillery_id", "origin_country", "origin_state", "age_statement", "proof", "abv", "mash_bill", "barrel_finish", "msrp", "street_price", "release_type", "bottle_size_ml", "barcode", "image_url", "image_source", "image_confidence", "producer_url", "description"];
  const out = {};
  for (const f of fields) if (b[f] !== undefined) out[f] = b[f];
  return out;
}

async function createBottle(request, env) {
  const b = await body(request);
  if (!b.name) return json({ error: "name is required" }, 400);
  const f = fieldsFromBody(b);
  const cols = Object.keys(f);
  const statusTags = JSON.stringify(b.status_tags || []);
  const categoryAttrs = JSON.stringify(b.category_attrs || {});
  const dataSource = b.data_source || "manual";
  const sql = `INSERT INTO bottles (${cols.join(",")}, status_tags, category_attrs, data_source, source_confidence) VALUES (${cols.map(() => "?").join(",")}, ?, ?, ?, ?)`;
  const res = await run(env, sql, ...cols.map((c) => f[c]), statusTags, categoryAttrs, dataSource, b.source_confidence || "medium");
  const id = res.meta.last_row_id;
  if (Array.isArray(b.flavor_tags) && b.flavor_tags.length) await setBottleFlavorTags(env, id, b.flavor_tags);
  return getBottle(id, env);
}

async function setBottleFlavorTags(env, bottleId, tagNames) {
  await run(env, "DELETE FROM bottle_flavor_tags WHERE bottle_id = ?", bottleId);
  for (const name of tagNames) {
    const tag = await first(env, "SELECT id FROM flavor_tags WHERE name = ?", name);
    if (tag) await run(env, "INSERT OR IGNORE INTO bottle_flavor_tags (bottle_id, flavor_tag_id) VALUES (?, ?)", bottleId, tag.id);
  }
}

async function updateBottle(id, request, env) {
  const existing = await first(env, "SELECT * FROM bottles WHERE id = ?", id);
  if (!existing) return json({ error: "Not found" }, 404);
  const b = await body(request);
  const f = fieldsFromBody(b);
  const editedFields = new Set(safeParse(existing.user_edited_fields, []));
  const setClauses = [];
  const params = [];
  for (const [k, v] of Object.entries(f)) { setClauses.push(`${k} = ?`); params.push(v); editedFields.add(k); }
  if (b.status_tags) { setClauses.push("status_tags = ?"); params.push(JSON.stringify(b.status_tags)); }
  if (b.category_attrs) { setClauses.push("category_attrs = ?"); params.push(JSON.stringify(b.category_attrs)); }
  setClauses.push("user_edited_fields = ?"); params.push(JSON.stringify([...editedFields]));
  setClauses.push("updated_at = datetime('now')");
  if (setClauses.length) {
    await run(env, `UPDATE bottles SET ${setClauses.join(", ")} WHERE id = ?`, ...params, id);
  }
  if (Array.isArray(b.flavor_tags)) await setBottleFlavorTags(env, id, b.flavor_tags);
  return getBottle(id, env);
}

async function deleteBottle(id, env) {
  // D1/SQLite does not guarantee ON DELETE CASCADE enforcement, so clean up explicitly.
  const tastingIds = (await all(env, "SELECT id FROM tastings WHERE bottle_id = ?", id)).map((t) => t.id);
  for (const tastingId of tastingIds) await run(env, "DELETE FROM tasting_flavor_tags WHERE tasting_id = ?", tastingId);
  await run(env, "DELETE FROM tastings WHERE bottle_id = ?", id);
  await run(env, "DELETE FROM bottle_flavor_tags WHERE bottle_id = ?", id);
  await run(env, "DELETE FROM bottle_images WHERE bottle_id = ?", id);
  await run(env, "DELETE FROM bottles WHERE id = ?", id);
  return json({ ok: true });
}

// ---------- tastings ----------

async function listTastings(url, env) {
  const bottleId = url.searchParams.get("bottle_id");
  let sql = "SELECT t.*, b.name as bottle_name, v.name as venue_name FROM tastings t JOIN bottles b ON b.id = t.bottle_id LEFT JOIN venues v ON v.id = t.venue_id";
  const params = [];
  if (bottleId) { sql += " WHERE t.bottle_id = ?"; params.push(Number(bottleId)); }
  sql += " ORDER BY t.tasted_at DESC, t.id DESC";
  const tastings = await all(env, sql, ...params);
  return json({ tastings });
}

function tastingFieldsFromBody(b) {
  const fields = ["bottle_id", "tasted_at", "rating", "serving_style", "pour_size_oz", "venue_id", "price_paid", "bottle_price", "notes", "nose", "palate", "finish", "would_drink_again", "would_order_again", "would_buy_bottle", "personal_value_rating", "context"];
  const out = {};
  for (const f of fields) if (b[f] !== undefined) out[f] = b[f];
  return out;
}

async function resolveVenue(env, b) {
  if (b.venue_id) return b.venue_id;
  if (!b.venue) return null;
  const v = b.venue;
  if (v.id) return v.id;
  if (v.name) {
    const existing = await first(env, "SELECT id FROM venues WHERE name = ? AND city IS ?", v.name, v.city || null);
    if (existing) return existing.id;
    const res = await run(env, "INSERT INTO venues (name, venue_type, address, city, state_region, country, lat, lon, is_private) VALUES (?,?,?,?,?,?,?,?,?)",
      v.name, v.venue_type || "other", v.address || null, v.city || null, v.state_region || null, v.country || null, v.lat ?? null, v.lon ?? null, v.is_private ? 1 : 0);
    return res.meta.last_row_id;
  }
  return null;
}

async function createTasting(request, env) {
  const b = await body(request);
  if (!b.bottle_id) return json({ error: "bottle_id is required" }, 400);
  const venueId = await resolveVenue(env, b);
  const f = tastingFieldsFromBody(b);
  f.venue_id = venueId;
  const cols = Object.keys(f);
  const res = await run(env, `INSERT INTO tastings (${cols.join(",")}, data_source) VALUES (${cols.map(() => "?").join(",")}, ?)`, ...cols.map((c) => f[c]), "user");
  const id = res.meta.last_row_id;
  if (Array.isArray(b.flavor_tags) && b.flavor_tags.length) await setTastingFlavorTags(env, id, b.flavor_tags);
  const tasting = await first(env, "SELECT * FROM tastings WHERE id = ?", id);
  return json({ tasting });
}

async function setTastingFlavorTags(env, tastingId, tagNames) {
  await run(env, "DELETE FROM tasting_flavor_tags WHERE tasting_id = ?", tastingId);
  for (const name of tagNames) {
    const tag = await first(env, "SELECT id FROM flavor_tags WHERE name = ?", name);
    if (tag) await run(env, "INSERT OR IGNORE INTO tasting_flavor_tags (tasting_id, flavor_tag_id) VALUES (?, ?)", tastingId, tag.id);
  }
}

async function updateTasting(id, request, env) {
  const b = await body(request);
  const venueId = b.venue || b.venue_id ? await resolveVenue(env, b) : undefined;
  const f = tastingFieldsFromBody(b);
  if (venueId !== undefined) f.venue_id = venueId;
  const setClauses = Object.keys(f).map((k) => `${k} = ?`);
  const params = Object.values(f);
  if (setClauses.length) await run(env, `UPDATE tastings SET ${setClauses.join(", ")} WHERE id = ?`, ...params, id);
  if (Array.isArray(b.flavor_tags)) await setTastingFlavorTags(env, id, b.flavor_tags);
  const tasting = await first(env, "SELECT * FROM tastings WHERE id = ?", id);
  return json({ tasting });
}

async function deleteTasting(id, env) {
  await run(env, "DELETE FROM tasting_flavor_tags WHERE tasting_id = ?", id);
  await run(env, "DELETE FROM tastings WHERE id = ?", id);
  return json({ ok: true });
}

// ---------- venues ----------

async function listVenues(env) {
  const venues = await all(env, `
    SELECT v.*, COUNT(t.id) as tasting_count, AVG(t.rating) as avg_rating, MAX(t.tasted_at) as last_visit
    FROM venues v LEFT JOIN tastings t ON t.venue_id = v.id
    GROUP BY v.id ORDER BY tasting_count DESC`);
  return json({ venues: venues.map((v) => ({ ...v, avg_rating: v.avg_rating != null ? Math.round(v.avg_rating * 10) / 10 : null })) });
}

async function createVenue(request, env) {
  const b = await body(request);
  if (!b.name) return json({ error: "name is required" }, 400);
  const res = await run(env, "INSERT INTO venues (name, venue_type, address, city, state_region, country, lat, lon, is_private) VALUES (?,?,?,?,?,?,?,?,?)",
    b.name, b.venue_type || "other", b.address || null, b.city || null, b.state_region || null, b.country || null, b.lat ?? null, b.lon ?? null, b.is_private ? 1 : 0);
  const venue = await first(env, "SELECT * FROM venues WHERE id = ?", res.meta.last_row_id);
  return json({ venue });
}

// ---------- distilleries ----------

async function listDistilleries(env) {
  const distilleries = await all(env, `
    SELECT d.*, COUNT(b.id) as bottle_count
    FROM distilleries d LEFT JOIN bottles b ON b.distillery_id = d.id
    GROUP BY d.id ORDER BY d.name ASC`);
  return json({ distilleries });
}

async function createDistillery(request, env) {
  const b = await body(request);
  if (!b.name) return json({ error: "name is required" }, 400);
  const res = await run(env, "INSERT INTO distilleries (name, producer, bottler, city, state_region, country, lat, lon, is_sourced_whiskey, notes, source, confidence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    b.name, b.producer || null, b.bottler || null, b.city || null, b.state_region || null, b.country || null, b.lat ?? null, b.lon ?? null, b.is_sourced_whiskey ? 1 : 0, b.notes || null, b.source || "manual", b.confidence || "medium");
  const distillery = await first(env, "SELECT * FROM distilleries WHERE id = ?", res.meta.last_row_id);
  return json({ distillery });
}

async function updateDistillery(id, request, env) {
  const b = await body(request);
  const fields = ["name", "producer", "bottler", "city", "state_region", "country", "lat", "lon", "is_sourced_whiskey", "notes", "confidence"];
  const setClauses = [];
  const params = [];
  for (const f of fields) if (b[f] !== undefined) { setClauses.push(`${f} = ?`); params.push(b[f]); }
  setClauses.push("updated_at = datetime('now')");
  if (setClauses.length) await run(env, `UPDATE distilleries SET ${setClauses.join(", ")} WHERE id = ?`, ...params, id);
  const distillery = await first(env, "SELECT * FROM distilleries WHERE id = ?", id);
  return json({ distillery });
}

// ---------- flavor tags / brand signals ----------

async function listFlavorTags(env) {
  const tags = await all(env, "SELECT * FROM flavor_tags ORDER BY category, name");
  return json({ flavor_tags: tags });
}

async function listBrandSignals(env) {
  const signals = await all(env, "SELECT * FROM brand_signals ORDER BY brand");
  return json({ brand_signals: signals });
}

// ---------- palate / match ----------

async function getPalateProfile(env) {
  const profile = await computeProfile(env);
  const entries = Object.entries(profile).sort((a, b) => b[1].affinity - a[1].affinity);
  return json({ profile: Object.fromEntries(entries), topPositive: entries.filter(([, v]) => v.affinity >= 60).slice(0, 10), topNegative: entries.filter(([, v]) => v.affinity <= 40).slice(0, 10) });
}

async function postMatch(request, env) {
  const b = await body(request);
  const profile = await computeProfile(env);
  const brandSignals = await all(env, "SELECT brand, sentiment FROM brand_signals");
  const liked = await attachFlavorTags(env, await all(env, "SELECT id, name, category, status_tags FROM bottles WHERE status_tags LIKE '%favorite%' OR status_tags LIKE '%\"like\"%'"));
  const disliked = await attachFlavorTags(env, await all(env, "SELECT id, name, category, status_tags FROM bottles WHERE status_tags LIKE '%dislike%' OR status_tags LIKE '%avoid%'"));

  let candidate = b.candidate;
  if (!candidate && b.bottleId) {
    const bottle = await first(env, "SELECT * FROM bottles WHERE id = ?", b.bottleId);
    if (!bottle) return json({ error: "bottle not found" }, 404);
    const [withTags] = await attachFlavorTags(env, [bottle]);
    candidate = { flavorTags: withTags.flavor_tags, proof: withTags.proof, brand: withTags.brand, category: withTags.category };
  }
  if (!candidate) return json({ error: "candidate or bottleId required" }, 400);

  const match = scoreMatch(candidate, profile, brandSignals, liked, disliked);
  return json({ match });
}

// ---------- bottle photos ----------

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

async function putBottlePhoto(id, request, env) {
  const bottle = await first(env, "SELECT id FROM bottles WHERE id = ?", id);
  if (!bottle) return json({ error: "Not found" }, 404);

  const b = await body(request);
  const dataUrl = String(b.dataUrl || "");
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!match) return json({ error: "Send a JPEG, PNG, or WEBP image as a base64 data URL." }, 400);
  const [, mime, base64] = match;
  if (Math.ceil((base64.length * 3) / 4) > MAX_PHOTO_BYTES) return json({ error: "Image must be 3 MB or smaller after downscaling." }, 413);

  await run(env, `INSERT INTO bottle_images (bottle_id, mime, data, source, updated_at) VALUES (?,?,?,?, datetime('now'))
    ON CONFLICT(bottle_id) DO UPDATE SET mime = excluded.mime, data = excluded.data, source = excluded.source, updated_at = datetime('now')`,
    id, mime, base64, "user_photo");

  // Cache-bust so an updated photo replaces the old one in already-loaded views.
  const url = `/api/images/${id}?v=${Date.now()}`;
  await run(env, "UPDATE bottles SET image_url = ?, image_source = 'user_photo', image_confidence = 'high', updated_at = datetime('now') WHERE id = ?", url, id);
  return json({ ok: true, image_url: url });
}

async function deleteBottlePhoto(id, env) {
  await run(env, "DELETE FROM bottle_images WHERE bottle_id = ?", id);
  await run(env, "UPDATE bottles SET image_url = NULL, image_source = NULL, image_confidence = NULL, updated_at = datetime('now') WHERE id = ?", id);
  return json({ ok: true });
}

async function getBottleImage(id, env) {
  const row = await first(env, "SELECT mime, data FROM bottle_images WHERE bottle_id = ?", id);
  if (!row) return json({ error: "Not found" }, 404);
  const binary = atob(row.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Response(bytes, {
    headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable" }
  });
}

// ---------- barcode lookup ----------

async function lookupBarcode(code, env) {
  const existing = await first(env, "SELECT * FROM bottles WHERE barcode = ?", code);
  if (existing) return json({ found: true, source: "internal", confidence: "high", bottle: existing });

  const providers = [lookupUpcItemDb, lookupOpenFoodFacts];
  for (const provider of providers) {
    try {
      const result = await provider(code);
      if (result) return json({ found: true, ...result });
    } catch (err) {
      console.error("barcode provider failed", err);
    }
  }
  return json({ found: false, barcode: code });
}

async function lookupUpcItemDb(code) {
  const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.items && data.items[0];
  if (!item) return null;
  return {
    source: "upcitemdb",
    sourceUrl: `https://www.upcitemdb.com/upc/${code}`,
    confidence: "medium",
    draft: {
      name: item.title || null,
      brand: item.brand || null,
      barcode: code,
      image_url: item.images && item.images[0] || null,
      image_source: "barcode_api",
      image_confidence: "medium",
      description: item.description || null
    }
  };
}

async function lookupOpenFoodFacts(code) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  return {
    source: "openfoodfacts",
    sourceUrl: `https://world.openfoodfacts.org/product/${code}`,
    confidence: "low",
    draft: {
      name: p.product_name || null,
      brand: p.brands || null,
      barcode: code,
      image_url: p.image_url || null,
      image_source: "barcode_api",
      image_confidence: "low",
      description: p.generic_name || null
    }
  };
}

// ---------- search ----------

async function globalSearch(url, env) {
  const q = url.searchParams.get("q");
  if (!q || q.length < 2) return json({ results: [] });
  const like = `%${q}%`;
  const [bottles, distilleries, venues, tastings, flavorTags] = await Promise.all([
    all(env, "SELECT id, name, brand, category FROM bottles WHERE name LIKE ? OR brand LIKE ? OR barcode = ? LIMIT 10", like, like, q),
    all(env, "SELECT id, name, city, state_region FROM distilleries WHERE name LIKE ? OR city LIKE ? OR state_region LIKE ? LIMIT 10", like, like, like),
    all(env, "SELECT id, name, city FROM venues WHERE name LIKE ? OR city LIKE ? LIMIT 10", like, like),
    all(env, "SELECT t.id, t.bottle_id, b.name as bottle_name, t.notes FROM tastings t JOIN bottles b ON b.id = t.bottle_id WHERE t.notes LIKE ? LIMIT 10", like),
    all(env, "SELECT id, name, category FROM flavor_tags WHERE name LIKE ? LIMIT 10", like)
  ]);
  return json({ results: { bottles, distilleries, venues, tastings, flavor_tags: flavorTags } });
}

// ---------- stats ----------

async function getStats(env) {
  const [bottleCount] = await all(env, "SELECT COUNT(*) as n FROM bottles");
  const [tastingCount] = await all(env, "SELECT COUNT(*) as n FROM tastings WHERE rating IS NOT NULL");
  const [distilleryCount] = await all(env, "SELECT COUNT(DISTINCT distillery_id) as n FROM bottles WHERE distillery_id IS NOT NULL");
  const [stateCount] = await all(env, "SELECT COUNT(DISTINCT origin_state) as n FROM bottles WHERE origin_state IS NOT NULL");
  const [countryCount] = await all(env, "SELECT COUNT(DISTINCT origin_country) as n FROM bottles WHERE origin_country IS NOT NULL");
  const topVenues = await all(env, `SELECT v.name, COUNT(t.id) as tasting_count, AVG(t.rating) as avg_rating FROM tastings t JOIN venues v ON v.id = t.venue_id GROUP BY v.id ORDER BY tasting_count DESC LIMIT 5`);
  const topStates = await all(env, `SELECT origin_state, AVG(avg_rating) as avg_rating, COUNT(*) as n FROM (SELECT b.origin_state, b.id, AVG(t.rating) as avg_rating FROM bottles b JOIN tastings t ON t.bottle_id = b.id WHERE t.rating IS NOT NULL AND b.origin_state IS NOT NULL GROUP BY b.id) GROUP BY origin_state ORDER BY avg_rating DESC LIMIT 5`);
  return json({
    bottleCount: bottleCount.n, tastingCount: tastingCount.n, distilleryCount: distilleryCount.n,
    stateCount: stateCount.n, countryCount: countryCount.n, topVenues, topStates
  });
}

// ---------- export / import ----------

async function exportJson(env, url) {
  const [bottles, tastings, venues, distilleries, flavorTags, brandSignals] = await Promise.all([
    all(env, "SELECT * FROM bottles"), all(env, "SELECT * FROM tastings"), all(env, "SELECT * FROM venues"),
    all(env, "SELECT * FROM distilleries"), all(env, "SELECT * FROM flavor_tags"), all(env, "SELECT * FROM brand_signals")
  ]);
  const payload = { exported_at: new Date().toISOString(), bottles, tastings, venues, distilleries, flavor_tags: flavorTags, brand_signals: brandSignals };
  // Photos are opt-in: they're base64 and would dominate the file size otherwise.
  if (url && url.searchParams.get("include_images") === "1") {
    payload.bottle_images = await all(env, "SELECT * FROM bottle_images");
  }
  return json(payload);
}

async function exportCsv(env) {
  const rows = await all(env, `
    SELECT t.id as tasting_id, b.name as bottle, b.category, t.tasted_at, t.rating, t.serving_style,
           v.name as venue, v.city as venue_city, t.price_paid, t.notes
    FROM tastings t JOIN bottles b ON b.id = t.bottle_id LEFT JOIN venues v ON v.id = t.venue_id
    ORDER BY t.tasted_at DESC`);
  const headers = ["tasting_id", "bottle", "category", "tasted_at", "rating", "serving_style", "venue", "venue_city", "price_paid", "notes"];
  const csvEscape = (v) => v == null ? "" : `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=pour-profile-export.csv" } });
}

async function importJson(request, env) {
  const data = await body(request);
  let imported = { bottles: 0, tastings: 0, venues: 0, distilleries: 0 };
  const distilleryIdMap = new Map();
  for (const d of data.distilleries || []) {
    const res = await run(env, "INSERT INTO distilleries (name, producer, bottler, city, state_region, country, lat, lon, is_sourced_whiskey, notes, source, confidence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      d.name, d.producer || null, d.bottler || null, d.city || null, d.state_region || null, d.country || null, d.lat ?? null, d.lon ?? null, d.is_sourced_whiskey || 0, d.notes || null, "import", d.confidence || "medium");
    distilleryIdMap.set(d.id, res.meta.last_row_id);
    imported.distilleries++;
  }
  const venueIdMap = new Map();
  for (const v of data.venues || []) {
    const res = await run(env, "INSERT INTO venues (name, venue_type, address, city, state_region, country, lat, lon, is_private) VALUES (?,?,?,?,?,?,?,?,?)",
      v.name, v.venue_type || "other", v.address || null, v.city || null, v.state_region || null, v.country || null, v.lat ?? null, v.lon ?? null, v.is_private || 0);
    venueIdMap.set(v.id, res.meta.last_row_id);
    imported.venues++;
  }
  const bottleIdMap = new Map();
  for (const b of data.bottles || []) {
    const res = await run(env, `INSERT INTO bottles (name, brand, expression, category, subcategory, distillery_id, origin_country, origin_state, age_statement, proof, abv, mash_bill, barrel_finish, msrp, street_price, release_type, bottle_size_ml, barcode, image_url, image_source, image_confidence, producer_url, description, category_attrs, status_tags, data_source, source_confidence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      b.name, b.brand || null, b.expression || null, b.category || "other", b.subcategory || null,
      b.distillery_id ? distilleryIdMap.get(b.distillery_id) || null : null, b.origin_country || null, b.origin_state || null,
      b.age_statement || null, b.proof ?? null, b.abv ?? null, b.mash_bill || null, b.barrel_finish || null,
      b.msrp ?? null, b.street_price ?? null, b.release_type || null, b.bottle_size_ml ?? null, b.barcode || null,
      b.image_url || null, b.image_source || null, b.image_confidence || null, b.producer_url || null, b.description || null,
      typeof b.category_attrs === "string" ? b.category_attrs : JSON.stringify(b.category_attrs || {}),
      typeof b.status_tags === "string" ? b.status_tags : JSON.stringify(b.status_tags || []), "import", b.source_confidence || "medium");
    bottleIdMap.set(b.id, res.meta.last_row_id);
    imported.bottles++;
  }
  for (const t of data.tastings || []) {
    const newBottleId = bottleIdMap.get(t.bottle_id) || t.bottle_id;
    await run(env, `INSERT INTO tastings (bottle_id, tasted_at, rating, serving_style, pour_size_oz, venue_id, price_paid, bottle_price, notes, nose, palate, finish, would_drink_again, would_order_again, would_buy_bottle, personal_value_rating, context, data_source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      newBottleId, t.tasted_at || null, t.rating ?? null, t.serving_style || null, t.pour_size_oz ?? null,
      t.venue_id ? venueIdMap.get(t.venue_id) || null : null, t.price_paid ?? null, t.bottle_price ?? null,
      t.notes || null, t.nose || null, t.palate || null, t.finish || null, t.would_drink_again ?? null,
      t.would_order_again ?? null, t.would_buy_bottle ?? null, t.personal_value_rating ?? null, t.context || null, "import");
    imported.tastings++;
  }
  return json({ imported });
}

// ---------- AI note assist (optional, requires OPENAI_API_KEY secret) ----------

async function analyzeImage(request, env) {
  if (!env.OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY Worker secret is not configured." }, 503);
  let payload;
  try { payload = await request.json(); } catch { return json({ error: "Request must be JSON." }, 400); }
  const imageDataUrl = String(payload.imageDataUrl || "");
  const mimeType = String(payload.mimeType || "");
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mimeType)) return json({ error: "Use a JPEG, PNG, or WEBP image." }, 400);
  if (!imageDataUrl.startsWith("data:image/")) return json({ error: "Missing image data URL." }, 400);
  const base64 = imageDataUrl.split(",")[1] || "";
  if (Math.ceil((base64.length * 3) / 4) > 5 * 1024 * 1024) return json({ error: "Image must be 5 MB or smaller." }, 413);

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: "You are reading a photo of a spirits bottle label for a personal bourbon/whiskey/spirits tracking app. Extract what you can read. Return concise JSON." },
          { type: "input_image", image_url: imageDataUrl }
        ]
      }],
      text: {
        format: {
          type: "json_schema", name: "bottle_label_read",
          schema: {
            type: "object", additionalProperties: false,
            properties: {
              brand: { type: "string" }, expression: { type: "string" }, category: { type: "string" },
              proof: { type: "string" }, ageStatement: { type: "string" }, notes: { type: "string" },
              confidence: { type: "number" }
            },
            required: ["brand", "expression", "category", "proof", "ageStatement", "notes", "confidence"]
          }
        }
      }
    })
  });
  const result = await openAiResponse.json().catch(() => ({}));
  if (!openAiResponse.ok) return json({ error: result.error?.message || "OpenAI image analysis failed." }, openAiResponse.status);
  const text = result.output_text || result.output?.flatMap((item) => item.content || []).find((part) => part.type === "output_text")?.text;
  try { return json(JSON.parse(text)); } catch { return json({ error: "Unexpected response.", raw: text || "" }, 502); }
}
