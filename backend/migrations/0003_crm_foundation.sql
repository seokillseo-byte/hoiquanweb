PRAGMA foreign_keys = ON;

-- CRM foundation only. Protected API routes are intentionally not added by this migration.
-- Existing lead records remain intact; customer conversion is an explicit operation.
CREATE TABLE IF NOT EXISTS crm_customers (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 2 AND 180),
  organization_name TEXT NOT NULL DEFAULT '' CHECK(length(organization_name) <= 180),
  contact_email TEXT NOT NULL CHECK(length(contact_email) <= 254),
  phone TEXT NOT NULL DEFAULT '' CHECK(length(phone) <= 40),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','archived')),
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 5000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON crm_customers(contact_email);
CREATE INDEX IF NOT EXISTS idx_crm_customers_status_updated ON crm_customers(status, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_customers_lead_unique ON crm_customers(lead_id) WHERE lead_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crm_activities (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('note','call','email','meeting','status_change','system')),
  subject TEXT NOT NULL CHECK(length(subject) BETWEEN 1 AND 180),
  body TEXT NOT NULL DEFAULT '' CHECK(length(body) <= 10000),
  actor_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_activities_customer_time ON crm_activities(customer_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS crm_quotes (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE RESTRICT,
  quote_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','accepted','rejected','expired','cancelled')),
  currency TEXT NOT NULL DEFAULT 'VND' CHECK(length(currency) = 3),
  subtotal_minor INTEGER NOT NULL DEFAULT 0 CHECK(subtotal_minor >= 0),
  discount_minor INTEGER NOT NULL DEFAULT 0 CHECK(discount_minor >= 0),
  total_minor INTEGER NOT NULL DEFAULT 0 CHECK(total_minor >= 0 AND total_minor = subtotal_minor - discount_minor),
  valid_until TEXT,
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 5000),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  accepted_by TEXT,
  accepted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_customer_time ON crm_quotes(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_status_time ON crm_quotes(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS crm_quote_items (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES crm_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK(length(description) BETWEEN 1 AND 500),
  quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 100000),
  unit_price_minor INTEGER NOT NULL CHECK(unit_price_minor >= 0),
  line_total_minor INTEGER NOT NULL CHECK(line_total_minor = quantity * unit_price_minor),
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_crm_quote_items_order ON crm_quote_items(quote_id, sort_order);

CREATE TABLE IF NOT EXISTS crm_audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(length(action) BETWEEN 1 AND 100),
  resource_type TEXT NOT NULL CHECK(length(resource_type) BETWEEN 1 AND 80),
  resource_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_audit_resource_time ON crm_audit_events(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_audit_actor_time ON crm_audit_events(actor_id, created_at DESC);
