-- Reference catalog + barcode index in D1.
--
-- Both tables already exist in the live database (created ad hoc); this file records
-- them, matching the live DDL exactly, so a database rebuilt from migrations matches.
-- Every statement is IF NOT EXISTS, so applying it to live is a no-op.
--
-- catalog_items is populated from catalog-research.js by tools/seed-catalog-db.mjs.
-- barcodes.confidence is text: 'low' | 'medium' | 'high'. verified=1 rows are never
-- overwritten by the seed tools.

CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  producer TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  subcategory TEXT,
  region TEXT,
  age_statement TEXT,
  proof REAL,
  abv REAL,
  mash_bill TEXT,
  typical_price REAL,
  msrp REAL,
  jd_fit REAL,
  verdict TEXT,
  recommended INTEGER NOT NULL DEFAULT 0,
  flavor_tags TEXT NOT NULL DEFAULT '[]',
  tasting_profile TEXT NOT NULL DEFAULT '{}',
  research TEXT NOT NULL DEFAULT '{}',
  image_url TEXT,
  image_r2_key TEXT,
  data_source TEXT NOT NULL DEFAULT 'research_import',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON catalog_items(category);

CREATE TABLE IF NOT EXISTS barcodes (
  barcode TEXT PRIMARY KEY,
  bottle_id INTEGER REFERENCES bottles(id) ON DELETE CASCADE,
  catalog_id TEXT REFERENCES catalog_items(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  confidence TEXT NOT NULL DEFAULT 'medium',
  product_name TEXT,
  brand TEXT,
  size_ml INTEGER,
  image_url TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_barcodes_bottle ON barcodes(bottle_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_catalog ON barcodes(catalog_id);
