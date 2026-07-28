"use client";

import { BrandFilter } from "./BrandFilter";
import type { BrandOption } from "@/lib/filter";

/**
 * Brand filtering only.
 *
 * Price bands used to live here and were dropped: nearly every clone in the
 * catalogue falls under £30, so the bands split the results very unevenly and
 * told you little. Brand is the question people actually arrive with.
 *
 * Sorting deliberately isn't here either - the home page is organised by
 * genre, and reordering the whole directory isn't a thing anyone wants.
 * Sorting lives on the individual pedal page, where it reorders that pedal's
 * clones.
 */
export function FilterBar({
  brands,
  brand,
  onBrandChange,
  resultLabel,
}: {
  brands: BrandOption[];
  brand: string | null;
  onBrandChange: (brand: string | null) => void;
  resultLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <BrandFilter brands={brands} value={brand} onChange={onBrandChange} />

      {resultLabel && (
        <p aria-live="polite" className="tz-eyebrow shrink-0 text-stone-400">
          {resultLabel}
        </p>
      )}
    </div>
  );
}
