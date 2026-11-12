PRAGMA foreign_keys = ON;

-- Template metadata stays distinct from CMS pages/posts/services.
-- Verification flags are explicit operator attestations; they do not imply
-- automated legal or compatibility verification by the platform.
ALTER TABLE cms_templates ADD COLUMN category TEXT NOT NULL DEFAULT '';
ALTER TABLE cms_templates ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE cms_templates ADD COLUMN version TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE cms_templates ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE cms_templates ADD COLUMN thumbnail_url TEXT;
ALTER TABLE cms_templates ADD COLUMN license_verified INTEGER NOT NULL DEFAULT 0 CHECK(license_verified IN (0, 1));
ALTER TABLE cms_templates ADD COLUMN preview_verified INTEGER NOT NULL DEFAULT 0 CHECK(preview_verified IN (0, 1));

CREATE INDEX IF NOT EXISTS idx_cms_templates_category
  ON cms_templates(status, category, template_type, published_at DESC);

CREATE TABLE IF NOT EXISTS cms_template_revisions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES cms_templates(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK(action IN ('created','updated','published','archived')),
  actor_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cms_template_revisions_time
  ON cms_template_revisions(template_id, created_at DESC);
