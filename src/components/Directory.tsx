"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FilterBar } from "./FilterBar";
import { HeroBackdrop } from "./HeroBackdrop";
import { CloneCard } from "./CloneCard";
import { OriginalCard } from "./OriginalCard";
import { SearchBar } from "./SearchBar";
import {
  brandOptions,
  filterAlternatives,
  filterCatalogue,
  isBounded,
  priceBounds,
  UNBOUNDED,
  type PriceRange,
} from "@/lib/filter";
import { buildSearchIndex } from "@/lib/search-index";
import type { OriginalWithAlternatives } from "@/lib/types";

/** What the results grid is showing. */
type Lens = "all" | "originals" | "budget";

const LENSES: { id: Lens; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "originals", label: "Originals" },
  { id: "budget", label: "Budget" },
];

/**
 * The interactive shell of the home page.
 *
 * When nothing is being searched or filtered it shows `idleContent` - the
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
  const [price, setPrice] = useState<PriceRange>(UNBOUNDED);
  const [lens, setLens] = useState<Lens | null>(null);

  // Searching from the header pushes ?q= and lands here. Adjusting during
  // render rather than in an effect - this is the documented way to reset
  // state when an external value changes, and it avoids a second render pass.
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const bounds = useMemo(() => priceBounds(catalogue), [catalogue]);

  // Anything the user has done that means "show me a result list" rather than
  // the curated home page. Picking a lens counts, which is what makes the
  // "Everything" button work as a plain browse-all entry point.
  const browsing =
    query.trim() !== "" || brand !== null || isBounded(price) || lens !== null;

  const active: Lens = lens ?? "all";

  const results = useMemo(
    () =>
      active === "budget"
        ? []
        : filterCatalogue(catalogue, { query, brand, price }),
    [catalogue, query, brand, price, active],
  );

  // Clones are browsable in their own right - people look up "Behringer
  // TO800" as often as "Tube Screamer", and now they can also just scroll
  // the lot. `true` lists them with nothing typed.
  const cloneResults = useMemo(
    () =>
      active === "originals"
        ? []
        : filterAlternatives(catalogue, { query, brand, price }, true),
    [catalogue, query, brand, price, active],
  );

  const brands = useMemo(() => brandOptions(catalogue), [catalogue]);

  const total = results.length + cloneResults.length;

  function reset() {
    setQuery("");
    setBrand(null);
    setPrice(UNBOUNDED);
    setLens(null);
  }

  // Derived from the catalogue this page already holds, so the hero box costs
  // no extra payload - unlike the header, which is handed one by the layout.
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
            Find the budget alternative to any expensive pedal - with honest pros
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
        className="tz-page scroll-mt-20 space-y-8 py-10"
      >
        <FilterBar
          brands={brands}
          brand={brand}
          onBrandChange={setBrand}
          bounds={bounds}
          price={price}
          onPriceChange={setPrice}
          lens={lens}
          lenses={LENSES}
          onLensChange={setLens}
          resultLabel={
            browsing ? `${total} ${total === 1 ? "result" : "results"}` : undefined
          }
          onReset={browsing ? reset : undefined}
        />

        {!browsing ? (
          idleContent
        ) : total > 0 ? (
          // One grid, both kinds. The cards carry the distinction - an original
          // is tinted and gilt-edged, a clone is plain white - so they can sit
          // side by side without a heading telling you which is which.
          <div className="tz-rise grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((result, index) => (
              <OriginalCard key={result.id} result={result} priority={index < 4} />
            ))}
            {cloneResults.map((result) => (
              <CloneCard key={result.alternative.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="tz-chamfer bg-white/70 px-6 py-16 text-center ring-1 ring-stone-200">
            <p className="text-lg font-bold text-stone-800">Nothing matches</p>
            <p className="tz-body mx-auto mt-2 max-w-md text-sm text-stone-500">
              Try a wider price range, or a different brand.
            </p>
            <button
              type="button"
              onClick={reset}
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
