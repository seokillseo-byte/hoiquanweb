-- Track the staff/admin owner responsible for each lead.
ALTER TABLE leads ADD COLUMN assigned_to TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status_created
  ON leads(assigned_to, status, created_at DESC);
