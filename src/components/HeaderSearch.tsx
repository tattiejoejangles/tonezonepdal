"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Compact search in the site header.
 *
 * Submitting pushes the term into the URL as `?q=`, which the home page
 * directory reads. Going through the URL rather than shared state means
 * results are linkable, the back button behaves, and it works from a pedal
 * page as well as the home page.
 *
 * Deliberately does NOT read the current `?q=` with useSearchParams: this
 * component lives in the root layout, and useSearchParams would opt every
 * statically rendered page into client-side rendering for the whole boundary.
 * The header box starting empty is a fair trade for keeping pedal pages static.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}#directory` : "/");
  }

  return (
    <form onSubmit={submit} role="search" className="relative w-full max-w-xs">
      <label htmlFor="header-search" className="sr-only">
        Search pedals
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
        id="header-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search pedals…"
        className="w-full border border-stone-200 bg-stone-50 py-2 pr-3 pl-9 text-sm font-medium text-stone-800 transition-colors outline-none placeholder:text-stone-400 focus:border-amber-500 focus:bg-white"
      />
    </form>
  );
}
