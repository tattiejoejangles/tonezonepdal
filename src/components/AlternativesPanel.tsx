"use client";

import { useMemo, useState } from "react";

import { AlternativeCard } from "./AlternativeCard";
import { PedalModal } from "./PedalModal";
import { SORT_OPTIONS, type SortId } from "@/lib/filter";
import type { Alternative, PedalDetail } from "@/lib/types";

export interface AlternativeView {
  alternative: Alternative;
  detail: PedalDetail;
}

/**
 * The clone list on a pedal page: sorting lives here rather than on the home
 * page, because sorting only makes sense within a single pedal's alternatives.
 */
export function AlternativesPanel({
  items,
  originalName,
  originalPrice,
  noun = "pedal",
}: {
  items: AlternativeView[];
  originalName: string;
  originalPrice: number;
  /** "pedal" or "amp" - amps are not pedals and the copy shouldn't say so. */
  noun?: string;
}) {
  const [sort, setSort] = useState<SortId>("price-asc");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...items];
    switch (sort) {
      case "price-desc":
        return copy.sort((a, b) => b.alternative.priceGBP - a.alternative.priceGBP);
      case "popular":
        return copy.sort((a, b) => b.alternative.popularity - a.alternative.popularity);
      case "match":
        return copy.sort(
          (a, b) => b.alternative.matchQuality - a.alternative.matchQuality,
        );
      case "price-asc":
      default:
        return copy.sort((a, b) => a.alternative.priceGBP - b.alternative.priceGBP);
    }
  }, [items, sort]);

  const open = openSlug
    ? items.find((item) => item.alternative.slug === openSlug)
    : undefined;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="tz-heading text-2xl text-stone-900">Cheaper alternatives</h2>
          <p className="tz-body mt-1 text-sm text-stone-500">
            {items.length === 1
              ? `One budget ${noun} that gets you close to the ${originalName}.`
              : `${items.length} budget ${noun}s that get you close to the ${originalName}.`}
          </p>
        </div>

        {items.length > 1 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="alt-sort"
              className="tz-eyebrow whitespace-nowrap text-stone-400"
            >
              Sort
            </label>
            <select
              id="alt-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortId)}
              className="border-0 bg-white py-2 pr-8 pl-3 text-sm font-bold text-stone-800 shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {sorted.map((item, index) => (
          <AlternativeCard
            key={item.alternative.id}
            alternative={item.alternative}
            originalPrice={originalPrice}
            originalName={originalName}
            rank={index + 1}
            onOpen={() => setOpenSlug(item.alternative.slug)}
          />
        ))}
      </div>

      {open && (
        <PedalModal
          alternative={open.alternative}
          detail={open.detail}
          originalName={originalName}
          originalPrice={originalPrice}
          href={`/clone/${open.alternative.slug}`}
          onClose={() => setOpenSlug(null)}
        />
      )}
    </>
  );
}
