-- Outside opinion: critic scores, community averages, published tasting descriptions.
--
-- Deliberately kept in its own table and NEVER fed into the palate engines. The
-- whole point of this app is learning what *you* like, and the crowd disagreeing
-- with you is signal, not error — Four Roses reviews well and Justin dislikes it.
-- External scores are shown alongside your own as a contrast ("critics 91 /
-- your palate 42"), which is exactly the "good wine" vs "good wine for me"
-- distinction in Lady's profile.
--
-- is_manual = 1 means a human typed it in (shelf talker, back label, an app they
-- were looking at). That is the primary path, because no free API supplies
-- community ratings with tasting notes across both spirits and wine:
-- Whiskybase/Whiskystats/Grapeminds/Wine-Searcher are paid, and Vivino has no
-- public API. Automated providers can be added later without schema changes.
CREATE TABLE IF NOT EXISTS external_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER NOT NULL,
  source TEXT NOT NULL,             -- e.g. 'Vivino (typed in)', 'Wine Spectator', 'Distiller'
  source_url TEXT,
  score REAL,
  scale TEXT NOT NULL DEFAULT '100',-- '100', '5', '10' — scores are not comparable across scales
  review_count INTEGER,
  description TEXT,                 -- published tasting description, if any
  is_manual INTEGER NOT NULL DEFAULT 1,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_external_ratings_bottle ON external_ratings(bottle_id);
