PRAGMA foreign_keys = ON;

-- Extend blog posts with editorial taxonomy while keeping existing records valid.
ALTER TABLE cms_posts ADD COLUMN category TEXT NOT NULL DEFAULT '';
ALTER TABLE cms_posts ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_cms_posts_category_public
  ON cms_posts(status, category, published_at DESC, slug);
