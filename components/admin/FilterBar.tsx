"use client";

import { playClickSound } from "@/lib/audio";
import type { LogType } from "@/lib/supabase";

type SortKey = "date-desc" | "date-asc" | "name-asc" | "name-desc";
type TypeFilter = "all" | LogType;

interface FilterBarProps {
  search: string;
  dateFrom: string;
  dateTo: string;
  typeFilter: TypeFilter;
  sortBy: SortKey;
  totalLogs: number;
  visibleCount: number;
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
  onSortByChange: (value: SortKey) => void;
  onClearFilters: () => void;
}

export default function FilterBar({
  search,
  dateFrom,
  dateTo,
  typeFilter,
  sortBy,
  totalLogs,
  visibleCount,
  hasFilters,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onTypeFilterChange,
  onSortByChange,
  onClearFilters,
}: FilterBarProps) {
  return (
    <div className="z-10 flex flex-col gap-4 rounded-[18px] border border-surface-200 bg-white p-5 shadow-[0_12px_30px_-10px_rgba(49,94,239,0.08)]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search" className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">
            Search name
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="e.g. Alex"
            className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink-950 placeholder-ink-400 outline-none transition focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">
            Type
          </label>
          <select
            id="type"
            value={typeFilter}
            onChange={(e) => { playClickSound(); onTypeFilterChange(e.target.value as TypeFilter); }}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 cursor-pointer"
          >
            <option value="all">All types</option>
            <option value="login">Log In</option>
            <option value="break">Break</option>
            <option value="logout">Log Out</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">
            From date
          </label>
          <input
            id="from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 [color-scheme:light]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">
            To date
          </label>
          <input
            id="to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => onDateToChange(e.target.value)}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 [color-scheme:light]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sort" className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">
            Sort by
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => { playClickSound(); onSortByChange(e.target.value as SortKey); }}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 cursor-pointer"
          >
            <option value="date-desc">Date (newest first)</option>
            <option value="date-asc">Date (oldest first)</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-surface-100 pt-3">
        <span className="text-xs text-ink-400 font-semibold">
          {visibleCount} of {totalLogs} entries matching search query
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-brand-blue-600 hover:text-brand-blue-500 font-bold transition"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
