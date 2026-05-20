-- SocialHub v2 schema
-- Run this in your Supabase SQL editor to set up the posts table.
-- WARNING: drops and recreates the posts table — existing rows will be lost.

drop table if exists posts cascade;

create table posts (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users(id) on delete set null,

  title      text        not null default '',
  owner      text        not null default '',
  platform   text        not null default 'ig',   -- ig | tiktok | canal | twitter
  date       date        not null,
  time       text        not null default '12:00',
  status     text        not null default 'prod', -- prod | sched | pub | cancel
  complexity smallint    not null default 3,       -- 1-5
  type       text        not null default 'Reels',
  tags       text[]      not null default '{}',
  linha      text        not null default 'produtos',
  campanha   text,
  link       text        not null default '',
  ref        text        not null default '',
  notes      text        not null default '',
  product    text,
  image_urls text[]      not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_updated_at on posts;
create trigger posts_updated_at
  before update on posts
  for each row execute procedure set_updated_at();

-- Row-level security: each user can only see their own team's posts.
-- For a shared team workspace, disable RLS or use a permissive policy.
alter table posts enable row level security;

drop policy if exists "Authenticated users can read posts"   on posts;
drop policy if exists "Authenticated users can insert posts" on posts;
drop policy if exists "Authenticated users can update posts" on posts;
drop policy if exists "Authenticated users can delete posts" on posts;

-- Allow all authenticated users to read all posts (shared calendar).
create policy "Authenticated users can read posts"
  on posts for select
  to authenticated
  using (true);

-- Users can insert posts (owner is set at app level).
create policy "Authenticated users can insert posts"
  on posts for insert
  to authenticated
  with check (true);

-- Users can update any post (team has shared write access).
create policy "Authenticated users can update posts"
  on posts for update
  to authenticated
  using (true);

-- Users can delete any post.
create policy "Authenticated users can delete posts"
  on posts for delete
  to authenticated
  using (true);

-- Index for common query patterns
create index if not exists posts_date_idx     on posts (date);
create index if not exists posts_owner_idx    on posts (owner);
create index if not exists posts_platform_idx on posts (platform);
create index if not exists posts_campanha_idx on posts (campanha);
