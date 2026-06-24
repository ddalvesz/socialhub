-- Migration: adiciona colunas específicas do canal (WhatsApp/Telegram) em canal_posts

alter table canal_posts add column if not exists cupom       text not null default '';
alter table canal_posts add column if not exists cupom_utm   text not null default '';
alter table canal_posts add column if not exists revenue     numeric(12,2);
alter table canal_posts add column if not exists receita_utm numeric(12,2);
