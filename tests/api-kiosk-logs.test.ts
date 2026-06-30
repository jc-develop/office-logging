import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/kiosk/logs/route";

function createGet(url: string) {
  return GET(new NextRequest(new Request(url)));
}

describe("GET /api/kiosk/logs", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 500 when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const res = await createGet("http://localhost/api/kiosk/logs?limit=10");
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Server misconfigured");
  });

  it("returns 500 when service role key is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const res = await createGet("http://localhost/api/kiosk/logs?limit=10");
    expect(res.status).toBe(500);
  });

  it("returns 500 when supabase URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "some-key");

    const res = await createGet("http://localhost/api/kiosk/logs?limit=10");
    expect(res.status).toBe(500);
  });
});
