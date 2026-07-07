import Image from "next/image";
import Link from "next/link";

export default function KioskNavbar() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-surface-200 bg-white/70 px-3 py-2 backdrop-blur-md shadow-sm sm:px-4 sm:py-2.5">
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
          <Image src="/StartupLabLogo.png" alt="Company logo" fill className="object-contain" />
        </div>
        <div className="relative h-6 w-[120px] sm:h-8 sm:w-[140px] -translate-x-1">
          <Image src="/StartupLabTextLogo.png" alt="StartupLab Business Center" fill className="object-contain" />
        </div>
      </div>

      <h1 className="font-display text-base font-extrabold tracking-tight text-ink-900 sm:text-lg">
        StartupLab Office Logging
      </h1>

      <Link
        href="/login"
        className="rounded-xl border border-surface-200 bg-white px-3 py-1 text-[10px] font-semibold text-ink-700 transition hover:border-brand-blue-300 hover:bg-brand-blue-50/50 hover:text-brand-blue-600 shadow-sm sm:px-4 sm:py-1.5 sm:text-xs"
      >
        🔑 Admin Portal
      </Link>
    </header>
  );
}
