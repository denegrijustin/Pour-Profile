#!/usr/bin/env node
// Find barcodes for catalog items via Open Food Facts, with strict matching.
//
//   node tools/expand-barcodes.mjs --limit 30 --out seed/off          # sample run
//   node tools/expand-barcodes.mjs --all --out seed/off                # whole catalog (slow)
//   node tools/expand-barcodes.mjs --skip-file ids.txt ...             # skip catalog ids that already have barcodes
//   node tools/expand-barcodes.mjs --replay cache.json ...             # no network, replay cached responses
//
// Writes <out>.sql (idempotent upserts into barcodes) and <out>-report.json/.txt
// (hits, misses, ambiguous). Responses are cached in <out>-cache.json so re-runs
// never re-hit the API for the same query.
//
// Politeness: OFF allows ~10 search requests/minute, so the default gap is 7s.
// Sends a descriptive User-Agent. A 429/5xx stops the run (partial results are
// still written) instead of retrying in a loop.
//
// Strictness (a wrong-bottle link is worse than no link):
//  * the OFF brand must match the catalog producer (token-equal after dropping
//    generic words), and
//  * the OFF product name, minus brand and generic words (whiskey, straight,
//    bourbon, kentucky, ...), must have the SAME distinctive tokens as the
//    catalog name. A missing OR extra token (e.g. "Barrel Proof", "Single Barrel")
//    rejects; digits (ages, proof, vintages) are always distinctive,
//  * the code must be a valid GTIN (checksum),
//  * a barcode matching two different catalog items, or one item matching two
//    different barcodes, is dropped as ambiguous.
// confidence is 0.95 for every emitted match (brand and name both strict); anything
// weaker is rejected rather than emitted at a lower score. Several codes for one item
// (different sizes of the same product) are all kept.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { barcodesSql } from "./seed-catalog-db.mjs";

export const USER_AGENT = "PourProfile-CatalogBarcodes/1.0 (personal bottle tracker; denegri.justin@gmail.com)";
const SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";
const FIELDS = "code,product_name,brands,quantity,image_front_url,categories_tags";

// ---------- normalization / matching ----------

const GENERIC = new Set(["the", "a", "an", "and", "of", "whiskey", "whisky", "bourbon", "rye", "straight", "kentucky", "tennessee",
  "american", "wine", "white", "sauvignon", "blanc", "blend", "blended", "distillery", "distillers", "distilling", "co", "company",
  "spirits", "spirit", "bottled", "in", "bond", "edition", "release", "ml", "cl", "l", "proof", "abv", "vol", "alc", "by", "de", "du", "la", "le"]);

export function norm(s) {
  return String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
export const tokens = (s) => norm(s).split(" ").filter(Boolean);
const distinctive = (s, drop = new Set()) => tokens(s).filter((t) => !GENERIC.has(t) && !drop.has(t) && !/^\d+(ml|cl|l)$/.test(t));
const setEq = (a, b) => a.length === b.length && new Set(a).size === new Set(b).size && a.every((t) => b.includes(t));

export function validGtin(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const d = code.split("").map(Number), check = d.pop();
  const sum = d.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function parseSizeMl(q) {
  const m = String(q ?? "").toLowerCase().replace(",", ".").match(/([\d.]+)\s*(ml|cl|l)\b/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Math.round(m[2] === "ml" ? n : m[2] === "cl" ? n * 10 : n * 1000);
}

/** Score one OFF product against a catalog record. -> { confidence, reason } or null. */
export function matchProduct(rec, p) {
  const code = String(p.code ?? "");
  if (!validGtin(code)) return null;
  const brandTokens = new Set(tokens(rec.producer));
  const offBrands = String(p.brands ?? "").split(",").map((b) => b.trim()).filter(Boolean);
  const recBrand = distinctive(rec.producer);
  if (!recBrand.length || !offBrands.some((b) => setEq(distinctive(b), recBrand))) return null;

  const recName = distinctive(rec.name, brandTokens);
  const offName = distinctive(p.product_name, brandTokens);
  if (!recName.length && !offName.length) return null;   // name is just the brand: too vague to link
  if (!setEq(recName, offName)) return null;

  // Alcohol-ish sanity when OFF provides categories.
  const cats = (p.categories_tags || []).join(" ");
  if (cats && !/alcohol|spirit|whisk|bourbon|wine|beverage/.test(cats)) return null;

  return { confidence: 0.95, reason: "brand and distinctive name tokens equal" };
}

// ---------- OFF client ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function searchUrl(rec) {
  const name = norm(rec.name), prod = norm(rec.producer);
  const terms = prod && !name.includes(prod) ? `${prod} ${name}` : name;
  return `${SEARCH}?search_terms=${encodeURIComponent(terms)}&search_simple=1&action=process&json=1&page_size=15&fields=${FIELDS}`;
}

export class RateLimited extends Error {}

export async function offSearch(url, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (res.status === 429 || res.status >= 500 || res.status === 403) throw new RateLimited(`HTTP ${res.status} from Open Food Facts`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.products) ? data.products : [];
}

// ---------- run ----------

/** Pick the sample: deterministic stride across the catalog so categories are mixed. */
export function pickSample(recs, limit) {
  if (!limit || limit >= recs.length) return recs;
  const step = recs.length / limit;
  return Array.from({ length: limit }, (_, i) => recs[Math.floor(i * step)]);
}

/**
 * @param search async (rec) => products[]   injectable for tests/replay
 * @returns { rows, hits, misses, ambiguous, stopped }
 */
export async function expand(recs, search, { delayMs = 7000, sleepImpl = sleep, onProgress } = {}) {
  const found = [], misses = [], errors = [];
  let stopped = null, first = true;
  for (const rec of recs) {
    if (!first && delayMs) await sleepImpl(delayMs);
    first = false;
    let products;
    try { products = await search(rec); }
    catch (e) {
      if (e instanceof RateLimited) { stopped = e.message; break; }
      errors.push({ id: rec.id, error: e.message }); continue;
    }
    const matches = [];
    for (const p of products) {
      const m = matchProduct(rec, p);
      if (m) matches.push({ rec, p, ...m });
    }
    const codes = [...new Set(matches.map((m) => m.p.code))];
    onProgress?.(rec, matches.length, products.length);
    if (!matches.length) misses.push({ id: rec.id, name: rec.name, candidates: products.length });
    else found.push({ id: rec.id, name: rec.name, matches, codes });
  }

  // Ambiguity: a code claimed by two catalog items is dropped for both.
  const codeOwners = new Map();
  for (const f of found) for (const c of f.codes) codeOwners.set(c, [...(codeOwners.get(c) || []), f.id]);
  const rows = [], hits = [], ambiguous = [];
  for (const f of found) {
    const codes = f.codes.filter((c) => codeOwners.get(c).length === 1);
    if (codes.length !== f.codes.length) { ambiguous.push({ id: f.id, name: f.name, reason: "barcode matches multiple catalog items" }); continue; }
    for (const code of codes) {
      const m = f.matches.find((x) => x.p.code === code);
      rows.push({
        barcode: code, catalog_id: f.id, source: "openfoodfacts", confidence: m.confidence,
        product_name: m.p.product_name ?? null, brand: String(m.p.brands ?? "").split(",")[0].trim() || null,
        size_ml: parseSizeMl(m.p.quantity), image_url: m.p.image_front_url ?? null, verified: 0
      });
    }
    hits.push({ id: f.id, name: f.name, codes });
  }
  return { rows, hits, misses, ambiguous, errors, searched: found.length + misses.length + errors.length, stopped };
}

export function formatReport(r) {
  const n = r.searched;
  const pct = n ? ((r.hits.length / n) * 100).toFixed(1) : "0.0";
  const lines = [`Searched ${n} items: ${r.hits.length} hits (${pct}%), ${r.misses.length} misses, ${r.ambiguous.length} ambiguous dropped, ${r.errors.length} errors`];
  if (r.stopped) lines.push(`STOPPED EARLY: ${r.stopped}`);
  lines.push("", "HITS"); r.hits.forEach((h) => lines.push(`  ${h.id}  ->  ${h.codes.join(", ")}`));
  lines.push("", "AMBIGUOUS"); r.ambiguous.forEach((h) => lines.push(`  ${h.id}: ${h.reason}`));
  lines.push("", "MISSES"); r.misses.forEach((m) => lines.push(`  ${m.id} (${m.candidates} candidates, none strict)`));
  return lines.join("\n") + "\n";
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name, d) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : d; };
  const { RESEARCH_CATALOG } = await import("../catalog-research.js");
  const out = opt("--out", "seed/off");
  const skip = new Set(opt("--skip-file") ? fs.readFileSync(opt("--skip-file"), "utf8").split(/\s+/).filter(Boolean) : []);
  let recs = RESEARCH_CATALOG.filter((r) => !skip.has(r.id) && !(r.barcode?.upc || r.barcode?.ean));
  recs = args.includes("--all") ? recs : pickSample(recs, Number(opt("--limit", 30)));

  const cachePath = opt("--replay") || `${out}-cache.json`;
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(cachePath, "utf8")); } catch { /* none yet */ }
  const replayOnly = Boolean(opt("--replay"));
  const search = async (rec) => {
    const url = searchUrl(rec);
    if (cache[url]) return cache[url];
    if (replayOnly) return [];
    const products = await offSearch(url);
    cache[url] = products;
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(cache));
    return products;
  };
  const delayMs = Number(opt("--delay-ms", 7000));
  const result = await expand(recs, search, {
    delayMs: replayOnly ? 0 : delayMs,
    onProgress: (rec, m, c) => console.error(`${rec.id}: ${m} strict / ${c} candidates`)
  });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(`${out}.sql`, result.rows.length ? barcodesSql(result.rows) : "-- no strict matches\n");
  fs.writeFileSync(`${out}-report.json`, JSON.stringify(result, null, 2));
  const report = formatReport(result);
  fs.writeFileSync(`${out}-report.txt`, report);
  process.stdout.write(report);
  if (result.stopped) process.exitCode = 2;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
