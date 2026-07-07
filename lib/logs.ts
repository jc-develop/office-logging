import { supabase, type LogEntry, type LogType, type AdminConfig, type AdminActivityLog, IS_MOCK } from "./supabase";

// ─── Mock: localStorage helpers ────────────────────────────────

function getMockLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("office_logs");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveMockLogs(logs: LogEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("office_logs", JSON.stringify(logs));
}

function getMockActivityLogs(): AdminActivityLog[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("admin_activity_logs");
  return stored ? JSON.parse(stored) : [];
}

function saveMockActivityLogs(logs: AdminActivityLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("admin_activity_logs", JSON.stringify(logs));
}

// ─── Create a single log entry ─────────────────────────────────

export async function createLog(
  name: string,
  type: LogType,
  imageDataUrl: string,
): Promise<LogEntry> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Please enter your name.");
  if (!imageDataUrl) throw new Error("Please capture a photo first.");

  if (IS_MOCK) {
    const logs = getMockLogs();
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      name: trimmedName,
      type,
      image_url: imageDataUrl,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    saveMockLogs(logs);
    return newLog;
  }

  const res = await fetch("/api/kiosk/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: trimmedName, type, imageDataUrl }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to create log (${res.status})`);
  }

  const data = await res.json();
  return {
    id: crypto.randomUUID(),
    name: data.name,
    type: data.type as LogType,
    image_url: data.image_url,
    created_at: new Date().toISOString(),
  } as LogEntry;
}

// ─── Create multiple log entries ───────────────────────────────

export async function createMultipleLogs(
  people: Array<{ name: string }>,
  type: LogType,
  imageDataUrl: string,
): Promise<LogEntry[]> {
  if (people.length === 0) throw new Error("Please add at least one person.");
  if (!imageDataUrl) throw new Error("Please capture a photo first.");

  if (IS_MOCK) {
    const logs = getMockLogs();
    const createdLogs: LogEntry[] = [];
    const timestamp = new Date().toISOString();

    for (const person of people) {
      const trimmedName = person.name.trim();
      if (!trimmedName) continue;
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        name: trimmedName,
        type,
        image_url: imageDataUrl,
        created_at: timestamp,
      };
      logs.unshift(newLog);
      createdLogs.push(newLog);
    }
    saveMockLogs(logs);
    return createdLogs;
  }

  // Use the single-log API for each person (shares the same photo)
  const results: LogEntry[] = [];
  for (const person of people) {
    if (!person.name.trim()) continue;
    const log = await createLog(person.name, type, imageDataUrl);
    results.push(log);
  }
  return results;
}

// ─── Fetch log entries ─────────────────────────────────────────

export async function getLogs(limit = 200): Promise<LogEntry[]> {
  if (IS_MOCK) {
    return getMockLogs().slice(0, limit);
  }

  const res = await fetch(`/api/kiosk/logs?limit=${limit}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch logs (${res.status})`);
  }
  return res.json() as Promise<LogEntry[]>;
}

// ─── Delete a single log entry ─────────────────────────────────

export async function deleteLog(id: string): Promise<void> {
  if (!id) throw new Error("Log ID is required.");

  if (IS_MOCK) {
    const logs = getMockLogs();
    const filtered = logs.filter((l) => l.id !== id);
    if (filtered.length === logs.length) {
      throw new Error(`Log entry "${id}" not found.`);
    }
    saveMockLogs(filtered);
    return;
  }

  const { error } = await supabase
    .from("logs")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─── Admin audit logs ──────────────────────────────────────────

export async function createActivityLog(action: string, details: string): Promise<void> {
  if (IS_MOCK) {
    const logs = getMockActivityLogs();
    logs.unshift({ id: crypto.randomUUID(), action, details, created_at: new Date().toISOString() });
    saveMockActivityLogs(logs);
    return;
  }

  await supabase.from("admin_activity_logs").insert({ action, details });
}

export async function getActivityLogs(limit = 100): Promise<AdminActivityLog[]> {
  if (IS_MOCK) {
    return getMockActivityLogs().slice(0, limit);
  }

  const { data, error } = await supabase
    .from("admin_activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminActivityLog[];
}

// ─── Admin config ──────────────────────────────────────────────

export async function getAdminConfig(email?: string): Promise<AdminConfig | null> {
  if (IS_MOCK) {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("mock_admin_config_list");
    const list: AdminConfig[] = stored
      ? JSON.parse(stored)
      : [{ email: "admin@startuplab.com", created_at: new Date().toISOString() }];
    if (!stored) {
      localStorage.setItem("mock_admin_config_list", JSON.stringify(list));
    }
    if (email) return list.find((a) => a.email === email) ?? null;
    return list[0] ?? null;
  }

  let query = supabase.from("admin_config").select("*");
  if (email) {
    query = query.eq("email", email);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data as AdminConfig | null;
}

export async function getAdminList(): Promise<AdminConfig[]> {
  if (IS_MOCK) {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("mock_admin_config_list");
    return stored ? JSON.parse(stored) : [];
  }

  const { data, error } = await supabase
    .from("admin_config")
    .select("*")
    .order("created_at");

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminConfig[];
}

export async function deleteAdmin(email: string): Promise<void> {
  if (IS_MOCK) {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("mock_admin_config_list");
    if (!stored) return;
    const list: AdminConfig[] = JSON.parse(stored);
    localStorage.setItem("mock_admin_config_list", JSON.stringify(list.filter((a) => a.email !== email)));
    return;
  }

  const { error } = await supabase.from("admin_config").delete().eq("email", email);
  if (error) throw new Error(error.message);
}
