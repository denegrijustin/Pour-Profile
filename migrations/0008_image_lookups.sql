-- Image lookup state for bottles and for the hidden reference catalog.
--
-- The research exports shipped 317 records with a producer page each and ZERO
-- image URLs (`direct_image_url` empty on every row, `image_verified` FALSE on
-- every row) — the researcher explicitly declined to guess them. The seeded
-- bottles never had photos either. This table records what an automated lookup
-- found for each subject so a run can resume, and so a weak match can be shown
-- to a human instead of silently applied.
--
-- Keyed by (subject_kind, subject_id) because both kinds need the same
-- bookkeeping but store their bytes in different places: a bottle's photo goes
-- through the existing bottle_images/R2 path so it behaves exactly like one the
-- user took, while a catalog record's photo lives in R2 under catalog/<id>.
--
-- `status` is deliberately three-valued rather than a boolean:
--   ok            -- a confident match; bytes stored, image_url points at ours
--   needs_review  -- candidates were found but none matched confidently enough
--   failed        -- nothing usable was found at all
-- `needs_review` is the whole point: the brief forbids showing a generic
-- category photo or the wrong expression, so an uncertain match waits.

DROP TABLE IF EXISTS catalog_images;

CREATE TABLE IF NOT EXISTS image_lookups (
  subject_kind TEXT NOT NULL,          -- 'bottle' | 'catalog'
  subject_id   TEXT NOT NULL,
  status       TEXT NOT NULL,
  image_url    TEXT,                   -- the third-party URL the bytes came from
  source_page  TEXT,
  r2_key       TEXT,
  mime         TEXT,
  bytes        INTEGER,
  confidence   REAL DEFAULT 0,
  match_reason TEXT,
  candidates   TEXT DEFAULT '[]',
  attempted_at TEXT,
  updated_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (subject_kind, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_image_lookups_status ON image_lookups(status);
