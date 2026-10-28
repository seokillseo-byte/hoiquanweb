PRAGMA foreign_keys = ON;

-- Explicit application roles are assigned out-of-band by an authorized operator.
-- Public sign-up must never write to this table.
CREATE TABLE IF NOT EXISTS app_user_roles (
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','staff','customer')),
  assigned_by TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  PRIMARY KEY (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_role ON app_user_roles(role, user_id);

-- Link Better Auth identities to CRM customers. Membership is the only basis
-- for customer-portal access; request-supplied customer IDs are never trusted.
CREATE TABLE IF NOT EXISTS crm_customer_members (
  customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  membership_role TEXT NOT NULL DEFAULT 'owner' CHECK(membership_role IN ('owner','member','billing')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (customer_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_crm_customer_members_user ON crm_customer_members(user_id, customer_id);
