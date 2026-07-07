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

// Mock @supabase/supabase-js for service_role admin check
const mockFrom = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock process.env before importing middleware
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Public paths ────────────────────────────────────────────

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

  // ─── /logs page routes ──────────────────────────────────────

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
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

    // Re-import with new env
    const { middleware: mid } = await import("@/middleware");

    const req = createRequest("http://localhost/logs");
    const res = await mid(req);

    expect(res.status).toBe(200);

    // Restore env
    process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origAnonKey;
  });

  // ─── /api/admin routes ──────────────────────────────────────

  it("blocks admin API requests without token", async () => {
    const req = createRequest("http://localhost/api/admin/logs");
    const res = await middleware(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("blocks admin API requests with invalid token", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "Invalid token" } }),
      },
    } as any);

    const req = createRequest("http://localhost/api/admin/logs", "Bearer invalid-token");
    const res = await middleware(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("blocks admin API requests when user is not an admin", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "1", email: "user@test.com" } },
          error: null,
        }),
      },
    } as any);

    // Mock service_role admin_config check — not found
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const req = createRequest("http://localhost/api/admin/logs", "Bearer valid-token");
    const res = await middleware(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("allows admin API requests for authenticated admins", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "1", email: "admin@test.com" } },
          error: null,
        }),
      },
    } as any);

    // Mock service_role admin_config check — found
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { email: "admin@test.com" }, error: null }),
    });

    const req = createRequest("http://localhost/api/admin/logs", "Bearer admin-token");
    const res = await middleware(req);

    expect(res.status).toBe(200);
  });
});
