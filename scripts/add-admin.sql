-- ============================================================
-- Add a new admin
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================
-- Prerequisite: Create the user in Supabase Auth first.
--   Dashboard → Authentication → Users → Add User
--   Set their email and a temporary password.
--   (Supabase hashes passwords with bcrypt automatically.)
-- ============================================================

-- 1. Grant them admin access
INSERT INTO public.admin_config (email)
VALUES ('admin@example.com');

-- 2. Verify it was added
-- SELECT * FROM public.admin_config ORDER BY created_at DESC;

-- To remove an admin later:
-- DELETE FROM public.admin_config WHERE email = 'admin@example.com';
