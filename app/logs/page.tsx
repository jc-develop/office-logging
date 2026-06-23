"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getLogs } from "@/lib/logs";
import { supabase } from "@/lib/supabase";
import type { LogEntry, LogType } from "@/lib/supabase";

type SortKey = "date-desc" | "date-asc" | "name-asc" | "name-desc";
type TypeFilter = "all" | LogType;

const TYPE_LABEL: Record<LogType, string> = {
  login: "Log In",
  break: "Break",
  logout: "Log Out",
};

const TYPE_BADGE: Record<LogType, string> = {
  login: "bg-green-900/50 text-green-300",
  break: "bg-amber-900/50 text-amber-300",
  logout: "bg-red-900/50 text-red-300",
};

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");

  // Row clicked to view in the popup.
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

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
      if (typeFilter !== "all" && log.type !== typeFilter) return false;
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
  }, [logs, search, dateFrom, dateTo, typeFilter, sortBy]);

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setTypeFilter("all");
    setSortBy("date-desc");
  }

  const hasFilters =
    search !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    typeFilter !== "all" ||
    sortBy !== "date-desc";

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                  htmlFor="type"
                  className="text-xs font-medium text-neutral-400"
                >
                  Type
                </label>
                <select
                  id="type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-blue-500"
                >
                  <option value="all">All types</option>
                  <option value="login">Log In</option>
                  <option value="break">Break</option>
                  <option value="logout">Log Out</option>
                </select>
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
                    <th className="px-4 py-3 font-medium text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer border-t border-neutral-800 transition hover:bg-neutral-900/50"
                    >
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
                          className={`rounded-full px-2 py-1 text-xs ${TYPE_BADGE[log.type]}`}
                        >
                          {TYPE_LABEL[log.type]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-neutral-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          aria-label={`View ${log.name}'s entry`}
                          className="inline-flex rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedLog && (
        <LogModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </main>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LogModal({
  log,
  onClose,
}: {
  log: LogEntry;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
          <h2 className="text-lg font-semibold">Entry details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={log.image_url}
          alt={log.name}
          className="max-h-[60vh] w-full object-contain bg-black"
        />

        <dl className="grid grid-cols-3 gap-2 px-5 py-4 text-sm">
          <dt className="text-neutral-400">Name</dt>
          <dd className="col-span-2 font-medium text-neutral-100">{log.name}</dd>

          <dt className="text-neutral-400">Action</dt>
          <dd className="col-span-2">
            <span
              className={`rounded-full px-2 py-1 text-xs ${TYPE_BADGE[log.type]}`}
            >
              {TYPE_LABEL[log.type]}
            </span>
          </dd>

          <dt className="text-neutral-400">Time</dt>
          <dd className="col-span-2 text-neutral-200">
            {new Date(log.created_at).toLocaleString()}
          </dd>
        </dl>
      </div>
    </div>
  );
}
