#!/usr/bin/env node
// Generate idempotent SQL that loads catalog-research.js into D1.
//
//   node tools/seed-catalog-db.mjs                  # all SQL to stdout
//   node tools/seed-catalog-db.mjs --out seed       # chunked files in ./seed (gitignored)
//   node tools/seed-catalog-db.mjs --out seed --chunk 50
//
// Apply (the lead does this; this tool never touches a database):
//   for f in seed/catalog-items-*.sql seed/barcodes-*.sql; do
//     wrangler d1 execute pour-profile-db --remote --file=$f; done
//
// Rules:
//  * Every statement is INSERT ... ON CONFLICT DO UPDATE, so re-running is safe.
//  * Fields that live enrichment owns are never clobbered: image_r2_key is not
//    touched, image_url only fills when currently NULL.
//  * "unspecified"-style nulls stay NULL (see import-catalog.mjs).
//  * barcodes: any UPC/EAN present in the catalog, plus a set-based backfill from
//    bottles.barcode (resolved on the database itself, since bottles are live data).
//    verified=1 rows are never overwritten.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DATA_SOURCE = "catalog-research";

// ---------- SQL literals ----------

export function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}
export function sqlNum(v) {
  if (v === null || v === undefined || v === "") return "NULL";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "NULL";
}

// ---------- mapping ----------

/** Lead flavor descriptors, parsed from the research summary ("led by a, b, c."). */
export function deriveFlavorTags(rec) {
  const m = String(rec.tasting_profile?.summary || "").match(/\bled by ([^.]+)\./i);
  if (!m) return [];
  return m[1].split(/,|\band\b/).map((s) => s.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean).slice(0, 8);
}

/** One catalog record -> catalog_items column values. */
export function catalogRow(rec) {
  const price = rec.typical_price_usd || {};
  return {
    id: rec.id,
    name: rec.name,
    producer: rec.producer ?? null,
    category: rec.category,
    subcategory: rec.subcategory ?? null,
    region: rec.region ?? null,
    age_statement: rec.age_statement ?? null,
    proof: rec.proof ?? null,
    abv: rec.abv ?? null,
    mash_bill: rec.mash_bill ?? null,
    typical_price: price.typical ?? price.street ?? null,
    msrp: price.msrp ?? null,
    jd_fit: rec.ratings?.jd_fit ?? null,
    verdict: rec.research?.verdict ?? null,
    recommended: rec.recommendation?.recommended ? 1 : 0,
    flavor_tags: JSON.stringify(deriveFlavorTags(rec)),
    tasting_profile: JSON.stringify(rec.tasting_profile ?? {}),
    research: JSON.stringify(rec.research ?? {}),
    image_url: rec.image?.primary_url ?? null,
    data_source: DATA_SOURCE
  };
}

const COLS = ["id", "name", "producer", "category", "subcategory", "region", "age_statement", "proof", "abv", "mash_bill",
  "typical_price", "msrp", "jd_fit", "verdict", "recommended", "flavor_tags", "tasting_profile", "research", "image_url", "data_source"];
const NUMERIC = new Set(["proof", "abv", "typical_price", "msrp", "jd_fit", "recommended"]);
// Columns refreshed on conflict. image_url is fill-only; image_r2_key is untouched.
const UPDATE = COLS.filter((c) => c !== "id" && c !== "image_url");

export function catalogItemsSql(recs) {
  const values = recs.map((r) => {
    const row = catalogRow(r);
    return "(" + COLS.map((c) => (NUMERIC.has(c) ? sqlNum(row[c]) : sqlStr(row[c]))).join(", ") + ")";
  });
  if (!values.length) return "";
  return `INSERT INTO catalog_items (${COLS.join(", ")})\nVALUES\n${values.join(",\n")}\nON CONFLICT(id) DO UPDATE SET\n  ` +
    UPDATE.map((c) => `${c} = excluded.${c}`).join(",\n  ") +
    `,\n  image_url = COALESCE(catalog_items.image_url, excluded.image_url),\n  updated_at = datetime('now');\n`;
}

// ---------- barcodes ----------

const isCode = (s) => /^\d{8,14}$/.test(String(s || ""));

/** Barcode rows present in the catalog itself (barcode.upc / barcode.ean). */
export function catalogBarcodeRows(recs) {
  const rows = [];
  for (const r of recs) {
    for (const code of [r.barcode?.upc, r.barcode?.ean]) {
      if (!isCode(code)) continue;
      rows.push({
        barcode: String(code), catalog_id: r.id, source: r.barcode.source || "catalog-research",
        confidence: r.barcode.verified ? "high" : "medium", product_name: r.name, brand: r.producer ?? null,
        size_ml: null, image_url: null, verified: r.barcode.verified ? 1 : 0
      });
    }
  }
  return rows;
}

/** Upsert statement for barcode rows. Never overwrites verified rows. */
export function barcodesSql(rows) {
  if (!rows.length) return "";
  const cols = ["barcode", "catalog_id", "source", "confidence", "product_name", "brand", "size_ml", "image_url", "verified"];
  const values = rows.map((r) => `(${sqlStr(r.barcode)}, ${sqlStr(r.catalog_id)}, ${sqlStr(r.source)}, ${sqlStr(r.confidence)}, ` +
    `${sqlStr(r.product_name)}, ${sqlStr(r.brand)}, ${sqlNum(r.size_ml)}, ${sqlStr(r.image_url)}, ${sqlNum(r.verified)})`);
  const upd = cols.filter((c) => c !== "barcode").map((c) => `${c} = excluded.${c}`).join(", ");
  return `INSERT INTO barcodes (${cols.join(", ")})\nVALUES\n${values.join(",\n")}\nON CONFLICT(barcode) DO UPDATE SET ${upd}\n  WHERE barcodes.verified = 0;\n`;
}

/** Backfill from bottles.barcode, resolved on the database. Idempotent. */
export function bottlesBackfillSql() {
  return `INSERT INTO barcodes (barcode, bottle_id, catalog_id, source, confidence, product_name, brand, size_ml, image_url, verified)
SELECT TRIM(barcode), id, CASE WHEN catalog_id IN (SELECT id FROM catalog_items) THEN catalog_id END, 'bottles', 'medium', name, brand, bottle_size_ml, image_url, 0
FROM bottles
WHERE barcode IS NOT NULL AND TRIM(barcode) <> ''
ON CONFLICT(barcode) DO UPDATE SET
  bottle_id = excluded.bottle_id,
  catalog_id = COALESCE(excluded.catalog_id, barcodes.catalog_id)
  WHERE barcodes.verified = 0;
`;
}

// ---------- chunking / output ----------

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n));

/** -> [{ file, sql }] ordered so catalog_items load before barcodes. */
export function buildSeed(recs, { chunkSize = 100 } = {}) {
  const files = [];
  chunk(recs, chunkSize).forEach((c, i) => files.push({ file: `catalog-items-${String(i + 1).padStart(2, "0")}.sql`, sql: catalogItemsSql(c) }));
  const bcChunks = chunk(catalogBarcodeRows(recs), chunkSize);
  bcChunks.forEach((c, i) => files.push({ file: `barcodes-${String(i + 1).padStart(2, "0")}.sql`, sql: barcodesSql(c) }));
  files.push({ file: `barcodes-${String(bcChunks.length + 1).padStart(2, "0")}-from-bottles.sql`, sql: bottlesBackfillSql() });
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name, d) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : d; };
  const { RESEARCH_CATALOG } = await import("../catalog-research.js");
  const files = buildSeed(RESEARCH_CATALOG, { chunkSize: Number(opt("--chunk", 100)) });
  const out = opt("--out");
  if (!out) { process.stdout.write(files.map((f) => `-- ${f.file}\n${f.sql}`).join("\n")); return; }
  fs.mkdirSync(out, { recursive: true });
  for (const f of files) fs.writeFileSync(path.join(out, f.file), f.sql);
  console.error(`catalog_items: ${RESEARCH_CATALOG.length} rows, barcodes from catalog: ${catalogBarcodeRows(RESEARCH_CATALOG).length}, ${files.length} files in ${out}/`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
