-- ============================================================
-- Office Logging — Supabase setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- 1. Logs table ----------------------------------------------
create table if not exists public.logs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,         -- AES-256-GCM encrypted
  name_hash  text not null,         -- SHA-256 deterministic hash for lookups
  type       text not null check (type in ('login', 'logout', 'break')),
  image_url  text not null,         -- Signed URL to private storage bucket
  created_at timestamptz not null default now()
);

create index if not exists logs_created_at_idx on public.logs (created_at desc);
create index if not exists logs_name_hash_idx on public.logs (name_hash);

-- 2. Admin Activity Logs table --------------------------------
create table if not exists public.admin_activity_logs (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  details    text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_at_idx on public.admin_activity_logs (created_at desc);

-- 3. Row Level Security --------------------------------------

-- Logs: kiosk can INSERT (anonymous), only admins can SELECT/DELETE
alter table public.logs enable row level security;

create policy "Anyone can insert logs"
  on public.logs for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read logs"
  on public.logs for select
  to authenticated
  using (true);

create policy "Admins can delete logs"
  on public.logs for delete
  to authenticated
  using (true);

-- Admin activity logs: only authenticated users can write / read
alter table public.admin_activity_logs enable row level security;

create policy "Admins can insert activity logs"
  on public.admin_activity_logs for insert
  to authenticated
  with check (true);

create policy "Admins can read activity logs"
  on public.admin_activity_logs for select
  to authenticated
  using (true);

-- 4. Admin config table ------------------------------------------
create table if not exists public.admin_config (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_config enable row level security;

-- Only existing admins can read the admin list
create policy "Admins can read admin_config"
  on public.admin_config for select
  to authenticated
  using (
    email = auth.jwt() ->> 'email'
    or exists (select 1 from public.admin_config where email = auth.jwt() ->> 'email')
  );

-- Existing admins can add new admins
create policy "Admins can insert admin_config"
  on public.admin_config for insert
  to authenticated
  with check (exists (select 1 from public.admin_config where email = auth.jwt() ->> 'email'));

-- Admins can remove other admins (but cannot remove themselves)
create policy "Admins can delete admin_config"
  on public.admin_config for delete
  to authenticated
  using (
    exists (select 1 from public.admin_config where email = auth.jwt() ->> 'email')
    and email <> auth.jwt() ->> 'email'
  );

-- 5. Storage bucket for photos --------------------------------
insert into storage.buckets (id, name, public)
values ('log-images', 'log-images', false)
on conflict (id) do nothing;

-- Drop existing policies (so re-running the script works)
drop policy if exists "Anyone can upload log images" on storage.objects;
drop policy if exists "Anyone can read log images" on storage.objects;

-- Only authenticated users can upload to the bucket
create policy "Authenticated users can upload log images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'log-images');

-- Only authenticated users can read from the bucket
create policy "Authenticated users can read log images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'log-images');
