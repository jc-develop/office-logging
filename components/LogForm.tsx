"use client";

import { useState } from "react";
import CameraCapture from "./CameraCapture";
import { createLog } from "@/lib/logs";
import type { LogType } from "@/lib/supabase";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const ACTION_LABEL: Record<LogType, string> = {
  login: "Log In",
  logout: "Log Out",
  break: "Break",
};

const ACTION_VERB: Record<LogType, string> = {
  login: "logged in",
  logout: "logged out",
  break: "took a break",
};

// Tailwind classes per action for the solid buttons and the badge.
const ACTION_BTN: Record<LogType, string> = {
  login: "bg-green-600 hover:bg-green-500",
  logout: "bg-red-600 hover:bg-red-500",
  break: "bg-amber-600 hover:bg-amber-500",
};

const ACTION_BADGE: Record<LogType, string> = {
  login: "bg-green-900/50 text-green-300",
  logout: "bg-red-900/50 text-red-300",
  break: "bg-amber-900/50 text-amber-300",
};

export default function LogForm() {
  // Step 1 = choose action, Step 2 = fill in details.
  const [action, setAction] = useState<LogType | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const saving = status.kind === "saving";
  const canSave = name.trim().length > 0 && !!image && !saving;
  const actionLabel = action ? ACTION_LABEL[action] : "";

  function chooseAction(type: LogType) {
    setAction(type);
    setStatus({ kind: "idle" });
  }

  function reset() {
    setAction(null);
    setName("");
    setImage(null);
    setStatus({ kind: "idle" });
  }

  async function handleSave() {
    if (!canSave || !action) return;
    setStatus({ kind: "saving" });
    try {
      await createLog(name, action, image!);
      setStatus({
        kind: "success",
        message: `${name.trim()} ${ACTION_VERB[action]} successfully.`,
      });
      // Reset back to the start after a short moment.
      setTimeout(reset, 2500);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  // ---- Step 1: choose Log In or Log Out ----
  if (!action) {
    return (
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6 shadow-xl">
        <p className="text-center text-neutral-400">What would you like to do?</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => chooseAction("login")}
            className="flex-1 rounded-xl bg-green-600 px-4 py-6 text-lg font-semibold text-white transition hover:bg-green-500"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => chooseAction("break")}
            className="flex-1 rounded-xl bg-amber-600 px-4 py-6 text-lg font-semibold text-white transition hover:bg-amber-500"
          >
            Break
          </button>
          <button
            type="button"
            onClick={() => chooseAction("logout")}
            className="flex-1 rounded-xl bg-red-600 px-4 py-6 text-lg font-semibold text-white transition hover:bg-red-500"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // ---- Step 2: name + camera + save ----
  return (
    <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${ACTION_BADGE[action]}`}
        >
          {actionLabel}
        </span>
        <button
          type="button"
          onClick={reset}
          disabled={saving}
          className="text-sm text-neutral-400 transition hover:text-neutral-200 disabled:opacity-50"
        >
          ← Back
        </button>
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-neutral-300"
        >
          Your name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Juan dela Cruz"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none transition focus:border-blue-500"
        />
      </div>

      <CameraCapture onCapture={setImage} />

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className={`${ACTION_BTN[action]} rounded-lg px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {saving
          ? "Saving…"
          : action === "break"
            ? "Save Break"
            : `Save and ${actionLabel}`}
      </button>

      {status.kind === "success" && (
        <p className="rounded-lg bg-green-900/40 px-4 py-3 text-center text-sm text-green-300">
          ✓ {status.message}
        </p>
      )}
      {status.kind === "error" && (
        <p className="rounded-lg bg-red-900/40 px-4 py-3 text-center text-sm text-red-300">
          ✗ {status.message}
        </p>
      )}
    </div>
  );
}
