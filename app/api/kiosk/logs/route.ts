import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { encryptName, hashName } from "@/lib/crypto";

const BUCKET = "log-images";

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const buffer = Buffer.from(base64, "base64");
  return { buffer, mime };
}

// ─── POST: create a new log entry ──────────────────────────────

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, type, imageDataUrl } = body;
  if (!name?.trim() || !type || !imageDataUrl) {
    return NextResponse.json({ error: "name, type, and imageDataUrl are required" }, { status: 400 });
  }

  if (!["login", "logout", "break"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const trimmedName = name.trim();
  const encryptedName = encryptName(trimmedName);
  const nameHash = hashName(trimmedName);

  // Upload image to private bucket
  const { buffer, mime } = dataUrlToBuffer(imageDataUrl);
  const safeName = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const path = `${safeName}/${type}-${Date.now()}.jpg`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
  }

  // Generate signed URL (valid 60 seconds — regenerated on read)
  const { data: signedData, error: signedError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);

  if (signedError || !signedData) {
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }

  // Insert log with encrypted name
  const { error: insertError } = await admin
    .from("logs")
    .insert({ name: encryptedName, name_hash: nameHash, type, image_url: signedData.signedUrl });

  if (insertError) {
    return NextResponse.json({ error: `Failed to save log: ${insertError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, name: trimmedName, type, image_url: signedData.signedUrl });
}

// ─── GET: fetch log entries (authenticated only) ───────────────

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Verify authentication via session cookie
  const response = NextResponse.next();
  const userClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 200, 1000);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await admin
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { decryptName } = await import("@/lib/crypto");

  // Generate fresh signed URLs at read time so images don't expire
  const prefix = `/storage/v1/object/sign/${BUCKET}/`;
  const logs = await Promise.all(
    (data ?? []).map(async (row: Record<string, unknown>) => {
      const storedUrl = row.image_url as string;
      let imageUrl = storedUrl;

      try {
        const path = new URL(storedUrl).pathname;
        if (path.startsWith(prefix)) {
          const filePath = path.slice(prefix.length);
          const { data: signed } = await admin.storage
            .from(BUCKET)
            .createSignedUrl(filePath, 60);
          if (signed) imageUrl = signed.signedUrl;
        }
      } catch {
        // fall back to stored URL if parsing fails
      }

      return {
        id: row.id,
        name: decryptName(row.name as string),
        type: row.type,
        image_url: imageUrl,
        created_at: row.created_at,
      };
    }),
  );

  return NextResponse.json(logs);
}
