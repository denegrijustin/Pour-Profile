-- Pour Profile: initial schema
-- Bottle = the product. Tasting = a specific pour/experience with it.

CREATE TABLE IF NOT EXISTS distilleries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  producer TEXT,
  bottler TEXT,
  city TEXT,
  state_region TEXT,
  country TEXT,
  lat REAL,
  lon REAL,
  is_sourced_whiskey INTEGER DEFAULT 0,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  confidence TEXT DEFAULT 'medium',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS venues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  venue_type TEXT DEFAULT 'other',
  address TEXT,
  city TEXT,
  state_region TEXT,
  country TEXT,
  lat REAL,
  lon REAL,
  is_private INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bottles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT,
  expression TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  subcategory TEXT,
  distillery_id INTEGER REFERENCES distilleries(id),
  origin_country TEXT,
  origin_state TEXT,
  age_statement TEXT,
  proof REAL,
  abv REAL,
  mash_bill TEXT,
  barrel_finish TEXT,
  msrp REAL,
  street_price REAL,
  release_type TEXT,
  bottle_size_ml INTEGER,
  barcode TEXT,
  image_url TEXT,
  image_source TEXT,
  image_confidence TEXT,
  producer_url TEXT,
  description TEXT,
  category_attrs TEXT DEFAULT '{}',
  status_tags TEXT NOT NULL DEFAULT '[]',
  data_source TEXT DEFAULT 'manual',
  source_confidence TEXT DEFAULT 'medium',
  user_edited_fields TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bottles_barcode ON bottles(barcode);
CREATE INDEX IF NOT EXISTS idx_bottles_category ON bottles(category);
CREATE INDEX IF NOT EXISTS idx_bottles_distillery ON bottles(distillery_id);

CREATE TABLE IF NOT EXISTS flavor_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS bottle_flavor_tags (
  bottle_id INTEGER NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  flavor_tag_id INTEGER NOT NULL REFERENCES flavor_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bottle_id, flavor_tag_id)
);

CREATE TABLE IF NOT EXISTS tastings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  tasted_at TEXT,
  rating REAL,
  serving_style TEXT,
  pour_size_oz REAL,
  venue_id INTEGER REFERENCES venues(id),
  price_paid REAL,
  bottle_price REAL,
  notes TEXT,
  nose TEXT,
  palate TEXT,
  finish TEXT,
  would_drink_again INTEGER,
  would_order_again INTEGER,
  would_buy_bottle INTEGER,
  personal_value_rating REAL,
  context TEXT,
  data_source TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tastings_bottle ON tastings(bottle_id);
CREATE INDEX IF NOT EXISTS idx_tastings_venue ON tastings(venue_id);

CREATE TABLE IF NOT EXISTS tasting_flavor_tags (
  tasting_id INTEGER NOT NULL REFERENCES tastings(id) ON DELETE CASCADE,
  flavor_tag_id INTEGER NOT NULL REFERENCES flavor_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (tasting_id, flavor_tag_id)
);

-- Brand-level preference signal, independent of any single bottle (e.g. "generally like Rabbit Hole").
CREATE TABLE IF NOT EXISTS brand_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
