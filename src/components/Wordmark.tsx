import Link from "next/link";

import { TzMark } from "./Logo";

/**
 * "The Tone Zone" lockup.
 *
 * The mark is the soundwave-through-a-pound-sign from Logo.tsx: the site is
 * about what a sound costs, and that is the one thing a stompbox footswitch
 * couldn't say. The tile keeps it legible against the pale, gradient-washed
 * header background - a monoline mark sitting loose on that would disappear.
 *
 * The three words are stacked in weight rather than size, so the lockup stays
 * one clean horizontal block at any width.
 */
export function Wordmark() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label="The Tone Zone - home"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-stone-800 via-stone-900 to-black text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
        {/* The wave picks up the accent; it shifts to the "signal found" green
            on hover, which is what the old footswitch LED used to do. */}
        <TzMark
          className="h-7 w-7"
          waveClassName="text-amber-400 transition-colors duration-300 group-hover:text-emerald-400"
        />
      </span>

      <span className="leading-none">
        <span className="block text-[10px] font-medium tracking-[0.34em] text-stone-400 uppercase">
          The
        </span>
        <span className="block text-xl font-bold tracking-tight text-stone-900">
          Tone
          <span className="bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Zone
          </span>
        </span>
      </span>
    </Link>
  );
}
