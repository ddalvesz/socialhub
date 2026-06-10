-- 008_stories_day_aggregates.sql
-- Agrega métricas de alcance/visualizações por dia (dados não atribuíveis a stories individuais após 24h)

create table if not exists stories_day_aggregates (
  id                   uuid        primary key default gen_random_uuid(),
  date                 date        not null unique,
  alcance              integer     not null default 0,
  visualizacoes        integer     not null default 0,
  respostas            integer     not null default 0,
  compartilhamentos    integer     not null default 0,
  visitas_perfil       integer     not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists stories_day_aggregates_date_idx on stories_day_aggregates (date);

create or replace function set_stories_day_aggregates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stories_day_aggregates_updated_at on stories_day_aggregates;
create trigger stories_day_aggregates_updated_at
  before update on stories_day_aggregates
  for each row execute function set_stories_day_aggregates_updated_at();
