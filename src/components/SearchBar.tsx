"use client";

import { useRouter } from "next/navigation";
import { useId, useRef } from "react";

import { SearchSuggestions, useSuggestions } from "./SearchSuggestions";
import type { SearchIndex } from "@/lib/search-index";

export function SearchBar({
  value,
  onChange,
  index,
  tone = "light",
  placeholder = "Search a pedal - “Tube Screamer”, “HM-2”, “delay”…",
  submitTo,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Pedals to suggest as you type. */
  index: SearchIndex;
  tone?: "light" | "dark";
  /**
   * Where enter goes, e.g. "/pedals". Omit on a page that already filters as
   * you type - there, submitting has nowhere to go and the form would just
   * reload the page.
   */
  submitTo?: string;
}) {
  const dark = tone === "dark";
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggest = useSuggestions(index, value);
  // Generated: this renders in the hero and again on the browse pages, and a
  // hardcoded id put two of them in one document with a label pointing at
  // whichever came first.
  const inputId = useId();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!submitTo) return;
    suggest.dismiss();
    const trimmed = value.trim();
    router.push(trimmed ? `${submitTo}?q=${encodeURIComponent(trimmed)}` : submitTo);
  }

  const Wrapper = submitTo ? "form" : "div";

  return (
    <Wrapper
      className="w-full"
      {...(submitTo ? { onSubmit: submit, role: "search" } : {})}
    >
      <label htmlFor={inputId} className="sr-only">
        Search for a pedal
      </label>

      <div className="group relative" {...suggest.containerProps}>
        {/* Glow that wakes up on focus. */}
        <div
          aria-hidden
          className="absolute -inset-0.5 rounded bg-amber-500 opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-70"
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
            id={inputId}
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            {...suggest.inputProps}
            className={`w-full rounded-md border-0 py-4 pr-24 pl-14 text-base font-medium outline-none ${
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
    </Wrapper>
  );
}
