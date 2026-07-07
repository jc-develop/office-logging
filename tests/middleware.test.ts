import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @supabase/ssr before importing middleware
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

// Mock process.env before importing middleware
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

import { middleware } from "@/middleware";

function createRequest(url: string, authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader) {
    headers.set("authorization", authHeader);
  }
  return new NextRequest(new Request(url, { headers }));
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows requests to public paths", async () => {
    const req = createRequest("http://localhost/");
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it("allows requests to kiosk API paths", async () => {
    const req = createRequest("http://localhost/api/kiosk/logs");
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it("allows requests to login page", async () => {
    const req = createRequest("http://localhost/login");
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it("blocks unauthenticated requests to /logs", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as any);

    const req = createRequest("http://localhost/logs");
    const res = await middleware(req);

    expect(res.status).toBe(307); // redirect
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows authenticated requests to /logs", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "1", email: "admin@test.com" } }, error: null }),
      },
    } as any);

    const req = createRequest("http://localhost/logs");
    const res = await middleware(req);

    expect(res.status).toBe(200); // passes through
  });

  it("skips auth check when Supabase env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    // Re-import with new env
    const { middleware: mid } = await import("@/middleware");

    const req = createRequest("http://localhost/logs");
    const res = await mid(req);

    expect(res.status).toBe(200);
  });
});
