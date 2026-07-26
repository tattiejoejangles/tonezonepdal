import Link from "next/link";

import { PedalImage } from "./PedalImage";
import { RetailerButtons } from "./RetailerButtons";
import { formatPrice } from "@/lib/format";
import type { DailyFind } from "@/lib/sections";

/**
 * The daily bargain: the pedal pairing with one of the biggest price gaps in
 * the catalogue, rotating each day so the page has a reason to be revisited.
 */
export function FindOfDayCard({ find }: { find: DailyFind }) {
  const { original, alternative, saving } = find;

  return (
    <section aria-labelledby="find-of-day">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center bg-linear-to-br from-amber-400 to-orange-600">
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
            Today&apos;s biggest gap between an original and its clone.
          </p>
        </div>
      </div>

      <div className="tz-chamfer relative overflow-hidden bg-linear-to-br from-stone-900 via-[#141b2e] to-stone-800 text-white shadow-xl">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

        {/* Three columns on desktop: photo, the pitch, then the buy stack in a
            lane of its own. Collapses to one column on narrow screens. */}
        <div className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[240px_1fr_minmax(0,17rem)] lg:items-center">
          <div className="relative aspect-square w-full max-w-[240px] bg-white">
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
              <p className="tz-body mt-2.5 text-sm text-stone-300">{alternative.blurb}</p>
            </div>

            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.18em] text-stone-400 uppercase">
                  You pay
                </p>
                <p className="text-5xl font-bold tracking-tight text-white">
                  {formatPrice(alternative.priceGBP)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.18em] text-stone-400 uppercase">
                  Instead of
                </p>
                <p className="text-2xl font-bold text-stone-500 line-through">
                  {formatPrice(original.priceGBP)}
                </p>
                <Link
                  href={`/pedal/${original.slug}`}
                  className="tz-body text-sm text-stone-300 underline decoration-amber-500 decoration-2 underline-offset-4 hover:text-amber-300"
                >
                  {original.name}
                </Link>
              </div>
            </div>

            <p className="inline-flex w-fit items-baseline gap-2 bg-linear-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-base font-bold text-white">
              <span>
                Save {formatPrice(saving.amount)} · {saving.percent}%
              </span>
              <span className="text-sm font-medium text-emerald-50/90">
                vs the {original.name}
              </span>
            </p>

          </div>

          <div className="lg:self-center">
            <RetailerButtons pedal={alternative} size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
