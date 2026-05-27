-- ============================================================
-- MIGRAÇÃO: Novas tabelas separadas por fonte de conteúdo
-- Substitui a tabela `posts` monolítica
-- Ano base: 2026
-- ============================================================

-- ─── Limpar dados antigos da tabela posts ───────────────────
-- Execute SOMENTE após importar e validar as novas tabelas
-- TRUNCATE TABLE posts;

-- ============================================================
-- 1. TABELA: mh_posts  (Máquina de Hits — Instagram Reels)
-- ============================================================
CREATE TABLE IF NOT EXISTS mh_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner           text NOT NULL,
  month           int,
  date            date NOT NULL,
  time            text DEFAULT '12:00',
  title           text NOT NULL DEFAULT '',
  format          text DEFAULT 'Reels',
  platform        text DEFAULT 'ig',
  product         text DEFAULT '',
  campaign        text DEFAULT '',
  tags            text[] DEFAULT '{}',
  ref             text DEFAULT '',
  status          text DEFAULT 'prod',
  link            text DEFAULT '',
  obs             text DEFAULT '',
  deadline        text DEFAULT '',
  caption         text DEFAULT '',
  video_link      text DEFAULT '',
  cover_link      text DEFAULT '',
  -- MH-specific
  semana          int,
  num_video       int,
  audio           text DEFAULT '',
  prazo           text DEFAULT '',
  dropbox_link    text DEFAULT '',
  briefing_file   text DEFAULT '',
  -- Links entre posts (ex: IG ↔ TikTok)
  linked_post_id     uuid,
  linked_post_source text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 2. TABELA: branding_posts  (Branding — Instagram)
-- ============================================================
CREATE TABLE IF NOT EXISTS branding_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner           text NOT NULL,
  month           int,
  date            date NOT NULL,
  time            text DEFAULT '12:00',
  title           text NOT NULL DEFAULT '',
  format          text DEFAULT '',
  platform        text DEFAULT 'ig',
  product         text DEFAULT '',
  campaign        text DEFAULT '',
  tags            text[] DEFAULT '{}',
  ref             text DEFAULT '',
  status          text DEFAULT 'prod',
  link            text DEFAULT '',
  obs             text DEFAULT '',
  deadline        text DEFAULT '',
  caption         text DEFAULT '',
  video_link      text DEFAULT '',
  cover_link      text DEFAULT '',
  linked_post_id     uuid,
  linked_post_source text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 3. TABELA: tiktok_posts
-- ============================================================
CREATE TABLE IF NOT EXISTS tiktok_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner           text NOT NULL,
  month           int,
  date            date NOT NULL,
  time            text DEFAULT '12:00',
  title           text NOT NULL DEFAULT '',
  format          text DEFAULT 'Vídeo',
  platform        text DEFAULT 'tiktok',
  product         text DEFAULT '',
  campaign        text DEFAULT '',
  tags            text[] DEFAULT '{}',
  ref             text DEFAULT '',
  status          text DEFAULT 'prod',
  link            text DEFAULT '',
  obs             text DEFAULT '',
  deadline        text DEFAULT '',
  caption         text DEFAULT '',
  video_link      text DEFAULT '',
  cover_link      text DEFAULT '',
  linked_post_id     uuid,
  linked_post_source text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 4. TABELA: twitter_posts
-- ============================================================
CREATE TABLE IF NOT EXISTS twitter_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner           text NOT NULL,
  month           int,
  date            date NOT NULL,
  time            text DEFAULT '09:00',
  title           text NOT NULL DEFAULT '',
  format          text DEFAULT 'Imagem',
  platform        text DEFAULT 'twitter',
  product         text DEFAULT '',
  campaign        text DEFAULT '',
  tags            text[] DEFAULT '{}',
  ref             text DEFAULT '',
  status          text DEFAULT 'prod',
  link            text DEFAULT '',
  obs             text DEFAULT '',
  deadline        text DEFAULT '',
  caption         text DEFAULT '',
  video_link      text DEFAULT '',
  cover_link      text DEFAULT '',
  linked_post_id     uuid,
  linked_post_source text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 5. TABELA: canal_posts  (Canal de Transmissão — Instagram)
-- ============================================================
CREATE TABLE IF NOT EXISTS canal_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner           text NOT NULL,
  month           int,
  date            date NOT NULL,
  time            text DEFAULT '09:00',
  title           text NOT NULL DEFAULT '',
  format          text DEFAULT 'Texto',
  platform        text DEFAULT 'canal',
  product         text DEFAULT '',
  campaign        text DEFAULT '',
  tags            text[] DEFAULT '{}',
  ref             text DEFAULT '',
  status          text DEFAULT 'prod',
  link            text DEFAULT '',
  obs             text DEFAULT '',
  deadline        text DEFAULT '',
  caption         text DEFAULT '',
  video_link      text DEFAULT '',
  cover_link      text DEFAULT '',
  linked_post_id     uuid,
  linked_post_source text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 6. TABELA: copa_posts  (Copa do Mundo 2026)
-- ============================================================
CREATE TABLE IF NOT EXISTS copa_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner           text NOT NULL,
  month           int,
  date            date NOT NULL,
  time            text DEFAULT '18:30',
  title           text NOT NULL DEFAULT '',
  format          text DEFAULT '',
  platform        text DEFAULT 'ig',
  product         text DEFAULT '',
  campaign        text DEFAULT '',
  tags            text[] DEFAULT '{}',
  ref             text DEFAULT '',
  status          text DEFAULT 'prod',
  link            text DEFAULT '',
  obs             text DEFAULT '',
  deadline        text DEFAULT '',
  caption         text DEFAULT '',
  video_link      text DEFAULT '',
  cover_link      text DEFAULT '',
  linked_post_id     uuid,
  linked_post_source text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mh_posts_date      ON mh_posts(date);
CREATE INDEX IF NOT EXISTS idx_mh_posts_owner     ON mh_posts(owner);
CREATE INDEX IF NOT EXISTS idx_mh_posts_status    ON mh_posts(status);

CREATE INDEX IF NOT EXISTS idx_branding_posts_date   ON branding_posts(date);
CREATE INDEX IF NOT EXISTS idx_branding_posts_owner  ON branding_posts(owner);

CREATE INDEX IF NOT EXISTS idx_tiktok_posts_date     ON tiktok_posts(date);
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_owner    ON tiktok_posts(owner);

CREATE INDEX IF NOT EXISTS idx_twitter_posts_date    ON twitter_posts(date);

CREATE INDEX IF NOT EXISTS idx_canal_posts_date      ON canal_posts(date);

CREATE INDEX IF NOT EXISTS idx_copa_posts_date       ON copa_posts(date);

-- ============================================================
-- VIEW: calendar_posts  (leitura unificada para o calendário)
-- ============================================================
CREATE OR REPLACE VIEW calendar_posts AS
  SELECT
    id, 'mh'       AS source,
    owner, month, date, time, title, format, platform,
    product, campaign, tag, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source,
    created_at
  FROM mh_posts
UNION ALL
  SELECT
    id, 'branding' AS source,
    owner, month, date, time, title, format, platform,
    product, campaign, tag, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source,
    created_at
  FROM branding_posts
UNION ALL
  SELECT
    id, 'tiktok'   AS source,
    owner, month, date, time, title, format, platform,
    product, campaign, tag, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source,
    created_at
  FROM tiktok_posts
UNION ALL
  SELECT
    id, 'twitter'  AS source,
    owner, month, date, time, title, format, platform,
    product, campaign, tag, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source,
    created_at
  FROM twitter_posts
UNION ALL
  SELECT
    id, 'canal'    AS source,
    owner, month, date, time, title, format, platform,
    product, campaign, tag, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source,
    created_at
  FROM canal_posts
UNION ALL
  SELECT
    id, 'copa'     AS source,
    owner, month, date, time, title, format, platform,
    product, campaign, tag, ref, status, link, obs,
    deadline, caption, video_link, cover_link,
    linked_post_id, linked_post_source,
    created_at
  FROM copa_posts;

-- ============================================================
-- RLS (Row Level Security) — mesma política da tabela posts
-- ============================================================
ALTER TABLE mh_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE canal_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE copa_posts     ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário autenticado
CREATE POLICY mh_posts_select      ON mh_posts      FOR SELECT TO authenticated USING (true);
CREATE POLICY branding_posts_select ON branding_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY tiktok_posts_select   ON tiktok_posts   FOR SELECT TO authenticated USING (true);
CREATE POLICY twitter_posts_select  ON twitter_posts  FOR SELECT TO authenticated USING (true);
CREATE POLICY canal_posts_select    ON canal_posts    FOR SELECT TO authenticated USING (true);
CREATE POLICY copa_posts_select     ON copa_posts     FOR SELECT TO authenticated USING (true);

-- Escrita: qualquer usuário autenticado
CREATE POLICY mh_posts_all      ON mh_posts      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY branding_posts_all ON branding_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY tiktok_posts_all   ON tiktok_posts   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY twitter_posts_all  ON twitter_posts  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY canal_posts_all    ON canal_posts    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY copa_posts_all     ON copa_posts     FOR ALL TO authenticated USING (true) WITH CHECK (true);
