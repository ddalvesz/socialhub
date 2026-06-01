ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_archived ON campaigns (archived);
