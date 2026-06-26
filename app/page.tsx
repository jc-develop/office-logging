"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import LogForm from "@/components/LogForm";
import Link from "next/link";
import CompanyLogo from "@/images/Company_Logo.png";
import CompanyText from "@/images/Company_Text_Black.png";

export default function Home() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-hero-grad-a to-hero-grad-b px-4 py-12 font-sans text-ink-700">
      {/* Decorative moving gradient blobs - Soft light blue & cyan accents */}
      <div className="absolute -top-40 -left-40 h-[450px] w-[450px] rounded-full bg-brand-blue-200/25 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-brand-cyan/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-brand-blue-100/15 blur-[160px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between border-b border-surface-200 bg-white/90 px-6 py-4 backdrop-blur-md z-10 shadow-sm">
        <div className="flex items-center gap-0.5">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
            <Image src={CompanyLogo} alt="Company logo" fill className="object-contain" />
          </div>
          <div className="relative h-20 w-[240px] sm:h-24 sm:w-[150px] -translate-x-3 sm:-translate-x-4">
            <Image src={CompanyText} alt="StartupLab Business Center" fill className="object-contain" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-xs text-ink-500">
            <div>{dateString}</div>
            <div className="font-semibold text-ink-700">{timeString}</div>
          </div>

          <Link
            href="/login"
            className="rounded-xl border border-surface-200 bg-white px-4 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-blue-300 hover:bg-brand-blue-50/50 hover:text-brand-blue-600 shadow-sm"
          >
            🔑 Admin Portal
          </Link>
        </div>
      </header>

      {/* Main Kiosk Dashboard */}
      <div className="z-10 flex w-full flex-col items-center gap-8 mt-12">
        <div className="text-center animate-fadeIn">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            StartupLab Office Logging
          </h1>
          <p className="mt-3 text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
            Welcome to the StartupLab workspace. Please select an action below to begin your logging session.
          </p>
        </div>

        <LogForm />
      </div>

      {/* Privacy-Compliant Footer */}
      <footer className="absolute bottom-4 text-center text-ink-400 text-[11px] pointer-events-none font-medium tracking-wide">
        StartupLab Kiosk System • Privacy & GDPR Compliant • Powered by Supabase
      </footer>
    </main>
  );
}
