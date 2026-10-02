import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { RESEARCH_CATALOG } from "../catalog-research.js";
import { buildSeed, catalogRow, catalogBarcodeRows, barcodesSql } from "../tools/seed-catalog-db.mjs";
import { matchProduct, validGtin, expand, searchUrl, parseSizeMl, pickSample, RateLimited } from "../tools/expand-barcodes.mjs";

function freshDb() {
  const db = new DatabaseSync(":memory:");
  for (const f of readdirSync(new URL("../migrations/", import.meta.url)).sort()) {
    db.exec(readFileSync(new URL("../migrations/" + f, import.meta.url), "utf8"));
  }
  return db;
}
const apply = (db, files) => files.forEach((f) => db.exec(f.sql));
const count = (db, t) => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;

test("migration 0011 is idempotent and creates both tables", () => {
  const db = freshDb();
  const sql = readFileSync(new URL("../migrations/0011_catalog_items_barcodes.sql", import.meta.url), "utf8");
  db.exec(sql); db.exec(sql);
  assert.equal(count(db, "catalog_items"), 0);
  assert.equal(count(db, "barcodes"), 0);
});

test("seed loads every catalog record, and re-running is idempotent", () => {
  const db = freshDb();
  const files = buildSeed(RESEARCH_CATALOG, { chunkSize: 60 });
  assert.ok(files.filter((f) => f.file.startsWith("catalog-items-")).length > 1, "chunked");
  apply(db, files); apply(db, files);
  assert.equal(count(db, "catalog_items"), RESEARCH_CATALOG.length);
  const r = db.prepare("SELECT * FROM catalog_items WHERE id = 'penelope-toasted-bourbon'").get();
  assert.equal(r.category, "bourbon");
  assert.equal(r.recommended, 1);
  assert.equal(r.jd_fit, 97);
  assert.equal(r.typical_price, 60);
  assert.equal(r.msrp, 69.99);
  assert.equal(r.verdict, "BUY");
  assert.deepEqual(JSON.parse(r.flavor_tags).slice(0, 2), ["toasted_oak", "vanilla"]);
  assert.equal(JSON.parse(r.tasting_profile).oak, 7.75);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM catalog_items WHERE recommended=1").get().n,
    RESEARCH_CATALOG.filter((x) => x.recommendation?.recommended).length);
  // no literal "unspecified" leaked in as data
  assert.equal(db.prepare("SELECT COUNT(*) n FROM catalog_items WHERE lower(region)='unspecified'").get().n, 0);
});

test("re-seed refreshes research fields but keeps enriched images", () => {
  const db = freshDb();
  const files = buildSeed(RESEARCH_CATALOG);
  apply(db, files);
  db.prepare("UPDATE catalog_items SET image_url='https://img/x.jpg', image_r2_key='r2/x', jd_fit=1 WHERE id='penelope-toasted-bourbon'").run();
  apply(db, files);
  const r = db.prepare("SELECT image_url, image_r2_key, jd_fit FROM catalog_items WHERE id='penelope-toasted-bourbon'").get();
  assert.equal(r.image_url, "https://img/x.jpg");
  assert.equal(r.image_r2_key, "r2/x");
  assert.equal(r.jd_fit, 97);
});

test("quotes in names are escaped", () => {
  const rec = { ...RESEARCH_CATALOG[0], id: "q", name: "Maker's \"Mark\"; DROP TABLE x;--" };
  const db = freshDb();
  db.exec(buildSeed([rec])[0].sql);
  assert.equal(db.prepare("SELECT name FROM catalog_items WHERE id='q'").get().name, rec.name);
});

test("barcodes: backfilled from bottles and from catalog, verified rows protected", () => {
  const db = freshDb();
  const recs = RESEARCH_CATALOG.slice(0, 3).map((r) => structuredClone(r));
  recs[0].barcode = { upc: "012345678905", source: "manual", verified: false };
  const files = buildSeed(recs);
  assert.equal(catalogBarcodeRows(recs).length, 1);
  db.prepare("INSERT INTO bottles (name, brand, category, barcode, catalog_id, bottle_size_ml) VALUES ('B1','Br','bourbon','0099999999994',?,750)").run(recs[1].id);
  db.prepare("INSERT INTO bottles (name, category, barcode) VALUES ('NoCode','bourbon',NULL)").run();
  apply(db, files); apply(db, files);
  assert.equal(count(db, "barcodes"), 2);
  const b = db.prepare("SELECT * FROM barcodes WHERE barcode='0099999999994'").get();
  assert.equal(b.catalog_id, recs[1].id);
  assert.equal(b.size_ml, 750);
  assert.equal(b.source, "bottles");
  db.prepare("UPDATE barcodes SET verified=1, catalog_id=? WHERE barcode='012345678905'").run(recs[2].id);
  apply(db, files);
  assert.equal(db.prepare("SELECT catalog_id FROM barcodes WHERE barcode='012345678905'").get().catalog_id, recs[2].id);
});

// ---------- Open Food Facts matching ----------

const rec = (name, producer) => ({ id: name, name, producer });
const prod = (code, product_name, brands, extra = {}) => ({ code, product_name, brands, ...extra });

test("GTIN checksum", () => {
  assert.ok(validGtin("012345678905"));
  assert.ok(!validGtin("012345678906"));
  assert.ok(!validGtin("123"));
});

test("strict matching accepts exact product, rejects look-alikes", () => {
  const r = rec("Maker's Mark Cask Strength", "Maker's Mark");
  assert.ok(matchProduct(r, prod("012345678905", "Maker's Mark Cask Strength Kentucky Straight Bourbon Whisky", "Maker's Mark")));
  // plain Maker's Mark is a different bottle
  assert.equal(matchProduct(r, prod("012345678905", "Maker's Mark Kentucky Straight Bourbon", "Maker's Mark")), null);
  // extra distinctive token (46) is a different bottle
  assert.equal(matchProduct(r, prod("012345678905", "Maker's Mark 46 Cask Strength", "Maker's Mark")), null);
  // wrong brand
  assert.equal(matchProduct(r, prod("012345678905", "Maker's Mark Cask Strength", "Some Other Brand")), null);
  // bad checksum
  assert.equal(matchProduct(r, prod("012345678906", "Maker's Mark Cask Strength", "Maker's Mark")), null);
  // not a drink
  assert.equal(matchProduct(r, prod("012345678905", "Maker's Mark Cask Strength", "Maker's Mark", { categories_tags: ["en:snacks"] })), null);
  // age/proof digits are distinctive
  const old = rec("Elijah Craig 12 Year", "Elijah Craig");
  assert.equal(matchProduct(old, prod("012345678905", "Elijah Craig 18 Year", "Elijah Craig")), null);
});

test("name that is only the brand is too vague to link", () => {
  assert.equal(matchProduct(rec("Penelope", "Penelope"), prod("012345678905", "Penelope", "Penelope")), null);
});

test("expand: hits, misses, ambiguity, rate-limit stop, SQL applies", async () => {
  const a = rec("Alpha Reserve", "Alpha"), b = rec("Beta Reserve", "Beta"), c = rec("Gamma Reserve", "Gamma"), d = rec("Delta Reserve", "Delta");
  const db = {
    Alpha: [prod("012345678905", "Alpha Reserve Bourbon", "Alpha", { quantity: "750 ml", image_front_url: "https://i/a.jpg" })],
    Beta: [prod("036000291452", "Beta Reserve", "Beta")],
    Gamma: [prod("012345678905", "Gamma Reserve", "Gamma")]                    // same code as Alpha
  };
  const search = async (r) => {
    if (r.producer === "Delta") throw new RateLimited("HTTP 429");
    return db[r.producer] || [];
  };
  const out = await expand([a, b, c, d, rec("Zed Reserve", "Zed")], search, { delayMs: 0 });
  assert.equal(out.stopped, "HTTP 429");
  assert.equal(out.searched, 3);
  assert.deepEqual(out.ambiguous.map((x) => x.id).sort(), ["Alpha Reserve", "Gamma Reserve"]);
  assert.deepEqual(out.hits.map((x) => x.id), ["Beta Reserve"]);
  assert.equal(out.rows.length, 1);

  const out2 = await expand([a, rec("Zed Reserve", "Zed")], async (r) => db[r.producer] || [], { delayMs: 0 });
  assert.equal(out2.hits.length, 1);
  assert.equal(out2.misses.length, 1);
  assert.equal(out2.rows[0].size_ml, 750);
  assert.equal(out2.rows[0].source, "openfoodfacts");
  const sqlite = freshDb();
  // barcodes.catalog_id is a foreign key: the catalog is seeded before barcodes are applied.
  sqlite.prepare("INSERT INTO catalog_items (id, name) VALUES (?, ?)").run("Alpha Reserve", "Alpha Reserve");
  sqlite.exec(barcodesSql(out2.rows)); sqlite.exec(barcodesSql(out2.rows));
  const row = sqlite.prepare("SELECT * FROM barcodes").get();
  assert.equal(row.barcode, "012345678905");
  assert.equal(row.confidence, "high");
  assert.equal(row.verified, 0);
});

test("expand respects the rate-limit delay", async () => {
  const waits = [];
  await expand([rec("A1", "A"), rec("B1", "B"), rec("C1", "C")], async () => [], { delayMs: 7000, sleepImpl: async (ms) => waits.push(ms) });
  assert.deepEqual(waits, [7000, 7000]);
});

test("helpers", () => {
  assert.equal(parseSizeMl("750 ml"), 750);
  assert.equal(parseSizeMl("1,75 L"), 1750);
  assert.equal(pickSample(RESEARCH_CATALOG, 30).length, 30);
  assert.equal(new Set(pickSample(RESEARCH_CATALOG, 30).map((r) => r.id)).size, 30);
  assert.match(searchUrl(rec("Maker's Mark Cask Strength", "Maker's Mark")), /search_terms=makers\+?%?.*mark|search_terms=makers/);
  assert.equal(catalogRow(RESEARCH_CATALOG[0]).data_source, "catalog-research");
});
