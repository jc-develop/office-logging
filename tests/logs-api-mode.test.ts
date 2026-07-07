import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const MOCK_LOGS = [
  {
    id: "1",
    name: "Alice",
    type: "login",
    role: "staff",
    state: "in_office",
    image_url: "https://example.com/a.jpg",
    created_at: "2026-06-30T10:00:00Z",
  },
];

describe("getLogs in production mode", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://real-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.real-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls /api/kiosk/logs with the limit parameter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_LOGS),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getLogs } = await import("@/lib/logs");
    const result = await getLogs(50);

    expect(fetchMock).toHaveBeenCalledWith("/api/kiosk/logs?limit=50");
    expect(result).toEqual(MOCK_LOGS);
  });

  it("uses default limit of 200 when not specified", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getLogs } = await import("@/lib/logs");
    await getLogs();

    expect(fetchMock).toHaveBeenCalledWith("/api/kiosk/logs?limit=200");
  });

  it("throws on non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getLogs } = await import("@/lib/logs");

    await expect(getLogs(10)).rejects.toThrow("Server error");
  });

  it("throws generic error when response body has no error field", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("parse error")),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getLogs } = await import("@/lib/logs");

    await expect(getLogs(10)).rejects.toThrow("Failed to fetch logs (500)");
  });
});
