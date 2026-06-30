"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, IS_MOCK } from "@/lib/supabase";
import { playClickSound, playSuccessSound } from "@/lib/audio";
import { createActivityLog } from "@/lib/logs";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    playClickSound();
    setLoading(true);

    const trimmedEmail = email.trim();

    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      setLoading(false);
      playSuccessSound();
      setSent(true);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/login/update-password`,
    });

    await createActivityLog(
      "PASSWORD_RESET_REQUESTED",
      `Password reset requested for: ${trimmedEmail}`
    );

    setLoading(false);
    playSuccessSound();
    setSent(true);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-hero-grad-a to-hero-grad-b px-4 py-12 text-ink-700">
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-brand-blue-200/25 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-brand-blue-300/20 blur-[100px] pointer-events-none" />

      <div className="z-10 text-center mb-6 animate-fadeIn">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-ink-500 max-w-sm mx-auto font-medium">
          Enter your admin email to receive a password reset link.
        </p>
      </div>

      {sent ? (
        <div className="z-10 flex w-full max-w-sm flex-col gap-4 rounded-[18px] border border-surface-200 bg-white p-6 shadow-[0_12px_30px_-10px_rgba(49,94,239,0.08)] animate-scaleIn">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-100 text-lg">
              ✉️
            </div>
            <p className="text-sm font-semibold text-ink-800">
              If an account with that email exists, a password reset link has been sent.
            </p>
            <p className="mt-2 text-xs text-ink-500">
              Check your inbox and follow the instructions.
            </p>
          </div>
          <Link
            href="/login"
            onClick={playClickSound}
            className="w-full rounded-xl bg-brand-blue-600 py-3.5 text-center font-bold text-white shadow-md shadow-brand-blue-100 transition duration-200 hover:bg-brand-blue-500 active:scale-98 cursor-pointer"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="z-10 flex w-full max-w-sm flex-col gap-4 rounded-[18px] border border-surface-200 bg-white p-6 shadow-[0_12px_30px_-10px_rgba(49,94,239,0.08)] animate-scaleIn"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[10px] font-bold text-ink-500 uppercase tracking-wider"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              placeholder="admin@startuplab.com"
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-blue-600 py-3.5 font-bold text-white shadow-md shadow-brand-blue-100 transition duration-200 hover:bg-brand-blue-500 active:scale-98 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>

          <Link
            href="/login"
            onClick={playClickSound}
            className="text-center text-xs font-bold text-ink-500 hover:text-brand-blue-600 transition"
          >
            ← Back to Sign In
          </Link>
        </form>
      )}
    </main>
  );
}
