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
  const active = value.min !== null || value.max !== null;

  /**
   * The track is logarithmic, not linear.
   *
   * The catalogue runs from about £15 to four figures, but the overwhelming
   * majority of it sits under £100 - so on a linear track every clone in the
   * database was crammed into the first few percent of travel and the handle
   * jumped in £40 steps through the range people actually shop in. On a log
   * scale each equal slice of the track is an equal *proportion* of price, so
   * £20-£40 gets as much room as £400-£800.
   *
   * The inputs themselves run 0-1000 positions and are converted at the edges;
   * everything outside this component still speaks in pounds.
   */
  const STEPS = 1000;
  const lo = Math.log(Math.max(1, bounds.min));
  const hi = Math.log(Math.max(2, bounds.max));

  const toPos = (price: number) =>
    Math.round(((Math.log(Math.max(1, price)) - lo) / (hi - lo)) * STEPS);

  const toPrice = (pos: number) => {
    const raw = Math.exp(lo + (pos / STEPS) * (hi - lo));
    // Round to something a person would type: £5 below £100, £10 below £500,
    // £25 above that.
    const grain = raw < 100 ? 5 : raw < 500 ? 10 : 25;
    return Math.min(bounds.max, Math.max(bounds.min, Math.round(raw / grain) * grain));
  };

  const pct = (price: number) => (toPos(price) / STEPS) * 100;

  function setLow(pos: number) {
    onChange({ min: Math.min(toPrice(pos), high), max: value.max });
  }

  function setHigh(pos: number) {
    onChange({ min: value.min, max: Math.max(toPrice(pos), low) });
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

          {/* aria-valuetext, because the raw value is a position on a log
              curve and "437" would be a lie to anyone listening. */}
          <input
            id={`${id}-min`}
            type="range"
            min={0}
            max={STEPS}
            step={1}
            value={toPos(low)}
            onChange={(event) => setLow(Number(event.target.value))}
            aria-label="Minimum price"
            aria-valuetext={formatPrice(low)}
            className="tz-range absolute inset-0 w-full"
          />
          <input
            id={`${id}-max`}
            type="range"
            min={0}
            max={STEPS}
            step={1}
            value={toPos(high)}
            onChange={(event) => setHigh(Number(event.target.value))}
            aria-label="Maximum price"
            aria-valuetext={formatPrice(high)}
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
