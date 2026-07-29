"use client";

import { useMemo, useState } from "react";

import { HeroBackdrop } from "./HeroBackdrop";
import { SearchBar } from "./SearchBar";
import { buildSearchIndex } from "@/lib/search-index";
import type { OriginalWithAlternatives } from "@/lib/types";

/**
 * The home page shell: the hero, then the curated content beneath it.
 *
 * The hero search is a *jump-to*, not a filter. It used to do both - typing
 * opened the suggestion dropdown and simultaneously tore the curated page
 * below it apart and replaced it with a result grid, so the thing you were
 * reading vanished while you were still typing the second letter.
 *
 * Now the dropdown is the whole interaction: pick a suggestion to go straight
 * to that page, or press enter to land on /pedals with the term applied.
 * Filtering by brand, price and family lives there, on the page built for it.
 */
export function Directory({
  catalogue,
  idleContent,
}: {
  catalogue: OriginalWithAlternatives[];
  idleContent: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  // Derived from the catalogue this page already holds, so the hero box costs
  // no extra payload.
  const searchIndex = useMemo(() => buildSearchIndex(catalogue), [catalogue]);

  return (
    <div>
      {/* Full-bleed: the hero spans the viewport, not the content column. */}
      <HeroBackdrop>
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Great tone,
            <br />
            <span className="bg-linear-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              not boutique prices
            </span>
          </h1>

          <p className="tz-body mx-auto mt-6 max-w-xl text-base text-stone-300 sm:text-lg">
            Find the budget alternative to any expensive pedal or amp - with
            honest pros and cons, and exactly what you save.
          </p>

          <div className="mx-auto mt-9 max-w-xl">
            <SearchBar
              value={query}
              onChange={setQuery}
              index={searchIndex}
              tone="dark"
              submitTo="/pedals"
            />
          </div>
        </div>
      </HeroBackdrop>

      <div id="directory" className="tz-page scroll-mt-20 py-10">
        {idleContent}
      </div>
    </div>
  );
}
