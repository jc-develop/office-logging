#!/usr/bin/env node

/**
 * Migration script: encrypt plaintext names in existing logs.
 *
 * Prerequisites:
 *   1. Run supabase-setup.sql in the Supabase SQL Editor first
 *   2. If your logs table already existed, also run:
 *        ALTER TABLE public.logs
 *        ADD COLUMN IF NOT EXISTS name_hash text;
 *   3. Set env vars (in .env.local or exported):
 *        NEXT_PUBLIC_SUPABASE_URL
 *        SUPABASE_SERVICE_ROLE_KEY
 *        NAME_ENCRYPTION_KEY
 *        NAME_HASH_PEPPER
 *
 * Usage:
 *   node scripts/migrate-names.mjs
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ── Config ──────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HEX_KEY = process.env.NAME_ENCRYPTION_KEY;
const PEPPER = process.env.NAME_HASH_PEPPER || "dev-fallback-pepper";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !HEX_KEY) {
  console.error("Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NAME_ENCRYPTION_KEY");
  process.exit(1);
}

const KEY = Buffer.from(HEX_KEY, "hex");
if (KEY.length !== 32) {
  console.error("NAME_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Crypto (mirrors lib/crypto.ts) ──────────────────────────────

function encryptName(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  let enc = cipher.update(plaintext, "utf8", "hex");
  enc += cipher.final("hex");
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${enc}`;
}

function hashName(name) {
  return crypto
    .createHash("sha256")
    .update(name.trim().toLowerCase() + PEPPER)
    .digest("hex");
}

function looksEncrypted(value) {
  return /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(value);
}

// ── Migration ───────────────────────────────────────────────────

async function migrate() {
  // Try to fetch only rows missing name_hash. If the column doesn't
  // exist yet, fall back to fetching all rows and filtering in memory.
  let rows;

  const { data, error } = await supabase
    .from("logs")
    .select("id, name, name_hash")
    .is("name_hash", null);

  if (error) {
    console.log("name_hash column not found — fetching all rows and filtering in-memory.\n");

    const { data: all, error: allErr } = await supabase
      .from("logs")
      .select("id, name");

    if (allErr) {
      console.error("Failed to fetch logs:", allErr.message);
      process.exit(1);
    }
    rows = (all ?? []).filter((r) => !looksEncrypted(r.name));
  } else {
    rows = (data ?? []).filter((r) => !looksEncrypted(r.name));
  }

  if (!rows.length) {
    console.log("All names are already encrypted — nothing to migrate.");
    return;
  }

  console.log(`Found ${rows.length} log(s) with plaintext names. Migrating...\n`);

  for (const row of rows) {
    const encrypted = encryptName(row.name);
    const hash = hashName(row.name);

    const { error: updateError } = await supabase
      .from("logs")
      .update({ name: encrypted, name_hash: hash })
      .eq("id", row.id);

    if (updateError) {
      console.error(`  ✗ ${row.id}  "${row.name}" — ${updateError.message}`);
    } else {
      console.log(`  ✓ ${row.id.slice(0, 8)}…  "${row.name}" → encrypted`);
    }
  }

  console.log("\nMigration complete.");
}

migrate().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
