-- 012_stories_extra_fields.sql
-- Adiciona orders, criativo e notes à tabela stories

alter table stories
  add column if not exists orders   integer,
  add column if not exists criativo text,
  add column if not exists notes    text;
