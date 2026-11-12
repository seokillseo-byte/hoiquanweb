PRAGMA foreign_keys = ON;

-- Immutable snapshots make content edits and publication transitions auditable.
CREATE TABLE IF NOT EXISTS cms_revisions (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('pages','posts','services')),
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created','updated','published','archived')),
  actor_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cms_revisions_resource_time
  ON cms_revisions(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_revisions_actor_time
  ON cms_revisions(actor_id, created_at DESC);
