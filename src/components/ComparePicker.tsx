"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PedalImage } from "./PedalImage";
import { formatPrice } from "@/lib/format";

export interface PickerOption {
  slug: string;
  name: string;
  brand: string;
  priceGBP: number;
  imageUrl: string | null;
  kind: "original" | "clone";
  matchQuality?: number;
}

/**
 * Everything else in the genre, as the right-hand column of the comparison.
 *
 * A list rather than a dropdown, and it stays on screen after you pick. The ask
 * was to compare against "every other pedal in that genre", which means
 * flicking through them - a select that closes after each choice makes you
 * re-open it every single time.
 *
 * Each entry is a link to /compare?a=…&b=…, so every pairing is a real URL that
 * can be shared and that the back button steps through properly.
 */
export function ComparePicker({
  leftSlug,
  options,
  selectedSlug,
  genreLabel,
}: {
  leftSlug: string;
  options: PickerOption[];
  selectedSlug: string | null;
  genreLabel: string;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(term) ||
        option.brand.toLowerCase().includes(term),
    );
  }, [options, query]);

  return (
    <div className="tz-chamfer bg-white p-4 tz-card ring-1 ring-stone-200/60">
      <p className="tz-eyebrow text-stone-500">Compare against</p>
      <p className="tz-body mt-1 mb-3 text-xs text-stone-500">
        {options.length} others in {genreLabel}, cheapest first.
      </p>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by name or brand…"
        aria-label="Filter the comparison list"
        className="mb-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-amber-500"
      />

      <ul className="max-h-[32rem] space-y-1 overflow-y-auto overscroll-contain">
        {matches.map((option) => {
          const active = option.slug === selectedSlug;
          return (
            <li key={option.slug}>
              <Link
                href={`/compare?a=${leftSlug}&b=${option.slug}`}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg p-2 transition-colors ${
                  active
                    ? "bg-amber-50 ring-1 ring-amber-300"
                    : "hover:bg-stone-50 focus-visible:bg-stone-50"
                }`}
              >
                <span className="tz-well relative h-10 w-10 shrink-0">
                  <PedalImage
                    src={option.imageUrl}
                    name={option.name}
                    brand={option.brand}
                    sizes="40px"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-stone-800">
                    {option.name}
                  </span>
                  <span className="block text-[11px] text-stone-500">
                    {option.kind === "clone" ? "Budget" : "Original"}
                    {option.matchQuality !== undefined
                      ? ` · ${option.matchQuality}% match`
                      : ""}
                  </span>
                </span>

                <span className="shrink-0 text-xs font-bold text-stone-700 tabular-nums">
                  {formatPrice(option.priceGBP)}
                </span>
              </Link>
            </li>
          );
        })}

        {matches.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-stone-500">
            Nothing matches “{query}”.
          </li>
        )}
      </ul>
    </div>
  );
}
