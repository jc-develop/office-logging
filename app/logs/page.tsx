"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getLogs } from "@/lib/logs";
import { supabase } from "@/lib/supabase";
import type { LogEntry } from "@/lib/supabase";

type SortKey = "date-desc" | "date-asc" | "name-asc" | "name-desc";

export default function LogsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & sorting
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");

  // Require an authenticated admin; otherwise send to /login.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setAuthChecked(true);
      getLogs()
        .then(setLogs)
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Failed to load logs.")
        )
        .finally(() => setLoading(false));
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const visibleLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    // Date range bounds (inclusive). dateFrom = start of day, dateTo = end of day.
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59.999").getTime() : null;

    const filtered = logs.filter((log) => {
      if (term && !log.name.toLowerCase().includes(term)) return false;
      const ts = new Date(log.created_at).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "date-desc":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return sorted;
  }, [logs, search, dateFrom, dateTo, sortBy]);

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSortBy("date-desc");
  }

  const hasFilters =
    search !== "" || dateFrom !== "" || dateTo !== "" || sortBy !== "date-desc";

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-400">Checking access…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Logs</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-neutral-400 underline-offset-4 transition hover:text-neutral-200 hover:underline"
          >
            ← Back to logging
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 transition hover:bg-neutral-800"
          >
            Sign Out
          </button>
        </div>
      </div>

      {loading && <p className="text-neutral-400">Loading…</p>}
      {error && (
        <p className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {/* Filters & sorting */}
          <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="search"
                  className="text-xs font-medium text-neutral-400"
                >
                  Search name
                </label>
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Juan"
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="from"
                  className="text-xs font-medium text-neutral-400"
                >
                  From date
                </label>
                <input
                  id="from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-blue-500 [color-scheme:dark]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="to"
                  className="text-xs font-medium text-neutral-400"
                >
                  To date
                </label>
                <input
                  id="to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-blue-500 [color-scheme:dark]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="sort"
                  className="text-xs font-medium text-neutral-400"
                >
                  Sort by
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-blue-500"
                >
                  <option value="date-desc">Date (newest first)</option>
                  <option value="date-asc">Date (oldest first)</option>
                  <option value="name-asc">Name (A–Z)</option>
                  <option value="name-desc">Name (Z–A)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {visibleLogs.length} of {logs.length}{" "}
                {logs.length === 1 ? "entry" : "entries"}
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-neutral-400 underline-offset-4 transition hover:text-neutral-200 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {logs.length === 0 ? (
            <p className="text-neutral-400">No logs yet.</p>
          ) : visibleLogs.length === 0 ? (
            <p className="text-neutral-400">No entries match your filters.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-900 text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Photo</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.map((log) => (
                    <tr key={log.id} className="border-t border-neutral-800">
                      <td className="px-4 py-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={log.image_url}
                          alt={log.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      </td>
                      <td className="px-4 py-2 font-medium text-neutral-100">
                        {log.name}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-2 py-1 text-xs " +
                            (log.type === "login"
                              ? "bg-green-900/50 text-green-300"
                              : log.type === "break"
                                ? "bg-amber-900/50 text-amber-300"
                                : "bg-red-900/50 text-red-300")
                          }
                        >
                          {log.type === "login"
                            ? "Log In"
                            : log.type === "break"
                              ? "Break"
                              : "Log Out"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-neutral-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
