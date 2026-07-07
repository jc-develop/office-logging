"use client";

import LogForm from "./LogForm";
import KioskNavbar from "./KioskNavbar";

export default function KioskPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-hero-grad-a to-hero-grad-b font-sans text-ink-700">
      <div className="absolute -top-40 -left-40 h-[450px] w-[450px] rounded-full bg-brand-blue-200/25 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-brand-blue-300/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-brand-blue-100/15 blur-[160px] pointer-events-none" />

      <KioskNavbar />

      <div className="flex flex-1 flex-col items-center justify-center px-2 py-2">
        <LogForm />
      </div>
    </main>
  );
}
