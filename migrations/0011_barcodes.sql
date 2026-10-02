-- Barcode -> bottle/catalog-item links, plus a cache of Open Food Facts product data.
--
-- This table already exists in production (created ad-hoc, like bottles.catalog_id in
-- 0009). This file records it so a database rebuilt from migrations matches live.
-- Everything is IF NOT EXISTS, so running it against production changes nothing.
--
-- `barcode` is stored normalised to 13 digits (UPC-A gets a leading 0), except EAN-8.
-- `source`: 'user' (explicit link: verified=1, confidence high), 'openfoodfacts' (cached
-- lookup: confidence low), or whatever an importer wrote.
-- `catalog_id` is a reference-catalog record id (text), `bottle_id` a bottles.id; either
-- or both may be set. A row with neither is a pure product cache.
--
-- NOTE: `catalog_items` also exists live, but its columns were not specified for this
-- change, so it is intentionally NOT created here; the catalog-seeding migration owns it.

CREATE TABLE IF NOT EXISTS barcodes (
  barcode      TEXT PRIMARY KEY,
  bottle_id    INTEGER,
  catalog_id   TEXT,
  source       TEXT,
  confidence   TEXT,
  product_name TEXT,
  brand        TEXT,
  size_ml      INTEGER,
  image_url    TEXT,
  verified     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_barcodes_bottle_id ON barcodes(bottle_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_catalog_id ON barcodes(catalog_id);
