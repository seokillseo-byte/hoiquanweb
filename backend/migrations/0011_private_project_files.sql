PRAGMA foreign_keys = ON;

-- Customer project files remain private in R2 and are authorized against project membership on every request.
CREATE TABLE IF NOT EXISTS crm_project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES crm_projects(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('application/pdf','image/png','image/jpeg','image/webp','text/plain','text/csv')),
  size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 10485760),
  sha256 TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'customer' CHECK(visibility IN ('customer','internal')),
  uploaded_by TEXT NOT NULL,
  uploaded_role TEXT NOT NULL CHECK(uploaded_role IN ('admin','staff','customer')),
  created_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_project_files_project_visibility_created
  ON crm_project_files(project_id, visibility, created_at DESC, id);
