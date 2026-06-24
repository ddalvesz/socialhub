-- 011_stories_beleza.sql
-- Tabela separada para stories das marcas de beleza (barbours, kokeshi, lescent).
-- Estrutura espelha o CSV: Data/Hora/Cod/Page/Merchant/Status/LinkConteudo/LinkCta/RastreioReceita/Marca

create table if not exists stories_beleza (
  id               uuid        primary key default gen_random_uuid(),
  date             date        not null,
  hora             integer     not null,
  cod              text        not null default '',
  page             text        not null default '',
  merchant         text        not null default '',
  status           text        not null default 'pendente'
                   check (status in ('postado','nao_postado','pendente')),
  link_conteudo    text,
  link_cta         text,
  rastreio_receita text,
  receita          numeric(12,2),
  marca            text        not null
                   check (marca in ('barbours','kokeshi','lescent')),
  origem           text        not null default 'csv_import',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists stories_beleza_date_idx  on stories_beleza (date);
create index if not exists stories_beleza_marca_idx on stories_beleza (marca);
create index if not exists stories_beleza_status_idx on stories_beleza (status);
create index if not exists stories_beleza_cod_idx   on stories_beleza (cod);

create or replace function set_stories_beleza_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stories_beleza_updated_at on stories_beleza;
create trigger stories_beleza_updated_at
  before update on stories_beleza
  for each row execute function set_stories_beleza_updated_at();
