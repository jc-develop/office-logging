# Office Logging

A kiosk-style attendance app. People enter their name, snap a webcam photo, and
tap **Log In** or **Log Out**. Each entry — name, action, photo, and timestamp —
is saved to Supabase.

Built with Next.js (App Router), TypeScript, Tailwind CSS, `react-webcam`, and
Supabase (Postgres + Storage).

## Setup

### 1. Create a Supabase project

At [supabase.com](https://supabase.com), create a project. Then go to
**SQL Editor** and run the contents of [`supabase-setup.sql`](./supabase-setup.sql).
This creates the `logs` table, the public `log-images` storage bucket, and the
access policies.

### 2. Configure environment variables

Copy the example file and fill in your project's values (found under
**Project Settings → API**):

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

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and run

```bash
npm install
npm run dev
```

If PowerShell blocks `npm.ps1` with an execution policy error, use the Windows
command shell instead:

```cmd
npm.cmd install
npm.cmd run dev
```

Or allow scripts for your current user in PowerShell:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
```

Then reopen your terminal and run `npm run dev` again.

Open [http://localhost:3000](http://localhost:3000). The browser will ask for
camera permission. View entries at [/logs](http://localhost:3000/logs).

## How it works

- `app/page.tsx` — the logging screen (`components/LogForm.tsx` +
  `components/CameraCapture.tsx`).
- `lib/logs.ts` — uploads the captured photo to Supabase Storage and inserts the
  log row.
- `app/logs/page.tsx` — a simple table of all entries.

## Security note

This app uses Supabase's anon key directly from the browser with permissive RLS
policies (anyone can insert/read), which suits a trusted in-office kiosk. If you
expose it more widely, add authentication and tighten the policies in
`supabase-setup.sql`.
