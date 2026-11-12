PRAGMA foreign_keys = ON;

-- Durable outbox: lead data remains in leads; this table stores only delivery state.
CREATE TABLE IF NOT EXISTS crm_email_outbox (
  id TEXT PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  next_attempt_at TEXT NOT NULL,
  lease_until TEXT,
  provider_message_id TEXT,
  last_error_code TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_email_outbox_due
  ON crm_email_outbox(status, next_attempt_at, created_at);
