-- Migration: adiciona suporte multi-marca
-- Cada tabela de conteúdo recebe uma coluna brand (default 'gocase' para dados existentes)

-- ── Tabela de marcas ────────────────────────────────────────────
create table if not exists brands (
  id     serial primary key,
  slug   text unique not null,
  name   text not null,
  color  text,
  active boolean default true
);

insert into brands (slug, name, color) values
  ('gocase',   'Gocase',    '#F97316'),
  ('barbours', 'Barbour''s', '#EF4444'),
  ('kokeshi',  'Kokeshi',   '#EC4899'),
  ('lescent',  'Lescent',   '#4B5563')
on conflict (slug) do nothing;

-- ── Coluna brand nas tabelas de conteúdo ────────────────────────
alter table mh_posts               add column if not exists brand text not null default 'gocase';
alter table branding_posts         add column if not exists brand text not null default 'gocase';
alter table tiktok_posts           add column if not exists brand text not null default 'gocase';
alter table twitter_posts          add column if not exists brand text not null default 'gocase';
alter table canal_posts            add column if not exists brand text not null default 'gocase';
alter table copa_posts             add column if not exists brand text not null default 'gocase';
alter table campaigns              add column if not exists brand text not null default 'gocase';
alter table collections            add column if not exists brand text not null default 'gocase';
alter table lives                  add column if not exists brand text not null default 'gocase';
alter table stories                add column if not exists brand text not null default 'gocase';
alter table stories_day_aggregates add column if not exists brand text not null default 'gocase';
alter table merchans               add column if not exists brand text not null default 'gocase';
alter table event_dates            add column if not exists brand text not null default 'gocase';
alter table futebol_events         add column if not exists brand text not null default 'gocase';
alter table products               add column if not exists brand text not null default 'gocase';

-- ── Índices para performance ─────────────────────────────────────
create index if not exists idx_mh_posts_brand               on mh_posts (brand);
create index if not exists idx_branding_posts_brand         on branding_posts (brand);
create index if not exists idx_tiktok_posts_brand           on tiktok_posts (brand);
create index if not exists idx_twitter_posts_brand          on twitter_posts (brand);
create index if not exists idx_canal_posts_brand            on canal_posts (brand);
create index if not exists idx_copa_posts_brand             on copa_posts (brand);
create index if not exists idx_campaigns_brand              on campaigns (brand);
create index if not exists idx_collections_brand            on collections (brand);
create index if not exists idx_lives_brand                  on lives (brand);
create index if not exists idx_stories_brand                on stories (brand);
create index if not exists idx_stories_day_aggregates_brand on stories_day_aggregates (brand);
create index if not exists idx_merchans_brand               on merchans (brand);
create index if not exists idx_event_dates_brand            on event_dates (brand);
create index if not exists idx_futebol_events_brand         on futebol_events (brand);
create index if not exists idx_products_brand               on products (brand);
