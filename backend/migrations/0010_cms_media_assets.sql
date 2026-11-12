PRAGMA foreign_keys = ON;

-- CMS assets are private in R2 by default; publication is an explicit D1 state transition.
CREATE TABLE IF NOT EXISTS cms_media_assets (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('image/png','image/jpeg','image/gif','image/webp')),
  size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 5242880),
  alt_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cms_media_status_created
  ON cms_media_assets(status, created_at DESC, id);
