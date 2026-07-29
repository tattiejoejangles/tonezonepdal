"use client";

import { useMemo, useState } from "react";

import { CloneCard } from "./CloneCard";
import { FilterBar } from "./FilterBar";
import { OriginalCard } from "./OriginalCard";
import { SearchBar } from "./SearchBar";
import {
  brandOptions,
  filterAlternatives,
  filterCatalogue,
  priceBounds,
  UNBOUNDED,
  type PriceRange,
} from "@/lib/filter";
import { buildSearchIndex } from "@/lib/search-index";
import { AMPS_GENRE, GENRES } from "@/lib/sections";
import type { OriginalWithAlternatives } from "@/lib/types";

/** What the grid is showing. Same three lenses the home directory offers. */
type Lens = "all" | "originals" | "budget";

const LENSES: { id: Lens; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "originals", label: "Originals" },
  { id: "budget", label: "Budget" },
];

/**
 * The "All pedals" page.
 *
 * Everything in the catalogue in one grid, always - unlike the home page,
 * which stays curated until you touch a control. This is the page the header's
 * "All pedals" link goes to, and it is where the filters live: family, brand,
 * price and which half of the catalogue you want.
 *
 * Family is a row of chips rather than another dropdown. There are nine of
 * them, they are the coarsest cut anyone makes, and one tap is better than
 * open-scan-tap when the whole point of the page is browsing.
 */
export function GearBrowser({
  catalogue,
  initialFamily = null,
}: {
  catalogue: OriginalWithAlternatives[];
  /** A genre id from `lib/sections`, e.g. "overdrive" or "amps". */
  initialFamily?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [price, setPrice] = useState<PriceRange>(UNBOUNDED);
  const [family, setFamily] = useState<string | null>(initialFamily);
  const [lens, setLens] = useState<Lens>("all");

  // One chip per genre, not per category: "Distortion & Fuzz" covers two
  // categories and rendering one chip each gave it two identical buttons.
  const families = useMemo(
    () => [...GENRES, AMPS_GENRE].map((genre) => ({ id: genre.id, label: genre.label, categories: genre.categories })),
    [],
  );

  const categories = family
    ? (families.find((entry) => entry.id === family)?.categories ?? null)
    : null;

  const bounds = useMemo(() => priceBounds(catalogue), [catalogue]);
  const brands = useMemo(() => brandOptions(catalogue), [catalogue]);
  const searchIndex = useMemo(() => buildSearchIndex(catalogue), [catalogue]);

  const originals = useMemo(
    () =>
      lens === "budget"
        ? []
        : filterCatalogue(catalogue, { query, brand, price, categories }),
    [catalogue, query, brand, price, categories, lens],
  );

  const clones = useMemo(
    () =>
      lens === "originals"
        ? []
        : filterAlternatives(catalogue, { query, brand, price, categories }, true),
    [catalogue, query, brand, price, categories, lens],
  );

  const total = originals.length + clones.length;

  function reset() {
    setQuery("");
    setBrand(null);
    setPrice(UNBOUNDED);
    setFamily(null);
    setLens("all");
  }

  return (
    <div className="space-y-6">
      <div className="max-w-xl">
        <SearchBar value={query} onChange={setQuery} index={searchIndex} />
      </div>

      {/* Family chips. Horizontally scrollable on phones rather than wrapping
          into four rows and pushing the results off the screen. */}
      <div
        role="radiogroup"
        aria-label="Effect family"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {[{ id: null, label: "All" }, ...families].map((entry) => {
          const selected = entry.id === family;
          return (
            <button
              key={entry.id ?? "all"}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setFamily(entry.id)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-bold tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                selected
                  ? "bg-linear-to-b from-stone-800 to-stone-950 text-white shadow-sm"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900"
              }`}
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      <FilterBar
        brands={brands}
        brand={brand}
        onBrandChange={setBrand}
        bounds={bounds}
        price={price}
        onPriceChange={setPrice}
        lens={lens}
        lenses={LENSES}
        onLensChange={(next) => setLens(next ?? "all")}
        resultLabel={`${total} ${total === 1 ? "result" : "results"}`}
        onReset={reset}
      />

      {total > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {originals.map((result, index) => (
            <OriginalCard key={result.id} result={result} priority={index < 4} />
          ))}
          {clones.map((result) => (
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
  );
}
