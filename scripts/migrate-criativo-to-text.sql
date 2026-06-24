-- Rodar no Supabase Studio > SQL Editor

-- Garantir que `criativo` é text (já pode estar como text — sem erro)
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'lives' AND column_name = 'criativo') = 'boolean' THEN
    ALTER TABLE lives ALTER COLUMN criativo TYPE text USING '';
    ALTER TABLE lives ALTER COLUMN criativo SET DEFAULT '';
  END IF;
END $$;

-- Adicionar coluna `hora` (HH:mm) na tabela lives
ALTER TABLE lives
  ADD COLUMN IF NOT EXISTS hora text;
