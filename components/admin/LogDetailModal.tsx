"use client";

import { useEffect, useState } from "react";
import type { LogEntry, LogType } from "@/lib/supabase";
import { playClickSound, playErrorSound } from "@/lib/audio";

const TYPE_LABEL: Record<LogType, string> = {
  login: "Log In",
  break: "Break",
  logout: "Log Out",
};

const TYPE_BADGE: Record<LogType, string> = {
  login: "bg-brand-blue-50 border border-brand-blue-100 text-brand-blue-700",
  break: "bg-brand-blue-50 border border-brand-blue-100 text-brand-blue-700",
  logout: "bg-brand-blue-50 border border-brand-blue-100 text-brand-blue-700",
};

interface LogDetailModalProps {
  log: LogEntry;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export default function LogDetailModal({ log, onClose, onDelete }: LogDetailModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(log.id);
      onClose();
    } catch (err) {
      playErrorSound();
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-blue-950/40 p-4 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-[18px] border border-surface-200 bg-white shadow-2xl animate-scaleIn"
      >
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Log Entry Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-1 text-ink-400 hover:bg-surface-100 hover:text-brand-blue-600 transition cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
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
          className="max-h-[50vh] w-full object-contain bg-surface-50 border-b border-surface-200"
        />

        <dl className="grid grid-cols-3 gap-y-3 px-5 py-5 text-xs sm:text-sm">
          <dt className="font-bold text-ink-500 uppercase tracking-wider">Name</dt>
          <dd className="col-span-2 font-bold text-ink-900">{log.name}</dd>

          <dt className="font-bold text-ink-500 uppercase tracking-wider">Action</dt>
          <dd className="col-span-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TYPE_BADGE[log.type]}`}>
              {TYPE_LABEL[log.type]}
            </span>
          </dd>

          <dt className="font-bold text-ink-500 uppercase tracking-wider">Time</dt>
          <dd className="col-span-2 text-ink-600 font-medium">
            {new Date(log.created_at).toLocaleString()}
          </dd>
        </dl>

        {onDelete && (
          <div className="border-t border-surface-100 px-5 py-4">
            {showConfirm ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-ink-700">
                  Are you sure you want to delete this entry? This cannot be undone.
                </p>
                {deleteError && (
                  <p className="text-xs font-bold text-red-500">{deleteError}</p>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setShowConfirm(false); }}
                    disabled={deleting}
                    className="rounded-xl border border-surface-200 px-4 py-2 text-xs font-bold text-ink-600 transition hover:bg-surface-50 cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {deleting ? "Deleting…" : "Delete Entry"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { playClickSound(); setShowConfirm(true); }}
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 active:scale-[0.98] cursor-pointer"
              >
                Delete Entry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
