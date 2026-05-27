-- 003_normalize_time.sql
-- Normaliza o campo `time` TEXT para formato HH:mm em todas as tabelas de posts.
-- Casos tratados:
--   NULL ou ''          → '12:00'
--   '9:00', '8:30'      → '09:00', '08:30'  (zero à esquerda)
--   '17', '8'           → '17:00', '08:00'  (sem minutos)
--   '17:00:00'          → '17:00'           (com segundos)
--   '17:00' já correto  → sem alteração

CREATE OR REPLACE FUNCTION normalize_time(t TEXT)
RETURNS TEXT AS $$
DECLARE
  parts TEXT[];
  hh    TEXT;
  mm    TEXT;
BEGIN
  -- Nulo ou vazio → padrão
  IF t IS NULL OR trim(t) = '' THEN
    RETURN '12:00';
  END IF;

  -- Remove segundos se existirem (HH:mm:ss → HH:mm)
  t := substring(trim(t) FROM 1 FOR 5);

  -- Divide pelo ':'
  parts := string_to_array(t, ':');

  hh := lpad(parts[1], 2, '0');
  mm := COALESCE(lpad(parts[2], 2, '0'), '00');

  -- Validação básica
  IF hh::int NOT BETWEEN 0 AND 23 OR mm::int NOT BETWEEN 0 AND 59 THEN
    RETURN '12:00';
  END IF;

  RETURN hh || ':' || mm;
EXCEPTION WHEN OTHERS THEN
  RETURN '12:00';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Aplica normalização em todas as tabelas
UPDATE mh_posts       SET time = normalize_time(time) WHERE time IS DISTINCT FROM normalize_time(time);
UPDATE branding_posts SET time = normalize_time(time) WHERE time IS DISTINCT FROM normalize_time(time);
UPDATE tiktok_posts   SET time = normalize_time(time) WHERE time IS DISTINCT FROM normalize_time(time);
UPDATE twitter_posts  SET time = normalize_time(time) WHERE time IS DISTINCT FROM normalize_time(time);
UPDATE canal_posts    SET time = normalize_time(time) WHERE time IS DISTINCT FROM normalize_time(time);
UPDATE copa_posts     SET time = normalize_time(time) WHERE time IS DISTINCT FROM normalize_time(time);

-- Adiciona constraint CHECK em cada tabela para evitar formatos inválidos no futuro
ALTER TABLE mh_posts       DROP CONSTRAINT IF EXISTS mh_posts_time_format;
ALTER TABLE mh_posts       ADD  CONSTRAINT mh_posts_time_format       CHECK (time ~ '^\d{2}:\d{2}$');

ALTER TABLE branding_posts DROP CONSTRAINT IF EXISTS branding_posts_time_format;
ALTER TABLE branding_posts ADD  CONSTRAINT branding_posts_time_format CHECK (time ~ '^\d{2}:\d{2}$');

ALTER TABLE tiktok_posts   DROP CONSTRAINT IF EXISTS tiktok_posts_time_format;
ALTER TABLE tiktok_posts   ADD  CONSTRAINT tiktok_posts_time_format   CHECK (time ~ '^\d{2}:\d{2}$');

ALTER TABLE twitter_posts  DROP CONSTRAINT IF EXISTS twitter_posts_time_format;
ALTER TABLE twitter_posts  ADD  CONSTRAINT twitter_posts_time_format  CHECK (time ~ '^\d{2}:\d{2}$');

ALTER TABLE canal_posts    DROP CONSTRAINT IF EXISTS canal_posts_time_format;
ALTER TABLE canal_posts    ADD  CONSTRAINT canal_posts_time_format    CHECK (time ~ '^\d{2}:\d{2}$');

ALTER TABLE copa_posts     DROP CONSTRAINT IF EXISTS copa_posts_time_format;
ALTER TABLE copa_posts     ADD  CONSTRAINT copa_posts_time_format     CHECK (time ~ '^\d{2}:\d{2}$');
