import Link from "next/link";

import { PedalImage } from "./PedalImage";
import { formatPrice } from "@/lib/format";
import type { CloneResult } from "@/lib/filter";

/**
 * A clone in search results.
 *
 * Visually distinct from an original's card — amber accent and a "BUDGET
 * CLONE" tag — so it's obvious at a glance which results are the expensive
 * pedal and which are the cheap alternative to it.
 */
export function CloneCard({ result }: { result: CloneResult }) {
  const { alternative, original, saving } = result;

  return (
    <Link
      href={`/clone/${alternative.slug}`}
      className="tz-chamfer group relative flex flex-col overflow-hidden bg-white shadow-sm ring-1 ring-amber-300/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:ring-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
    >
      <span className="absolute inset-x-0 top-0 z-10 h-1 bg-linear-to-r from-amber-400 via-orange-500 to-rose-500" />

      <div className="relative aspect-4/3 overflow-hidden bg-white">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-108">
          <PedalImage
            src={alternative.imageUrl}
            name={alternative.name}
            brand={alternative.brand}
          />
        </div>

        <span className="tz-eyebrow absolute top-3 left-3 bg-amber-400 px-2.5 py-1 text-stone-900 shadow-sm">
          Budget clone
        </span>

        {saving.percent > 0 && (
          <span className="absolute right-0 bottom-0 bg-linear-to-r from-emerald-600 to-emerald-500 px-3 py-1.5 text-sm font-bold text-white">
            −{saving.percent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="tz-eyebrow text-amber-700">{alternative.brand}</p>
          <h3 className="tz-heading mt-1 text-base text-stone-900 group-hover:text-amber-700">
            {alternative.name}
          </h3>
          <p className="tz-body mt-1.5 line-clamp-2 text-sm text-stone-500">
            {alternative.blurb}
          </p>
        </div>

        <div className="mt-auto space-y-2 border-t border-stone-100 pt-3">
          <p className="text-[11px] text-stone-500">
            Alternative to <span className="font-bold">{original.name}</span>
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-stone-400 line-through">
              {formatPrice(original.priceGBP)}
            </span>
            <span className="tz-heading text-xl text-stone-900">
              {formatPrice(alternative.priceGBP)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
