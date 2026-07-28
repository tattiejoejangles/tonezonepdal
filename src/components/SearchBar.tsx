"use client";

import { useRef } from "react";

import { SearchSuggestions, useSuggestions } from "./SearchSuggestions";
import type { SearchIndex } from "@/lib/search-index";

export function SearchBar({
  value,
  onChange,
  index,
  tone = "light",
}: {
  value: string;
  onChange: (value: string) => void;
  /** Pedals to suggest as you type. */
  index: SearchIndex;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const inputRef = useRef<HTMLInputElement>(null);
  const suggest = useSuggestions(index, value);

  return (
    <div className="w-full">
      <label htmlFor="pedal-search" className="sr-only">
        Search for a pedal
      </label>

      <div className="group relative" {...suggest.containerProps}>
        {/* Glow that wakes up on focus. */}
        <div
          aria-hidden
          className="absolute -inset-0.5 rounded-full bg-linear-to-r from-amber-400 via-orange-500 to-rose-500 opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-70"
        />

        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={`pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 ${
              dark ? "text-stone-500" : "text-stone-400"
            }`}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            id="pedal-search"
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search a pedal - “Tube Screamer”, “HM-2”, “delay”…"
            autoComplete="off"
            {...suggest.inputProps}
            className={`w-full rounded-full border-0 py-4 pr-24 pl-14 text-base font-medium outline-none ${
              dark
                ? "bg-[#151c30] text-white placeholder:text-stone-500"
                : "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 placeholder:text-stone-400"
            }`}
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className={`absolute top-1/2 right-4 -translate-y-1/2 px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors ${
                dark
                  ? "text-stone-400 hover:text-white"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Clear
            </button>
          )}
        </div>

        {suggest.open && (
          <SearchSuggestions
            suggestions={suggest.suggestions}
            active={suggest.active}
            listId={suggest.listId}
            onHover={suggest.setActive}
            onSelect={suggest.dismiss}
            tone={tone}
            anchorRef={inputRef}
          />
        )}
      </div>
    </div>
  );
}
