"use client";

import Link from "next/link";
import { useState } from "react";

import { PedalImage } from "./PedalImage";
import { PedalModal } from "./PedalModal";
import { RetailerButtons } from "./RetailerButtons";
import { formatPrice } from "@/lib/format";
import { gearNoun } from "@/lib/gear";
import type { DailyFind } from "@/lib/sections";
import type { PedalDetail } from "@/lib/types";

/**
 * The daily bargain: the pedal pairing with one of the biggest price gaps in
 * the catalogue, rotating each day so the page has a reason to be revisited.
 *
 * The whole card opens the detail dialog, which is what people were already
 * trying to do to it. That's done with a button stretched across the card
 * rather than a button wrapped around it - a card containing a photo, a link
 * to the original and three retailer links cannot legally live inside a
 * <button>, and nesting them would break the keyboard order as well as the
 * HTML. Same pattern as AlternativeCard and CheapestAlternative.
 *
 * The overlay sits at z-0 and everything that was already interactive is
 * lifted to z-10, so the genuine links keep their own hit areas and the
 * overlay picks up every other pixel. `detail` is resolved on the server and
 * handed down so opening the dialog costs no round trip.
 */
export function FindOfDayCard({
  find,
  detail,
}: {
  find: DailyFind;
  detail: PedalDetail;
}) {
  const [open, setOpen] = useState(false);
  const { original, alternative, saving } = find;
  // A clone has no category of its own - it is whatever it copies. The pick
  // rotates over the whole catalogue, so this is regularly an amp.
  const noun = gearNoun(original.category);

  return (
    <section aria-labelledby="find-of-day">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-600">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-5 w-5 text-white"
            fill="currentColor"
          >
            <path d="M13 2 4.5 13.2a.6.6 0 0 0 .48.96H10l-1 7.84 8.5-11.2a.6.6 0 0 0-.48-.96H12l1-7.84Z" />
          </svg>
        </span>
        <div>
          <h2 id="find-of-day" className="text-xl font-bold text-stone-900">
            Find of the Day
          </h2>
          <p className="tz-body text-xs text-stone-500">
            Today&apos;s biggest gap between an original {noun} and its clone.
          </p>
        </div>
      </div>

      <div className="group tz-chamfer relative isolate overflow-hidden bg-linear-to-br from-stone-900 via-[#141b2e] to-stone-800 text-white shadow-xl transition-shadow hover:shadow-2xl">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

        {/* Three columns on desktop: photo, the pitch, then the buy stack in a
            lane of its own. Collapses to one column on narrow screens. */}
        <div className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[240px_1fr_minmax(0,17rem)] lg:items-center">
          <div className="relative aspect-square w-full max-w-[240px] rounded-xl bg-white">
            <PedalImage
              src={alternative.imageUrl}
              name={alternative.name}
              brand={alternative.brand}
              sizes="240px"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-amber-400 uppercase">
                {alternative.brand}
              </p>
              <h3 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">
                {alternative.name}
              </h3>
              <p className="tz-body mt-2.5 max-w-prose text-sm text-stone-300">
                {alternative.blurb}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.18em] text-stone-400 uppercase">
                  You pay
                </p>
                <p className="text-5xl font-bold tracking-tight text-white tabular-nums">
                  {formatPrice(alternative.priceGBP)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.18em] text-stone-400 uppercase">
                  Instead of
                </p>
                <p className="text-2xl font-bold text-stone-500 line-through tabular-nums">
                  {formatPrice(original.priceGBP)}
                </p>
                <Link
                  href={`/pedal/${original.slug}`}
                  className="tz-body relative z-20 text-sm text-stone-300 underline decoration-amber-500 decoration-2 underline-offset-4 hover:text-amber-300"
                >
                  {original.name}
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex w-fit items-baseline gap-2 rounded-full bg-linear-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-base font-bold text-white">
                <span className="tabular-nums">
                  Save {formatPrice(saving.amount)} · {saving.percent}%
                </span>
                <span className="text-sm font-medium text-emerald-50/90">
                  vs the {original.name}
                </span>
              </p>

              {/* Names the card's own action, so the affordance is visible and
                  not just implied by the cursor. */}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider text-stone-400 uppercase transition-colors group-hover:text-amber-300">
                More info
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
            </div>
          </div>

          <div className="relative z-20 lg:self-center">
            <RetailerButtons pedal={alternative} size="lg" />
          </div>
        </div>

        {/* Last in the DOM and above the content at z-10, so it collects every
            click the card's own links (lifted to z-20) don't. Rendered after
            the content rather than before it so it also comes last in the tab
            order, where "more info about the thing you just read" belongs. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`More about the ${alternative.name}`}
          className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset focus-visible:outline-none"
        />
      </div>

      {open && (
        <PedalModal
          alternative={alternative}
          detail={detail}
          originalName={original.name}
          originalPrice={original.priceGBP}
          href={`/clone/${alternative.slug}`}
          noun={noun}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
