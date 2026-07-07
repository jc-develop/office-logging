"use client";

interface SessionGreetingProps {
  emoji: string;
  text: string;
  variant?: "hero" | "inline";
}

export default function SessionGreeting({ emoji, text, variant = "hero" }: SessionGreetingProps) {
  if (variant === "inline") {
    return (
      <div className="relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-surface-200/60 bg-white px-4 py-3 text-center select-none shadow-sm">
        {emoji && <span className="text-xl animate-pulse">{emoji}</span>}
        <span className="font-slogan bg-gradient-to-r from-brand-blue-600 via-brand-blue-500 to-brand-blue-300 bg-clip-text text-base font-black tracking-wide text-transparent md:text-lg">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-surface-200/80 px-4 py-3 text-center shadow-[0_8px_30px_rgba(49,94,239,0.03)] animate-scaleIn flex flex-col items-center justify-center gap-1 select-none">
      <div className="absolute top-1.5 left-2 text-brand-blue-600/30 animate-pulse">
        <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
      </div>
      <div className="absolute bottom-1.5 right-2 text-brand-blue-400/30 animate-pulse delay-100">
        <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
      </div>

      {emoji && <span className="animate-bounce text-xl drop-shadow-sm">{emoji}</span>}
      <p className="font-slogan select-none bg-gradient-to-r from-brand-blue-600 via-brand-blue-500 to-brand-blue-300 bg-clip-text text-base font-black leading-snug tracking-wide text-transparent">
        {text}
      </p>
    </div>
  );
}
