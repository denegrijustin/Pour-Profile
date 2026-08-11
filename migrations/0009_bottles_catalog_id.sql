-- Link a bottle back to the reference-catalog record it was adopted from.
--
-- This column already existed in production — it was added ad-hoc when catalog
-- adoption was built and never captured as a migration, so a database rebuilt
-- from migrations alone was missing it and every adopt call failed with
-- "no such column: catalog_id". Caught by running the Worker against a fresh
-- local D1.
--
-- It carries real weight beyond bookkeeping: it is how an enriched catalog photo
-- finds the bottle to attach itself to, and how the recommendation list knows a
-- pick is already in the collection so it stops re-offering it.

ALTER TABLE bottles ADD COLUMN catalog_id TEXT;

CREATE INDEX IF NOT EXISTS idx_bottles_catalog_id ON bottles(catalog_id);
