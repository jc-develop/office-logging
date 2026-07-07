# Redeploy Guide

Steps to deploy the privacy-hardened changes to production.

## 1. Environment Variables

Add these to Vercel (Production) and `.env.local` (development):

```bash
# 32-byte hex key for AES-256-GCM name encryption
# Generate with: openssl rand -hex 32
NAME_ENCRYPTION_KEY=<hex string>

# Pepper for SHA-256 name hash lookups
NAME_HASH_PEPPER=<any string>
```

Existing vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) should remain unchanged.

```bash
# Shared secret for cron job invocation (use a long random string)
# Generate with: openssl rand -hex 32
CRON_SECRET=<hex string>
```

## 2. Database Migration

Run `supabase-setup.sql` in Supabase SQL Editor. This:

- Creates the new `logs` table with `name_hash` column
- Sets up RLS policies (anon INSERT, authenticated SELECT/DELETE)
- Creates private `admin_config` and `admin_activity_logs` tables
- Makes the `log-images` bucket private

### Manual cleanup (after migration)

```sql
-- Drop old users table (data no longer needed)
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop role and state columns from old logs if they exist
ALTER TABLE public.logs DROP COLUMN IF EXISTS role;
ALTER TABLE public.logs DROP COLUMN IF EXISTS state;

-- Convert old plaintext names (one-time migration)
-- Names must be re-encrypted before the old API is turned off
-- This requires a script — contact the team for assistance
```

## 3. Data Migration

Existing `logs.name` values are plaintext. Before the new API deploys:

1. Run a migration script that reads each log, encrypts the name with `encryptName()`, computes `hashName()`, and writes back
2. Old photo URLs in `image_url` from the public bucket will still work — but new uploads go to the private bucket

## 4. Cron Job (Vercel)

Set up a daily cron in Vercel Dashboard → your project → Cron Jobs:

| Setting | Value |
|---------|-------|
| Path | `/api/cron/cleanup` |
| Schedule | `0 6 * * *` (daily at 06:00 UTC) |
| Method | `GET` |
| Header | `Authorization: Bearer <CRON_SECRET>` |

The route deletes log entries and their associated photos from storage when `created_at` is older than 30 days.

## 5. Deploy

```bash
# Create production build
npm run build

# Deploy to Vercel
vercel --prod
```

## 6. Verify

- [ ] Kiosk loads without errors — type a name, capture photo, submit
- [ ] Admin dashboard shows logs with decrypted names
- [ ] Log deletion works (click entry → Delete → confirm)
- [ ] Photo bucket returns 403 for unauthenticated requests
- [ ] Old `/api/kiosk/users` returns 404 (endpoint removed)
- [ ] Signed photo URLs load in the admin dashboard
- [ ] Trigger cron manually: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<your-domain>/api/cron/cleanup` — should return `{"deleted":0,"imagesRemoved":0}` on first run
