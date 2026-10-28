PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS leads (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 120),
 email TEXT NOT NULL CHECK(length(email) <= 254),
 service TEXT NOT NULL,
 budget TEXT NOT NULL DEFAULT '',
 goals TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','proposal_sent','won','lost','spam')),
 consent_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE TABLE IF NOT EXISTS lead_events (
 id TEXT PRIMARY KEY,
 lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
 event_type TEXT NOT NULL,
 details TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_created ON lead_events(lead_id, created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
 ip_hash TEXT NOT NULL,
 window_minute INTEGER NOT NULL,
 hits INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(ip_hash, window_minute)
);