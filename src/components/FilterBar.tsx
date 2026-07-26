"use client";

import { PRICE_FILTERS, type PriceFilterId } from "@/lib/filter";

/**
 * Price filtering only.
 *
 * Sorting deliberately isn't here — the home page is organised by genre, and
 * reordering the whole directory isn't a thing anyone wants. Sorting lives on
 * the individual pedal page, where it reorders that pedal's clones.
 */
export function FilterBar({
  priceFilter,
  onPriceFilterChange,
  resultLabel,
}: {
  priceFilter: PriceFilterId;
  onPriceFilterChange: (value: PriceFilterId) => void;
  resultLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Filter by price"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {PRICE_FILTERS.map((filter) => {
          const active = filter.id === priceFilter;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={active}
              onClick={() => onPriceFilterChange(filter.id)}
              className={`tz-btn px-4 py-2 text-xs tracking-wider whitespace-nowrap uppercase focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                active
                  ? "bg-linear-to-b from-stone-800 to-stone-950 text-white shadow-md"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {resultLabel && (
        <p aria-live="polite" className="tz-eyebrow shrink-0 text-stone-400">
          {resultLabel}
        </p>
      )}
    </div>
  );
}
