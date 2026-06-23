-- Migration 002: notes table + expanded task status
-- Run this in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- notes: quick lecture notes, optionally tied to a subject
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title       text not null,
  body        text not null default '',
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists notes_user_idx on public.notes(user_id);

-- RLS
alter table public.notes enable row level security;

drop policy if exists notes_select on public.notes;
drop policy if exists notes_insert on public.notes;
drop policy if exists notes_update on public.notes;
drop policy if exists notes_delete on public.notes;
create policy notes_select on public.notes for select using (auth.uid() = user_id);
create policy notes_insert on public.notes for insert with check (auth.uid() = user_id);
create policy notes_update on public.notes for update using (auth.uid() = user_id);
create policy notes_delete on public.notes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Expand task status to include 'in_progress'
-- ---------------------------------------------------------------------------
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('open', 'in_progress', 'done'));
