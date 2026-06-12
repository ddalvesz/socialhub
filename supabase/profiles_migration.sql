-- ─── Tabela de perfis vinculada ao auth.users ────────────────────────────────
-- Execute este script no Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists public.profiles (
  id         uuid        primary key references auth.users on delete cascade,
  email      text        unique not null,
  name       text        not null default '',
  avatar_url text,
  role       text        not null default '',
  color      text        not null default 'oklch(0.62 0.15 265)',
  initial    text        not null default '',
  joined_at  timestamptz not null default now(),
  -- owner_id mapeia para o campo post.owner nas tabelas de posts
  -- ex: 'Duda', 'Kel', 'Pat' — mantém compatibilidade com posts existentes
  owner_id   text
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Leitura pública para usuários autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Usuário edita próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Usuário insere próprio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ─── Trigger: cria perfil automaticamente ao fazer signup ────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  display_name text;
  user_initial text;
  derived_owner text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  user_initial  := upper(left(display_name, 1));
  -- owner_id padrão = primeiro nome (ex: "Duda Sales" → "Duda")
  derived_owner := split_part(display_name, ' ', 1);

  insert into public.profiles (id, email, name, avatar_url, initial, owner_id)
  values (
    new.id,
    new.email,
    display_name,
    new.raw_user_meta_data->>'avatar_url',
    user_initial,
    derived_owner
  )
  on conflict (id) do update set
    avatar_url = excluded.avatar_url,
    name       = coalesce(excluded.name, profiles.name),
    initial    = coalesce(excluded.initial, profiles.initial);

  return new;
end;
$$;

-- Remove trigger anterior se existir, depois recria
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Mapeamentos manuais de owner_id para usuários já cadastrados ─────────────
-- Ajuste os emails conforme seus usuários reais no Supabase Auth.
-- O owner_id deve bater com o campo 'owner' nos posts do banco.

-- Exemplos (descomente e ajuste conforme necessário):
-- update public.profiles set owner_id = 'Kel'  where email = 'kellery.moreira@gocase.com';
-- update public.profiles set owner_id = 'Pat'  where email = 'patricia.stadler@gocase.com';
-- update public.profiles set role = 'Social Media' where email = 'duda.sales@gocase.com';
-- update public.profiles set role = 'Design' where email = 'thaissa.albuquerque@gocase.com';
