ALTER TABLE mh_posts       ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false NOT NULL;
ALTER TABLE branding_posts ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false NOT NULL;
ALTER TABLE tiktok_posts   ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false NOT NULL;
ALTER TABLE twitter_posts  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false NOT NULL;
ALTER TABLE canal_posts    ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false NOT NULL;
ALTER TABLE copa_posts     ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false NOT NULL;
