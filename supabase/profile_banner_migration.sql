-- TakenHandelaar profile banner migration
-- Paste this into the Supabase SQL Editor if your profiles table already exists.

alter table public.profiles add column if not exists banner_url text;

