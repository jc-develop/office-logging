# Office Logging

A kiosk-style attendance app for the office. People enter their name, snap a
webcam photo, and tap **Log In**, **Log Out**, or **Break**. Each entry is
saved to Supabase with an encrypted name, a signed photo URL, and a timestamp.
Admins can view, filter, and delete entries through a password-protected
dashboard at `/logs`.

Built with Next.js (App Router), TypeScript, Tailwind CSS, `react-webcam`, and
Supabase (Postgres + Auth + Storage).

## Quick start (mock mode)

```bash
npm install
npm run dev
```

If `NEXT_PUBLIC_SUPABASE_URL` contains `placeholder` or `your-project`, the app
runs in **mock mode** using `localStorage`. No Supabase connection needed.
Default admin credentials: `admin@startuplab.com` / `admin123`.

Open [http://localhost:3000](http://localhost:3000). The browser will ask for
camera permission. Sign in at `/login` to access the admin dashboard.

> For production setup (Supabase project, auth, environment variables), see
> [DEPLOYMENT.md](./DEPLOYMENT.md).

## How it works

- `components/kiosk/` — the public kiosk UI (name entry, camera capture,
  action selector, success confirmation).
- `app/api/kiosk/log` — API route that encrypts the name (AES-256-GCM),
  computes a deterministic SHA-256 hash for lookups, uploads the photo to
  Supabase Storage, and inserts a row in the `logs` table.
- `components/admin/` — admin dashboard UI (login, attendance table with
  decrypted names, detail modal, delete confirmation, admin management,
  security audit log).
- `lib/logs.ts` — shared logic for fetching and formatting logs on the client.
- `app/api/admin/` — server-side admin routes (auth, user creation,
  activity logging).
- `app/api/cron/cleanup` — daily cron job that deletes logs and photos older
  than 30 days.

## Security

- Names are encrypted at rest with **AES-256-GCM**. A separate SHA-256 hash
  enables fast lookups without exposing plaintext.
- Photos are stored in a **private** Supabase Storage bucket; the admin
  dashboard requests signed, time-limited URLs.
- The admin dashboard requires **Supabase Auth** login. RLS policies restrict
  reads, deletes, and admin management to authenticated admin users.
- The kiosk endpoint is **public** (anyone can log) — suitable for a trusted
  in-office kiosk behind a locked door or on a private network.
