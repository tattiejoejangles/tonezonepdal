"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { BrandOption } from "@/lib/filter";

/**
 * Brand picker for the directory.
 *
 * A dropdown rather than a row of pills: there are 22 brands and counting, and
 * as pills they wrapped into a wall of buttons. It carries its own search box
 * because scanning 22 names is slower than typing three letters.
 */
export function BrandFilter({
  brands,
  value,
  onChange,
}: {
  brands: BrandOption[];
  /** Selected brand, or null for all. */
  value: string | null;
  onChange: (brand: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return brands;
    return brands.filter((option) => option.brand.toLowerCase().includes(term));
  }, [brands, search]);

  // The point of the panel is the search box, so put the caret in it.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    setSearch("");
    setActive(0);
  }

  function choose(brand: string | null) {
    onChange(brand);
    close();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (matches.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? matches.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(matches[active].brand);
    }
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`tz-btn flex items-center gap-2 px-4 py-2 text-xs whitespace-nowrap  focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
          value
            ? "bg-stone-900 text-white shadow-md"
            : "bg-white text-stone-600 hover:text-stone-900"
        }`}
      >
        {value ?? "All brands"}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {value && (
        <button
          type="button"
          onClick={() => choose(null)}
          className="ml-2 text-[11px] font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-stone-900"
        >
          Clear
        </button>
      )}

      {open && (
        <div className="tz-pop absolute top-full left-0 z-40 mt-2 w-64 bg-white shadow-2xl">
          <div className="border-b border-stone-100 p-2">
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search brands…"
              aria-label="Search brands"
              aria-controls={listId}
              autoComplete="off"
              className="w-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-800 outline-none placeholder:text-stone-400 focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
            <button
              type="button"
              role="option"
              aria-selected={value === null}
              onClick={() => choose(null)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm font-bold transition-colors ${
                value === null ? "bg-amber-50 text-stone-900" : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              All brands
            </button>

            {matches.map((option, index) => (
              <button
                key={option.brand}
                type="button"
                role="option"
                aria-selected={option.brand === value}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option.brand)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  index === active || option.brand === value
                    ? "bg-amber-50 text-stone-900"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <span className="truncate font-bold">{option.brand}</span>
                <span className="shrink-0 text-[11px] font-bold text-stone-400">
                  {option.count}
                </span>
              </button>
            ))}

            {matches.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-stone-500">
                No brand matches “{search}”.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
