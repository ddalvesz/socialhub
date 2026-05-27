-- Migra coluna tag (text) → tags (text[]) em todas as tabelas
-- Execute no Supabase SQL Editor

-- 1. Dropa a view primeiro (depende da coluna tag)
DROP VIEW IF EXISTS calendar_posts;

-- 2. Adiciona coluna tags[] e migra dados
ALTER TABLE mh_posts       ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE branding_posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE tiktok_posts   ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE twitter_posts  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE canal_posts    ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE copa_posts     ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

UPDATE mh_posts       SET tags = ARRAY[tag] WHERE tag IS NOT NULL AND tag <> '';
UPDATE branding_posts SET tags = ARRAY[tag] WHERE tag IS NOT NULL AND tag <> '';
UPDATE tiktok_posts   SET tags = ARRAY[tag] WHERE tag IS NOT NULL AND tag <> '';
UPDATE twitter_posts  SET tags = ARRAY[tag] WHERE tag IS NOT NULL AND tag <> '';
UPDATE canal_posts    SET tags = ARRAY[tag] WHERE tag IS NOT NULL AND tag <> '';
UPDATE copa_posts     SET tags = ARRAY[tag] WHERE tag IS NOT NULL AND tag <> '';

-- 3. Remove coluna antiga
ALTER TABLE mh_posts       DROP COLUMN IF EXISTS tag;
ALTER TABLE branding_posts DROP COLUMN IF EXISTS tag;
ALTER TABLE tiktok_posts   DROP COLUMN IF EXISTS tag;
ALTER TABLE twitter_posts  DROP COLUMN IF EXISTS tag;
ALTER TABLE canal_posts    DROP COLUMN IF EXISTS tag;
ALTER TABLE copa_posts     DROP COLUMN IF EXISTS tag;

-- 4. Recria a view
CREATE OR REPLACE VIEW calendar_posts AS
  SELECT id, 'mh'       AS source, owner, month, date, time, title, format, platform,
    product, campaign, tags, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source, created_at
  FROM mh_posts
UNION ALL
  SELECT id, 'branding' AS source, owner, month, date, time, title, format, platform,
    product, campaign, tags, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source, created_at
  FROM branding_posts
UNION ALL
  SELECT id, 'tiktok'   AS source, owner, month, date, time, title, format, platform,
    product, campaign, tags, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source, created_at
  FROM tiktok_posts
UNION ALL
  SELECT id, 'twitter'  AS source, owner, month, date, time, title, format, platform,
    product, campaign, tags, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source, created_at
  FROM twitter_posts
UNION ALL
  SELECT id, 'canal'    AS source, owner, month, date, time, title, format, platform,
    product, campaign, tags, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source, created_at
  FROM canal_posts
UNION ALL
  SELECT id, 'copa'     AS source, owner, month, date, time, title, format, platform,
    product, campaign, tags, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source, created_at
  FROM copa_posts;
