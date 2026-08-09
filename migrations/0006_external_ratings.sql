-- Outside opinion: critic scores, community averages, published tasting descriptions.
--
-- Deliberately kept in its own table and NEVER fed into the palate engines. The
-- whole point of this app is learning what *you* like, and the crowd disagreeing
-- with you is signal, not error — Four Roses reviews well and Justin dislikes it.
-- External scores are shown alongside your own as a contrast ("critics 91 /
-- your palate 42"), which is exactly the "good wine" vs "good wine for me"
-- distinction in Lady's profile.
--
-- Everything here is DISCRETE — a source from a closed enum, a numeric score on
-- that source's own scale, and descriptors drawn from the existing flavor
-- taxonomy / wine dimensions. No free text, so entries stay aggregatable.
--
-- Note the split: a SCORE is an outside verdict and never touches the palate
-- models, but DESCRIPTORS describe the bottle itself, so they seed the bottle's
-- flavor tags / wine dimensions (without overwriting the user's own). That is
-- what makes a never-tasted bottle scoreable at all.
CREATE TABLE IF NOT EXISTS external_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER NOT NULL,
  source TEXT NOT NULL,             -- closed enum, see rating-sources.js
  source_url TEXT,
  score REAL,
  scale TEXT NOT NULL DEFAULT '100',-- taken from the source definition, never from input
  review_count INTEGER,
  descriptors TEXT NOT NULL DEFAULT '{}', -- discrete only: {"dimensions":{...}} or {"flavor_tags":[...]}
  is_manual INTEGER NOT NULL DEFAULT 1,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_external_ratings_bottle ON external_ratings(bottle_id);
