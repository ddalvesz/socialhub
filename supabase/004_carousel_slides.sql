-- Adiciona suporte a slides de carrossel em todas as tabelas de posts
-- Cada post no formato "Carrossel" pode ter até 10 links de imagem

ALTER TABLE mh_posts       ADD COLUMN IF NOT EXISTS slide_links text[] DEFAULT '{}';
ALTER TABLE branding_posts  ADD COLUMN IF NOT EXISTS slide_links text[] DEFAULT '{}';
ALTER TABLE tiktok_posts    ADD COLUMN IF NOT EXISTS slide_links text[] DEFAULT '{}';
ALTER TABLE twitter_posts   ADD COLUMN IF NOT EXISTS slide_links text[] DEFAULT '{}';
ALTER TABLE canal_posts     ADD COLUMN IF NOT EXISTS slide_links text[] DEFAULT '{}';
ALTER TABLE copa_posts      ADD COLUMN IF NOT EXISTS slide_links text[] DEFAULT '{}';
