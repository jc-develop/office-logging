"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLogs } from "@/lib/logs";
import type { LogEntry } from "@/lib/supabase";

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load logs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Logs</h1>
        <Link
          href="/"
          className="text-sm text-neutral-400 underline-offset-4 transition hover:text-neutral-200 hover:underline"
        >
          ← Back to logging
        </Link>
      </div>

      {loading && <p className="text-neutral-400">Loading…</p>}
      {error && (
        <p className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && logs.length === 0 && (
        <p className="text-neutral-400">No logs yet.</p>
      )}

      {logs.length > 0 && (
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
              {logs.map((log) => (
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
    </main>
  );
}
