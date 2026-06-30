"use client";

import BadgeList from "./BadgeList";

interface WelcomeCard {
  name: string;
  welcomeMessage: string;
  badges: Array<{ name: string; icon: string; style: string }>;
}

interface SuccessCardProps {
  message: string;
  welcomeCards: WelcomeCard[];
}

export default function SuccessCard({ message, welcomeCards }: SuccessCardProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-brand-blue-100 bg-gradient-to-b from-brand-blue-50/40 to-brand-blue-100/10 p-6 text-center shadow-inner animate-scaleIn">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-blue-600 to-brand-blue-500 text-xl font-bold text-white shadow-md shadow-brand-blue-100">
        ✨
      </div>
      <div>
        <h3 className="font-display text-xl font-extrabold text-ink-900">{message}</h3>
        <p className="mt-1 text-xs font-medium text-ink-500">Logged successfully in StartupLab database</p>
      </div>

      <div className="mt-2 flex flex-col gap-4 border-t border-surface-200/50 pt-5 text-left">
        {welcomeCards.map((card, index) => (
          <div
            key={index}
            className="flex flex-col gap-2.5 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm animate-scaleIn"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink-900">{card.name}</span>
              <span className="rounded-full border border-brand-blue-200/50 bg-brand-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-blue-600">
                Unlocked
              </span>
            </div>
            <p className="text-xs leading-relaxed italic text-ink-600">&ldquo;{card.welcomeMessage}&rdquo;</p>
            <BadgeList badges={card.badges} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold text-ink-400 animate-pulse">
        <div className="h-1.5 w-1.5 rounded-full bg-brand-blue-600" />
        Loading new logging session...
      </div>
    </div>
  );
}
