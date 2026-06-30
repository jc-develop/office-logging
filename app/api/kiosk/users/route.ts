import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const nameSet = new Map<string, { name: string; role: string }>();

  const { data: users } = await admin.from("users").select("name, role");
  if (users) {
    for (const u of users) {
      if (!nameSet.has(u.name.toLowerCase())) {
        nameSet.set(u.name.toLowerCase(), { name: u.name, role: u.role });
      }
    }
  }

  const { data: logs } = await admin
    .from("logs")
    .select("name, role")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (logs) {
    for (const l of logs) {
      if (!nameSet.has(l.name.toLowerCase())) {
        nameSet.set(l.name.toLowerCase(), { name: l.name, role: l.role });
      }
    }
  }

  const suggestions = Array.from(nameSet.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return NextResponse.json(suggestions);
}
