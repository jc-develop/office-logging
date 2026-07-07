"use client";

import { playClickSound } from "@/lib/audio";

interface Person {
  name: string;
}

interface PersonFormProps {
  people: Person[];
  saving: boolean;
  maxPeople: number;
  onUpdateName: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export default function PersonForm({
  people,
  saving,
  maxPeople,
  onUpdateName,
  onRemove,
  onAdd,
}: PersonFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-ink-500">Session Colleagues ({people.length}/{maxPeople})</label>
        <button
          type="button"
          onClick={() => { playClickSound(); onAdd(); }}
          disabled={saving || people.length >= maxPeople}
          className="cursor-pointer text-xs font-extrabold text-brand-blue-600 transition hover:text-brand-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ➕ Add Friend
        </button>
      </div>

      {people.map((person, index) => (
        <div key={index} className="relative flex flex-col gap-2 rounded-2xl border border-brand-blue-100 bg-brand-blue-50/20 p-4 shadow-sm">
          {index > 0 && (
            <button
              type="button"
              onClick={() => { playClickSound(); onRemove(index); }}
              disabled={saving}
              title="Remove person"
              className="absolute right-2 top-2 cursor-pointer rounded-xl p-1.5 text-ink-400 transition hover:bg-brand-blue-100 hover:text-brand-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}

          <div className="flex items-start gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink-500">Name</label>
              <input
                type="text"
                value={person.name}
                onChange={(e) => onUpdateName(index, e.target.value)}
                placeholder="e.g. Alex"
                disabled={saving}
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink-950 placeholder-ink-400 outline-none transition focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500/20"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
