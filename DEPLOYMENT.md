# Deployment & Bootstrap

From zero to running in production.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (or other Node.js host)

---

## 1. Supabase project setup

Create a Supabase project, then go to **SQL Editor** and run the entire contents
of [`supabase-setup.sql`](./supabase-setup.sql). This creates:

- `logs` table — attendance entries (encrypted name, hash, type, photo URL)
- `admin_activity_logs` table — audit trail for admin actions
- `admin_config` table — stores admin email addresses
- `log-images` storage bucket (private)
- Row Level Security policies

---

## 2. Environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:
```powershell
Copy-Item .env.local.example .env.local
```

On Windows cmd:
```cmd
copy .env.local.example .env.local
```

> If PowerShell blocks `npm.ps1` with an execution policy error, either use
> `npm.cmd` instead or run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
> ```
> Then reopen your terminal and run `npm install` again.

### Required (public — safe in client)

Get these from **Supabase Dashboard → Settings → API**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

### Required (secret — never commit or expose client-side)

| Variable | Description |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` key (Settings → API) |
| `NAME_ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM name encryption — generate with `openssl rand -hex 32` |
| `NAME_HASH_PEPPER` | Any random string — added to name hashes to prevent rainbow-table attacks |


> **Why `service_role`?**  
> It bypasses RLS and is used server-side only, never in the browser.

> **Encryption fallback (development only):**  
> If `NAME_ENCRYPTION_KEY` or `NAME_HASH_PEPPER` are not set, the app falls
> back to dev-only deterministic values. **Always set them in production**.

---

## 3. Create the first admin

### 3a. Create the Auth user

Go to **Supabase Dashboard → Authentication → Users → Add User** and create a
user with the email and password you want for the admin account.

### 3b. Add them to the admin config

In **Supabase Dashboard → SQL Editor**, run:

```sql
INSERT INTO public.admin_config (email)
VALUES ('admin@yourcompany.com');
```

Replace `admin@yourcompany.com` with the email you used in step 3a.

---

## 4. Deploy to Vercel

### 4a. Connect repository

Push to GitHub/GitLab/Bitbucket, then import the repo in Vercel.

### 4b. Add environment variables

In **Vercel Dashboard → Project → Settings → Environment Variables**, add all
variables from step 2:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NAME_ENCRYPTION_KEY
NAME_HASH_PEPPER
```

### 4c. Deploy

Vercel auto-deploys on push. After the first deploy completes, create the
admin account by following **steps 3a and 3b** above — but now the Auth user
will be created against your production Supabase project instead of local.

---

## 5. Sign in

Navigate to `/login` and sign in with the admin email + password you configured.

---

## 6. Adding more admins

The initial admin can add more admins from the **Admin Management** tab inside
the dashboard at `/logs`. See [`scripts/add-admin.sql`](./scripts/add-admin.sql)
for instructions.

---

## 7. Verify

- [ ] Kiosk loads without errors — type a name, capture photo, submit
- [ ] Admin dashboard shows logs with decrypted names
- [ ] Log deletion works (click entry → Delete → confirm)
- [ ] Photo bucket returns 403 for unauthenticated requests
- [ ] Signed photo URLs load in the admin dashboard
- [ ] Mass delete works: set a date range, click "Delete All Matching", confirm

---

## Local development with mock mode

If `NEXT_PUBLIC_SUPABASE_URL` contains `placeholder` or `your-project`, the app
runs in **mock mode** using `localStorage`. No Supabase connection needed:

- Default admin: `admin@startuplab.com` / `admin123`
- Mock seed data: Alice Vance (staff), Bob Smith (staff), Charlie Brown (intern)

```bash
npm run dev
```
