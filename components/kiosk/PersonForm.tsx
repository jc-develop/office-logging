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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-ink-500">Participants ({people.length}/{maxPeople})</label>
        <button
          type="button"
          onClick={() => { playClickSound(); onAdd(); }}
          disabled={saving || people.length >= maxPeople}
          className="cursor-pointer text-sm font-extrabold text-brand-blue-600 transition hover:text-brand-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ➕ Add Friend
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {people.map((person, index) => (
        <div key={index} className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white p-3 transition-colors hover:border-brand-blue-200">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={person.name}
              onChange={(e) => onUpdateName(index, e.target.value)}
              placeholder="e.g. Alex"
              disabled={saving}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-base text-ink-950 placeholder-ink-400 outline-none transition focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500/20"
            />
          </div>

          {people.length > 1 && (
            <button
              type="button"
              onClick={() => { playClickSound(); onRemove(index); }}
              disabled={saving}
              title="Remove person"
              className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-400 transition hover:bg-red-100 hover:text-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
        ))}
      </div>
    </div>
  );
}
