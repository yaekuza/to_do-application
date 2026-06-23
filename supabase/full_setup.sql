-- TakenHandelaar full Supabase setup
-- Paste this entire file into the Supabase SQL Editor and run it once.
-- It is safe to run again when you need to repair policies/tables.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  display_name  text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Categories / subjects
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#a855f7',
  created_at  timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  title        text not null,
  description  text,
  start_time   timestamptz,
  end_time     timestamptz,
  deadline     timestamptz,
  priority     text not null default 'medium',
  status       text not null default 'open',
  created_at   timestamptz not null default now()
);
create index if not exists tasks_user_idx on public.tasks(user_id);
create index if not exists tasks_user_start_idx on public.tasks(user_id, start_time);
create index if not exists tasks_user_deadline_idx on public.tasks(user_id, deadline);

alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks add constraint tasks_priority_check
  check (priority in ('low', 'medium', 'high'));

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('open', 'in_progress', 'done'));

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text not null default '',
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.notes drop column if exists category_id;
create index if not exists notes_user_idx on public.notes(user_id);
create index if not exists notes_user_updated_idx on public.notes(user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Updated-at helper for profile and notes edits
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy profiles_insert on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy profiles_update on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists categories_select on public.categories;
drop policy if exists categories_insert on public.categories;
drop policy if exists categories_update on public.categories;
drop policy if exists categories_delete on public.categories;
create policy categories_select on public.categories
  for select to authenticated using (auth.uid() = user_id);
create policy categories_insert on public.categories
  for insert to authenticated with check (auth.uid() = user_id);
create policy categories_update on public.categories
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy categories_delete on public.categories
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;
drop policy if exists tasks_delete on public.tasks;
create policy tasks_select on public.tasks
  for select to authenticated using (auth.uid() = user_id);
create policy tasks_insert on public.tasks
  for insert to authenticated with check (auth.uid() = user_id);
create policy tasks_update on public.tasks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tasks_delete on public.tasks
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists notes_select on public.notes;
drop policy if exists notes_insert on public.notes;
drop policy if exists notes_update on public.notes;
drop policy if exists notes_delete on public.notes;
create policy notes_select on public.notes
  for select to authenticated using (auth.uid() = user_id);
create policy notes_insert on public.notes
  for insert to authenticated with check (auth.uid() = user_id);
create policy notes_update on public.notes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notes_delete on public.notes
  for delete to authenticated using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.notes to authenticated;

-- ---------------------------------------------------------------------------
-- Auto-create a profile row for every new auth user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'student'), '[^a-zA-Z0-9_]+', '_', 'g'))
      || '_' || left(new.id::text, 8),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
