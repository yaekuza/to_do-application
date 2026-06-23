-- TakenHandelaar profile field migration
-- Paste this into the Supabase SQL Editor if your project already has the main tables.

alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists birthplace text;
alter table public.profiles add column if not exists school text;
alter table public.profiles add column if not exists study_program text;
alter table public.profiles add column if not exists study_year text;
