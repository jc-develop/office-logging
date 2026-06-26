-- ============================================================
-- Office Logging — Supabase setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- 1. Logs table -------------------------------------------------
create table if not exists public.logs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null check (type in ('login', 'logout', 'break')),
  role       text not null check (role in ('staff', 'intern', 'guest', 'client', 'admin')),
  image_url  text not null,
  created_at timestamptz not null default now()
);

create index if not exists logs_created_at_idx on public.logs (created_at desc);

-- 2. Admin Activity Logs table -----------------------------------
create table if not exists public.admin_activity_logs (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  details    text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_at_idx on public.admin_activity_logs (created_at desc);

-- 3. Row Level Security ----------------------------------------
-- The kiosk inserts anonymously (anon key), but reading logs is
-- restricted to authenticated admins only.
alter table public.logs enable row level security;

create policy "Anyone can insert logs"
  on public.logs for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read logs"
  on public.logs for select
  to authenticated
  using (true);

-- Activity logs RLS
alter table public.admin_activity_logs enable row level security;

create policy "Anyone can insert activity logs"
  on public.admin_activity_logs for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read activity logs"
  on public.admin_activity_logs for select
  to authenticated
  using (true);

-- 4. Storage bucket for photos ---------------------------------
insert into storage.buckets (id, name, public)
values ('log-images', 'log-images', true)
on conflict (id) do nothing;

-- Allow public uploads + reads to the log-images bucket.
create policy "Anyone can upload log images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'log-images');

create policy "Anyone can read log images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'log-images');
