import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const type = searchParams.get("type");

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: "from and to query params are required" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  let query = admin
    .from("logs")
    .delete()
    .gte("created_at", fromDate + "T00:00:00")
    .lte("created_at", toDate + "T23:59:59.999");

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: data?.length ?? 0 });
}
