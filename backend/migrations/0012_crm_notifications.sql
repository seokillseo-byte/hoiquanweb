PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS crm_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_notifications_user_created
  ON crm_notifications(user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_crm_notifications_user_unread
  ON crm_notifications(user_id, read_at, created_at DESC);
