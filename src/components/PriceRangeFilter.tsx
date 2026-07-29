"use client";

import { useId } from "react";

import { formatPrice } from "@/lib/format";
import type { PriceRange } from "@/lib/filter";

/**
 * Dual-handle price filter.
 *
 * Two overlaid native `<input type="range">` rather than a custom pointer
 * implementation. Native ranges are keyboard-operable, announce themselves to
 * screen readers and honour the platform's own touch handling for free, none
 * of which comes cheap when you rebuild a slider out of divs and pointer
 * events. The cost is that they overlap, which is handled by making the tracks
 * transparent and painting one shared track underneath - and by giving each
 * input `pointer-events: none` with only its thumb re-enabled, so a click near
 * the middle always lands on the handle you meant rather than on whichever
 * input happens to be on top.
 *
 * The two handles are allowed to meet but not cross: each clamps against the
 * other, so dragging the low handle past the high one just parks them together
 * instead of inverting the range.
 */
export function PriceRangeFilter({
  bounds,
  value,
  onChange,
}: {
  /** The catalogue's real cheapest and dearest, from `priceBounds`. */
  bounds: { min: number; max: number };
  value: PriceRange;
  onChange: (next: PriceRange) => void;
}) {
  const id = useId();

  const low = value.min ?? bounds.min;
  const high = value.max ?? bounds.max;
  const span = Math.max(1, bounds.max - bounds.min);

  const pct = (n: number) => ((n - bounds.min) / span) * 100;
  const active = value.min !== null || value.max !== null;

  // Step in tens once the catalogue spans a few hundred pounds - single-pound
  // precision on a £2,000 range is 2,000 keypresses from end to end.
  const step = span > 400 ? 10 : 5;

  function setLow(next: number) {
    onChange({ min: Math.min(next, high), max: value.max });
  }

  function setHigh(next: number) {
    onChange({ min: value.min, max: Math.max(next, low) });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[13rem] flex-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="tz-eyebrow text-stone-400">Price</span>
          <span className="text-xs font-bold text-stone-700 tabular-nums">
            {formatPrice(low)} – {formatPrice(high)}
            {high >= bounds.max && value.max === null ? "+" : ""}
          </span>
        </div>

        <div className="relative h-5">
          {/* Track */}
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-stone-200" />
          {/* Selected span */}
          <span
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-linear-to-r from-amber-500 to-orange-600"
            style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
          />

          <input
            id={`${id}-min`}
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={step}
            value={low}
            onChange={(event) => setLow(Number(event.target.value))}
            aria-label="Minimum price"
            className="tz-range absolute inset-0 w-full"
          />
          <input
            id={`${id}-max`}
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={step}
            value={high}
            onChange={(event) => setHigh(Number(event.target.value))}
            aria-label="Maximum price"
            className="tz-range absolute inset-0 w-full"
          />
        </div>
      </div>

      {active && (
        <button
          type="button"
          onClick={() => onChange({ min: null, max: null })}
          className="shrink-0 text-[11px] font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-stone-900"
        >
          Clear
        </button>
      )}
    </div>
  );
}
