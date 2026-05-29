-- TakenHandelaar schema
-- Run this once in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, auto-populated on signup
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
-- categories: a "vak" (school subject) the user creates
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
-- tasks: a school task, optionally bound to a category and a time slot
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
  priority     text not null default 'medium' check (priority in ('low','medium','high')),
  status       text not null default 'open'   check (status in ('open','done')),
  created_at   timestamptz not null default now()
);
create index if not exists tasks_user_idx       on public.tasks(user_id);
create index if not exists tasks_user_start_idx on public.tasks(user_id, start_time);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.tasks      enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select using (auth.uid() = id);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

drop policy if exists categories_select on public.categories;
drop policy if exists categories_insert on public.categories;
drop policy if exists categories_update on public.categories;
drop policy if exists categories_delete on public.categories;
create policy categories_select on public.categories for select using (auth.uid() = user_id);
create policy categories_insert on public.categories for insert with check (auth.uid() = user_id);
create policy categories_update on public.categories for update using (auth.uid() = user_id);
create policy categories_delete on public.categories for delete using (auth.uid() = user_id);

drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;
drop policy if exists tasks_delete on public.tasks;
create policy tasks_select on public.tasks for select using (auth.uid() = user_id);
create policy tasks_insert on public.tasks for insert with check (auth.uid() = user_id);
create policy tasks_update on public.tasks for update using (auth.uid() = user_id);
create policy tasks_delete on public.tasks for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create profile row when a new auth.user is inserted
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
    coalesce(new.raw_user_meta_data->>'preferred_username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
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
