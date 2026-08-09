-- User-supplied bottle photos.
-- Stored in D1 (base64) rather than R2 because R2 is not enabled on this account.
-- Photos are downscaled client-side (~700px, JPEG) before upload, so rows stay small.
-- Served via GET /api/images/:bottleId so bottle list payloads stay light and the
-- browser can cache them. Migrating to R2 later only requires changing the
-- storage read/write in worker.js -- bottles.image_url stays the same shape.
CREATE TABLE IF NOT EXISTS bottle_images (
  bottle_id INTEGER PRIMARY KEY,
  mime TEXT NOT NULL,
  data TEXT NOT NULL,
  source TEXT DEFAULT 'user_photo',
  updated_at TEXT DEFAULT (datetime('now'))
);
