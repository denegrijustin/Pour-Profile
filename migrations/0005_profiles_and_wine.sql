-- Multi-profile support + wine.
--
-- Two structural changes here:
--
-- 1. Opinions become per-profile. A bottle is a shared catalog entry, but status
--    ("favorite", "want_to_try") and tastings are personal. Pooling two people's
--    ratings into one palate model would corrupt both, so status moves out of
--    bottles.status_tags into bottle_status(profile_id, bottle_id) and tastings
--    gain a profile_id. The bottles.status_tags column is left in place for
--    backwards compatibility but is no longer read.
--
-- 2. Wine is modelled dimensionally and PER VARIETAL, not as flavor tags. What
--    someone likes in Sauvignon Blanc does not predict Chardonnay, so a profile
--    row is keyed (profile_id, varietal, dimension). The '_all' pseudo-varietal
--    holds cross-varietal carryover and is weighted lower by the scorer.

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  focus TEXT NOT NULL DEFAULT 'both',
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO profiles (id, slug, display_name, focus) VALUES
 (1, 'justin', 'Justin', 'spirits'),
 (2, 'lady', 'Lady', 'wine');

CREATE TABLE IF NOT EXISTS bottle_status (
  profile_id INTEGER NOT NULL,
  bottle_id INTEGER NOT NULL,
  status_tags TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, bottle_id)
);

-- Everything that existed before multi-profile belonged to Justin.
INSERT OR IGNORE INTO bottle_status (profile_id, bottle_id, status_tags)
SELECT 1, id, status_tags FROM bottles WHERE status_tags IS NOT NULL AND status_tags != '[]';

ALTER TABLE tastings ADD COLUMN profile_id INTEGER NOT NULL DEFAULT 1;

ALTER TABLE bottles ADD COLUMN varietal TEXT;
ALTER TABLE bottles ADD COLUMN vintage INTEGER;
ALTER TABLE bottles ADD COLUMN appellation TEXT;
-- Observed 0-10 values for this wine, e.g. {"acidity":8,"fruit_intensity":7}
ALTER TABLE bottles ADD COLUMN wine_dimensions TEXT DEFAULT '{}';

CREATE TABLE IF NOT EXISTS wine_palate_dimensions (
  profile_id INTEGER NOT NULL,
  varietal TEXT NOT NULL,
  dimension TEXT NOT NULL,
  target_value REAL,                       -- 0-10; NULL means genuinely unknown
  confidence INTEGER NOT NULL DEFAULT 0,   -- 0-5, mirrors the star rating
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'hypothesis', -- 'hypothesis' | 'learned' | 'manual'
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, varietal, dimension)
);

-- ---------------------------------------------------------------------------
-- Lady's wine profile v1.0.
-- Two anchor wines, both stated as "Like" with NO rating yet — ratings are
-- deliberately left NULL rather than invented, per the app's no-fabrication rule.
-- ---------------------------------------------------------------------------

INSERT INTO bottles (name, brand, expression, category, subcategory, varietal, origin_country, origin_state, appellation, status_tags, description, wine_dimensions, data_source, source_confidence) VALUES
('Matanzas Creek Sauvignon Blanc', 'Matanzas Creek Winery', 'Sauvignon Blanc', 'wine', 'white', 'sauvignon_blanc', 'USA', 'California', 'Sonoma County', '[]', 'One of Lady''s two anchor wines (status: Like). California Sauvignon Blanc. No rating recorded yet — next time she drinks it, log a 1-10 rating and what she particularly liked or disliked to make this a calibrated reference wine.', '{}', 'seed_known_like', 'medium'),
('Unshackled Sauvignon Blanc', 'Unshackled (The Prisoner Wine Company)', 'Sauvignon Blanc', 'wine', 'white', 'sauvignon_blanc', 'USA', 'California', 'California', '[]', 'One of Lady''s two anchor wines (status: Like). California Sauvignon Blanc. No rating recorded yet — next time she drinks it, log a 1-10 rating and what she particularly liked or disliked to make this a calibrated reference wine.', '{}', 'seed_known_like', 'medium');

INSERT OR REPLACE INTO bottle_status (profile_id, bottle_id, status_tags)
SELECT 2, id, '["tried","like"]' FROM bottles WHERE name IN ('Matanzas Creek Sauvignon Blanc', 'Unshackled Sauvignon Blanc');

-- Dimensional hypotheses, with her stated confidence (★ count -> 0-5).
-- Explicitly-unknown dimensions are stored with a NULL target so the scorer
-- contributes nothing for them rather than guessing a middle value.
INSERT OR REPLACE INTO wine_palate_dimensions (profile_id, varietal, dimension, target_value, confidence, notes, source) VALUES
 (2, 'sauvignon_blanc', 'fruit_intensity', 7,    4, 'Medium-high.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'fruit_character', NULL, 4, 'Ripe citrus + tropical/stone fruit. Descriptive rather than a 0-10 scale.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'sweetness',       2,    4, 'Dry, but fruit-forward. Scale: 0 = bone dry, 10 = dessert sweet.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'acidity',         6,    3, 'Medium to medium-high.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'body',            6,    3, 'Medium / some substance. Should not feel thin.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'herbal_green',    4,    3, 'Some okay, probably not dominant. High values = grassy/vegetal.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'minerality',      NULL, 1, 'Unknown.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'oak',             NULL, 1, 'Unknown in whites.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'creaminess',      NULL, 1, 'Unknown.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'alcohol_warmth',  5,    2, 'Probably moderate.', 'hypothesis'),
 (2, 'sauvignon_blanc', 'finish',          6,    3, 'Clean, flavorful, not austere.', 'hypothesis');
