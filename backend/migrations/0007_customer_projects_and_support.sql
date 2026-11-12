PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS crm_orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE RESTRICT,
  quote_id TEXT UNIQUE REFERENCES crm_quotes(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','in_progress','completed','cancelled')),
  currency TEXT NOT NULL DEFAULT 'VND' CHECK(length(currency) = 3),
  total_minor INTEGER NOT NULL CHECK(total_minor >= 0),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_orders_customer_time ON crm_orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_orders_status_time ON crm_orders(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS crm_projects (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE RESTRICT,
  order_id TEXT REFERENCES crm_orders(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 180),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 10000),
  status TEXT NOT NULL DEFAULT 'planning' CHECK(status IN ('planning','in_progress','review','completed','on_hold','cancelled')),
  start_date TEXT,
  due_date TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_projects_customer_time ON crm_projects(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_projects_status_time ON crm_projects(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS crm_project_milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES crm_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 180),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 5000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','review','approved','blocked')),
  due_date TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_project_milestones_order ON crm_project_milestones(project_id, sort_order, due_date);

CREATE TABLE IF NOT EXISTS crm_project_comments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES crm_projects(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('staff','customer')),
  visibility TEXT NOT NULL DEFAULT 'customer' CHECK(visibility IN ('customer','internal')),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 10000),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_project_comments_time ON crm_project_comments(project_id, visibility, created_at DESC);

CREATE TABLE IF NOT EXISTS crm_tickets (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE RESTRICT,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL CHECK(length(subject) BETWEEN 2 AND 180),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 10000),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','waiting_customer','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_tickets_customer_time ON crm_tickets(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_tickets_status_time ON crm_tickets(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS crm_ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES crm_tickets(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('staff','customer')),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 10000),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_ticket_messages_time ON crm_ticket_messages(ticket_id, created_at ASC);
