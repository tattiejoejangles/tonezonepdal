"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { SearchSuggestions, useSuggestions } from "./SearchSuggestions";
import type { SearchIndex } from "@/lib/search-index";

/**
 * Compact search in the site header.
 *
 * Typing suggests matching pedals and clicking one goes straight to its page.
 * Submitting instead pushes the term into the URL as `?q=`, which the home
 * page directory reads. Going through the URL rather than shared state means
 * results are linkable, the back button behaves, and it works from a pedal
 * page as well as the home page.
 *
 * Deliberately does NOT read the current `?q=` with useSearchParams: this
 * component lives in the root layout, and useSearchParams would opt every
 * statically rendered page into client-side rendering for the whole boundary.
 * The header box starting empty is a fair trade for keeping pedal pages
 * static. The suggestion index arrives as a prop for the same reason - it is
 * built on the server, so nothing here forces a page to render on the client.
 */
export function HeaderSearch({ index }: { index: SearchIndex }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggest = useSuggestions(index, value);
  // Generated, not the literal "header-search": the header renders this twice
  // - once in the desktop row and once in the mobile panel - and a hardcoded
  // id put two of them in the document, which points both labels at the first
  // (hidden) input and leaves the visible one unlabelled.
  const inputId = useId();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    suggest.dismiss();
    const trimmed = value.trim();
    // /pedals, not the home page: the home page is curated and no longer
    // filters, so a search term landing there had nothing to act on.
    router.push(trimmed ? `/pedals?q=${encodeURIComponent(trimmed)}` : "/pedals");
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="relative w-full max-w-xs"
      {...suggest.containerProps}
    >
      <label htmlFor={inputId} className="sr-only">
        Search pedals and amps
      </label>

      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        id={inputId}
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search pedals and amps…"
        autoComplete="off"
        {...suggest.inputProps}
        className="w-full border border-stone-200 bg-stone-50 py-2 pr-3 pl-9 text-sm font-medium text-stone-800 transition-colors outline-none placeholder:text-stone-400 focus:border-amber-500 focus:bg-white"
      />

      {suggest.open && (
        <SearchSuggestions
          suggestions={suggest.suggestions}
          active={suggest.active}
          listId={suggest.listId}
          onHover={suggest.setActive}
          onSelect={suggest.dismiss}
          anchorRef={inputRef}
          minWidth={360}
        />
      )}
    </form>
  );
}
