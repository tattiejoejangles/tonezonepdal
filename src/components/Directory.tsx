"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FilterBar } from "./FilterBar";
import { HeroBackdrop } from "./HeroBackdrop";
import { CloneCard } from "./CloneCard";
import { OriginalCard } from "./OriginalCard";
import { SearchBar } from "./SearchBar";
import { brandOptions, filterAlternatives, filterCatalogue } from "@/lib/filter";
import { buildSearchIndex } from "@/lib/search-index";
import type { OriginalWithAlternatives } from "@/lib/types";

/**
 * The interactive shell of the home page.
 *
 * When nothing is being searched or filtered it shows `idleContent` — the
 * curated Find of the Day and genre sections rendered on the server. As soon
 * as the user types or picks a price band it switches to a flat result grid,
 * because genre grouping just gets in the way when you're hunting for one
 * specific pedal.
 */
export function Directory({
  catalogue,
  idleContent,
}: {
  catalogue: OriginalWithAlternatives[];
  idleContent: React.ReactNode;
}) {
  const params = useSearchParams();
  const urlQuery = params.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  const [brand, setBrand] = useState<string | null>(null);

  // Searching from the header pushes ?q= and lands here. Adjusting during
  // render rather than in an effect — this is the documented way to reset
  // state when an external value changes, and it avoids a second render pass.
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const searching = query.trim() !== "" || brand !== null;

  const results = useMemo(
    () => filterCatalogue(catalogue, { query, brand }),
    [catalogue, query, brand],
  );

  // Clones are searchable in their own right — people look up "Behringer
  // TO800" as often as "Tube Screamer".
  const cloneResults = useMemo(
    () => filterAlternatives(catalogue, { query, brand }),
    [catalogue, query, brand],
  );

  const brands = useMemo(() => brandOptions(catalogue), [catalogue]);

  const total = results.length + cloneResults.length;

  // Derived from the catalogue this page already holds, so the hero box costs
  // no extra payload — unlike the header, which is handed one by the layout.
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
            Find the budget alternative to any expensive pedal — with honest pros
            and cons, and exactly what you save.
          </p>

          <div className="mx-auto mt-9 max-w-xl">
            <SearchBar
              value={query}
              onChange={setQuery}
              index={searchIndex}
              tone="dark"
            />
          </div>
        </div>
      </HeroBackdrop>

      <div
        id="directory"
        className="mx-auto max-w-6xl scroll-mt-20 space-y-8 px-4 py-10 sm:px-6"
      >
        <FilterBar
          brands={brands}
          brand={brand}
          onBrandChange={setBrand}
          resultLabel={
            searching
              ? `${total} ${total === 1 ? "match" : "matches"}`
              : undefined
          }
        />

        {!searching ? (
          idleContent
        ) : total > 0 ? (
          <div className="tz-rise space-y-10">
            {results.length > 0 && (
              <section>
                <h2 className="tz-eyebrow mb-4 text-stone-500">
                  Original pedals ({results.length})
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((result, index) => (
                    <OriginalCard key={result.id} result={result} priority={index < 3} />
                  ))}
                </div>
              </section>
            )}

            {cloneResults.length > 0 && (
              <section>
                <h2 className="tz-eyebrow mb-4 text-stone-500">
                  Budget options ({cloneResults.length})
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {cloneResults.map((result) => (
                    <CloneCard key={result.alternative.id} result={result} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="tz-chamfer bg-white/70 px-6 py-16 text-center ring-1 ring-stone-200">
            <p className="text-lg font-bold text-stone-800">Nothing matches yet</p>
            <p className="tz-body mx-auto mt-2 max-w-md text-sm text-stone-500">
              Try a different brand, or search the original by name — “Tube
              Screamer”, “BD-2”, “chorus”.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setBrand(null);
              }}
              className="tz-btn mt-5 bg-linear-to-b from-stone-800 to-stone-950 px-6 py-3 text-sm tracking-wide text-white"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
