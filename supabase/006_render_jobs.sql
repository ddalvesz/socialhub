-- ============================================================
-- 006_render_jobs.sql
-- Fila de execuções da automação semanal de render de vídeos.
-- Cada clique no botão "Gerar vídeos da semana" no SocialHub cria
-- uma linha aqui. O n8n atualiza status conforme processa.
-- ============================================================

CREATE TABLE IF NOT EXISTS render_jobs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_inicio       date NOT NULL,
  triggered_by        uuid REFERENCES auth.users(id),
  status              text NOT NULL DEFAULT 'queued',
  videos_processados  int  NOT NULL DEFAULT 0,
  videos_falhos       int  NOT NULL DEFAULT 0,
  dropbox_url         text,
  error_message       text,
  payload             jsonb,
  started_at          timestamptz,
  ended_at            timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT render_jobs_status_check
    CHECK (status IN ('queued','running','done','error'))
);

CREATE INDEX IF NOT EXISTS idx_render_jobs_semana   ON render_jobs(semana_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status   ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created  ON render_jobs(created_at DESC);

ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_render_jobs"
  ON render_jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS render_jobs_updated_at ON render_jobs;
CREATE TRIGGER render_jobs_updated_at
  BEFORE UPDATE ON render_jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
