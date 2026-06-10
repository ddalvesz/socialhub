-- 007_stories.sql
-- Tabela de stories: granularidade de um registro por produto por slot de horário.
-- Chave natural: rastreio_receita (ex: stories_2026010114_GarrafaMini)

create table if not exists stories (
  id                uuid        primary key default gen_random_uuid(),
  date              date        not null,
  hora              integer     not null,
  dia_semana        text        not null default '',
  utm               text        not null default '',
  produto           text        not null default '',
  categoria         text        not null default '',
  status            text        not null default 'nao_iniciado'
                    check (status in ('nao_iniciado','em_andamento','feito','nao_postado','proposta')),
  link_midia        text,
  link_utm          text,
  rastreio_receita  text        unique,
  receita           numeric(12,2),
  origem            text        not null default 'csv_import',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- índices úteis para filtros da view
create index if not exists stories_date_idx        on stories (date);
create index if not exists stories_status_idx      on stories (status);
create index if not exists stories_categoria_idx   on stories (categoria);
create index if not exists stories_produto_idx     on stories (produto);

-- updated_at automático
create or replace function set_stories_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stories_updated_at on stories;
create trigger stories_updated_at
  before update on stories
  for each row execute function set_stories_updated_at();
