"use client";

import { BrandFilter } from "./BrandFilter";
import { PriceRangeFilter } from "./PriceRangeFilter";
import type { BrandOption, PriceRange } from "@/lib/filter";

/**
 * The directory's controls: what to show, from whom, and for how much.
 *
 * The lens buttons double as the browse-all entry point. There is no separate
 * "see everything" link because pressing "Everything" already is one - the
 * directory switches out of its curated home layout the moment any control
 * here is touched.
 *
 * Price used to be fixed bands and was dropped for splitting the catalogue
 * very unevenly. A range the user sets themselves doesn't have that problem:
 * it's their band, not ours, and the track is built from the real cheapest and
 * dearest in the catalogue.
 */
export function FilterBar<L extends string>({
  brands,
  brand,
  onBrandChange,
  bounds,
  price,
  onPriceChange,
  lens,
  lenses,
  onLensChange,
  resultLabel,
  onReset,
}: {
  brands: BrandOption[];
  brand: string | null;
  onBrandChange: (brand: string | null) => void;
  bounds: { min: number; max: number };
  price: PriceRange;
  onPriceChange: (next: PriceRange) => void;
  /** Null until the user picks one, which is what keeps the home page curated. */
  lens: L | null;
  lenses: { id: L; label: string }[];
  onLensChange: (lens: L | null) => void;
  resultLabel?: string;
  onReset?: () => void;
}) {
  const activeLens = lens ?? lenses[0]?.id;

  return (
    <div className="tz-chamfer flex flex-col gap-4 bg-white/70 p-4 ring-1 ring-stone-200/70 backdrop-blur-sm lg:flex-row lg:items-center lg:gap-6">
      {/* Segmented control. One group, one selection - radios rather than
          buttons so arrow keys move between them the way they should. */}
      <div
        role="radiogroup"
        aria-label="What to show"
        className="flex shrink-0 items-center gap-1 rounded-full bg-stone-100 p-1"
      >
        {lenses.map((option) => {
          const selected = option.id === activeLens;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onLensChange(option.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                selected
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <BrandFilter brands={brands} value={brand} onChange={onBrandChange} />

      <PriceRangeFilter bounds={bounds} value={price} onChange={onPriceChange} />

      <div className="flex items-center gap-4 lg:ml-auto">
        {resultLabel && (
          <p aria-live="polite" className="tz-eyebrow shrink-0 text-stone-400">
            {resultLabel}
          </p>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 text-[11px] font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-stone-900"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
