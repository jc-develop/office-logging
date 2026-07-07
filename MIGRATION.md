# Migration Guide

This document covers upgrading an existing Office Logging deployment from the
legacy schema to the current schema (encrypted names, private storage, admin
auth, cron cleanup). If you're setting up fresh, see [DEPLOYMENT.md](./DEPLOYMENT.md)
instead.

The legacy schema (created by `supabase-setup-old.sql`) had:
- Plaintext `logs.name` in a public bucket
- Public `log-images` storage bucket
- No admin auth, no `admin_config`/`admin_activity_logs` tables

---

## 1. Environment variables

Add the following to Vercel (Production) and `.env.local` (development):

```bash
# 32-byte hex key for AES-256-GCM name encryption
# Generate with: openssl rand -hex 32
NAME_ENCRYPTION_KEY=<hex string>

# Pepper for SHA-256 name hash lookups
NAME_HASH_PEPPER=<any string>

```

Existing vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) should remain unchanged.

---

## 2. Database migration

Run [`supabase-setup.sql`](./supabase-setup.sql) in the Supabase SQL Editor.
This creates the new tables and policies alongside your existing data.

If your existing database was set up with `supabase-setup-old.sql`, it may still
have the `public.users` table and extra `role`/`state` columns on `logs`.
Run the following cleanup **after** `supabase-setup.sql` succeeds:

```sql
-- Drop old users table (data no longer needed)
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop role and state columns from old logs if they exist
ALTER TABLE public.logs DROP COLUMN IF EXISTS role;
ALTER TABLE public.logs DROP COLUMN IF EXISTS state;
```

---

## 3. Data migration

Existing `logs.name` values are plaintext. Before the new API deploys, run the
migration script to encrypt them:

```bash
node scripts/migrate-names.mjs
```

This reads each log with a plaintext name, encrypts it with `encryptName()`,
computes `hashName()`, and writes back.

See [`scripts/migrate-names.mjs`](./scripts/migrate-names.mjs) for
prerequisites and usage details.

Old photo URLs in `image_url` from the public bucket will still work — new
uploads go to the private bucket.

---

## 4. Post-migration

Follow [DEPLOYMENT.md](./DEPLOYMENT.md) from **step 4 (Deploy to Vercel)** onward
to complete the deployment.
