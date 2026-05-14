-- ================================================
-- CALENDÁRIO REDES SOCIAIS GOCASE - Supabase Schema
-- Execute este SQL no editor do Supabase
-- ================================================

-- Tabela de posts/conteúdo do calendário
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  row_type TEXT NOT NULL CHECK (row_type IN (
    'datas_importantes',
    'lancamentos',
    'futebol',
    'branding',
    'instagram',
    'instagram_maquina_hits',
    'canal_transmissao',
    'twitter_ativacoes',
    'tiktok_nativo',
    'tiktok_maquina_hits'
  )),
  content TEXT,
  status TEXT DEFAULT 'planejado' CHECK (status IN ('planejado', 'aprovado', 'publicado')),
  links JSONB DEFAULT '[]'::jsonb,
  references_text TEXT,
  comments TEXT,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX posts_date_idx ON posts(date);
CREATE INDEX posts_row_type_idx ON posts(row_type);
CREATE INDEX posts_date_row_type_idx ON posts(date, row_type);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados podem ver e editar tudo
CREATE POLICY "Authenticated users can read posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (true);
