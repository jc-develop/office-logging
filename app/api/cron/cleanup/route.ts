import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "log-images";
const RETENTION_DAYS = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized invocation
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();

  // Find old logs
  const { data: oldLogs, error: selectError } = await admin
    .from("logs")
    .select("id, image_url")
    .lt("created_at", cutoff);

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (!oldLogs || oldLogs.length === 0) {
    await logCleanup(admin, 0, 0);
    return NextResponse.json({ deleted: 0, imagesRemoved: 0 });
  }

  const ids = oldLogs.map((row) => row.id);

  // Delete storage images
  let imagesRemoved = 0;
  for (const log of oldLogs) {
    const url = log.image_url;
    if (!url) continue;
    // Extract the storage path from the signed URL
    try {
      const path = extractStoragePath(url);
      if (path) {
        const { error: removeError } = await admin.storage.from(BUCKET).remove([path]);
        if (!removeError) imagesRemoved++;
      }
    } catch {
      // Best-effort — orphaned files are fine
    }
  }

  // Delete log rows
  const { error: deleteError } = await admin.from("logs").delete().in("id", ids);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await logCleanup(admin, ids.length, imagesRemoved);

  return NextResponse.json({ deleted: ids.length, imagesRemoved });
}

/** Extract the storage object path from a signed URL. */
function extractStoragePath(signedUrl: string): string | null {
  try {
    const u = new URL(signedUrl);
    // Signed URL format:
    // /storage/v1/object/sign/log-images/<path>?token=...
    const match = u.pathname.match(/\/object\/sign\/log-images\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logCleanup(admin: any, deleted: number, imagesRemoved: number) {
  await admin.from("admin_activity_logs").insert({
    action: "CLEANUP_LOGS",
    details: `Scheduled cleanup: deleted ${deleted} logs, removed ${imagesRemoved} images (retention: ${RETENTION_DAYS} days)`,
  });
}
