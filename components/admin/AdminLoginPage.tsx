"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, IS_MOCK } from "@/lib/supabase";
import { playClickSound, playSuccessSound, playErrorSound } from "@/lib/audio";
import { createActivityLog } from "@/lib/logs";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState<number | null>(null);
  const [captchaInput, setCaptchaInput] = useState("");

  const showCaptcha = failedAttempts >= 3;

  function generateCaptcha() {
    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 9) + 2;
    setCaptchaQuestion(`Prove you are human: What is ${a} + ${b}?`);
    setCaptchaAnswer(a + b);
    setCaptchaInput("");
  }

  useEffect(() => {
    if (showCaptcha) {
      generateCaptcha();
    }
  }, [showCaptcha]);

  function getMockCredentials(): Array<{ email: string; password: string }> {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("mock_admin_credentials");
    return stored ? JSON.parse(stored) : [];
  }

  function saveMockCredential(email: string, password: string) {
    const creds = getMockCredentials();
    creds.push({ email, password });
    localStorage.setItem("mock_admin_credentials", JSON.stringify(creds));
  }

  function isValidMockCredential(email: string, password: string): boolean {
    if (email === "admin@startuplab.com" && password === "admin123") return true;
    return getMockCredentials().some(
      (c) => c.email === email && c.password === password
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    playClickSound();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim();

    if (mode === "signup") {
      if (!trimmedEmail || password.length < 6) {
        setLoading(false);
        playErrorSound();
        setError("Email is required and password must be at least 6 characters.");
        return;
      }

      if (IS_MOCK) {
        const existing = getMockCredentials().some((c) => c.email === trimmedEmail);
        if (existing || trimmedEmail === "admin@startuplab.com") {
          setLoading(false);
          playErrorSound();
          setError("An account with this email already exists.");
          return;
        }

        saveMockCredential(trimmedEmail, password);
        localStorage.setItem("mock_admin_session", "true");
        setLoading(false);
        playSuccessSound();
        await createActivityLog("SIGN_UP", `Admin account created: ${trimmedEmail} (Local Mock)`);
        router.push("/logs");
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      setLoading(false);

      if (signUpError) {
        playErrorSound();
        setError(signUpError.message);
        await createActivityLog("FAILED_SIGN_UP", `Sign-up failed: ${trimmedEmail}. Error: ${signUpError.message}`);
        return;
      }

      playSuccessSound();
      await createActivityLog("SIGN_UP", `Admin account created: ${trimmedEmail}`);
      setError("Account created! Check your email for a confirmation link, then sign in.");
      setMode("signin");
      return;
    }

    if (showCaptcha) {
      if (parseInt(captchaInput) !== captchaAnswer) {
        setLoading(false);
        playErrorSound();
        setError("Incorrect CAPTCHA solution. Please try again.");
        generateCaptcha();
        await createActivityLog("FAILED_SIGN_IN", `Blocked by captcha. Admin login attempt: ${trimmedEmail}`);
        return;
      }
    }

    if (IS_MOCK) {
      setTimeout(async () => {
        setLoading(false);
        if (isValidMockCredential(trimmedEmail, password)) {
          playSuccessSound();
          if (typeof window !== "undefined") {
            localStorage.setItem("mock_admin_session", "true");
          }
          await createActivityLog("SIGN_IN", `Admin signed in successfully: ${trimmedEmail} (Local Mock)`);
          router.push("/logs");
        } else {
          playErrorSound();
          setFailedAttempts((prev) => prev + 1);
          setError("Invalid email or password.");
          await createActivityLog("FAILED_SIGN_IN", `Failed login attempt: ${trimmedEmail} (Local Mock)`);
        }
      }, 800);
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      setLoading(false);

      if (authError) {
        playErrorSound();
        setFailedAttempts((prev) => prev + 1);
        setError(authError.message);
        await createActivityLog("FAILED_SIGN_IN", `Failed login attempt: ${trimmedEmail}. Error: ${authError.message}`);
        return;
      }

      playSuccessSound();
      await createActivityLog("SIGN_IN", `Admin signed in successfully: ${trimmedEmail}`);
      router.push("/logs");
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-hero-grad-a to-hero-grad-b px-4 py-12 text-ink-700">
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-brand-blue-200/25 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-brand-blue-300/20 blur-[100px] pointer-events-none" />

      <div className="z-10 text-center mb-6 animate-fadeIn">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
          Admin Portal
        </h1>
        <p className="mt-2 text-sm text-ink-500 max-w-sm mx-auto font-medium">
          {mode === "signin" ? "Sign in to audit database log entries." : "Create an admin account to get started."}
        </p>
      </div>

      <div className="z-10 flex w-full max-w-sm rounded-[18px] border border-surface-200 bg-white p-1 shadow-[0_12px_30px_-10px_rgba(49,94,239,0.08)] animate-scaleIn mb-4">
        <button
          type="button"
          onClick={() => { setMode("signin"); setError(null); }}
          className={`flex-1 rounded-[14px] py-2.5 text-xs font-bold uppercase tracking-wider transition ${
            mode === "signin" ? "bg-brand-blue-600 text-white shadow-sm" : "text-ink-500 hover:text-ink-700"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode("signup"); setError(null); }}
          className={`flex-1 rounded-[14px] py-2.5 text-xs font-bold uppercase tracking-wider transition ${
            mode === "signup" ? "bg-brand-blue-600 text-white shadow-sm" : "text-ink-500 hover:text-ink-700"
          }`}
        >
          Create Account
        </button>
      </div>

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
            placeholder={mode === "signin" ? "admin@startuplab.com" : "you@example.com"}
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-[10px] font-bold text-ink-500 uppercase tracking-wider"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            disabled={loading}
            placeholder="••••••••"
            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500/20"
          />
        </div>

        {showCaptcha && (
          <div className="rounded-xl border border-brand-blue-100 bg-brand-blue-50/30 p-3.5 animate-fadeIn">
            <label
              htmlFor="captcha"
              className="mb-1.5 block text-xs font-bold text-brand-blue-600 uppercase tracking-wider"
            >
              {captchaQuestion}
            </label>
            <input
              id="captcha"
              type="number"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter result"
              className="w-full rounded-xl border border-brand-blue-200 bg-white px-3 py-2 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500/20"
            />
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-brand-blue-50 border border-brand-blue-200 px-4 py-3 text-center text-xs font-bold text-brand-blue-700 animate-fadeIn">
            ⚠️ {error}
          </p>
        )}

        {IS_MOCK && mode === "signin" && (
          <div className="rounded-xl bg-brand-blue-50 border border-brand-blue-100 p-3.5 text-[11px] text-brand-blue-600 font-semibold text-center leading-relaxed">
            💡 Local demo. Default sign in:
            <br />
            <span className="text-ink-900 font-bold">admin@startuplab.com</span> / <span className="text-ink-900 font-bold">admin123</span>
            <br />
            Or use any account you created via <span className="text-ink-900 font-bold">Create Account</span>.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-blue-600 py-3.5 font-bold text-white shadow-md shadow-brand-blue-100 transition duration-200 hover:bg-brand-blue-500 active:scale-98 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
        >
          {loading
            ? "Please wait…"
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <Link
        href="/"
        onClick={playClickSound}
        className="z-10 mt-6 text-xs font-bold text-ink-500 hover:text-brand-blue-600 transition"
      >
        ← Back to Kiosk Logins
      </Link>
    </main>
  );
}
