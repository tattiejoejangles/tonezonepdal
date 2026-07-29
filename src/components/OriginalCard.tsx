import Link from "next/link";

import { PedalImage } from "./PedalImage";
import { formatPrice } from "@/lib/format";
import { gearNoun } from "@/lib/gear";
import type { DirectoryResult } from "@/lib/filter";

/**
 * An original in a listing - the expensive, sought-after thing.
 *
 * Deliberately the richer of the two cards. Originals are the pedals people
 * already revere, so the card carries a warm tint, a gilt edge, a gradient rule
 * and a sheen that crosses it on hover, while CloneCard is left plain white.
 * The clone is not styled *differently*, it is styled *less* - that's what
 * makes the pair read as a hierarchy rather than as two colour schemes.
 */
export function OriginalCard({
  result,
  priority = false,
}: {
  result: DirectoryResult;
  priority?: boolean;
}) {
  const { cheapest, bestSaving, alternatives } = result;
  const noun = gearNoun(result.category, alternatives.length);

  return (
    <Link
      href={`/pedal/${result.slug}`}
      className="tz-chamfer tz-legend tz-legend-edge group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
    >
      {/* Always lit, not hover-only: this is the mark of an original. */}
      <span className="absolute inset-x-0 top-0 z-10 h-1 bg-linear-to-r from-amber-400 via-orange-500 to-rose-500" />

      {/* Plain white behind the photo - the warm tint is carried by the card
          body instead, so the pedal itself sits on the same white it was shot
          on and reads as cut out. */}
      <div className="relative aspect-4/3 overflow-hidden bg-white">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-108">
          <PedalImage
            src={result.imageUrl}
            name={result.name}
            brand={result.brand}
            priority={priority}
          />
        </div>

        <span className="tz-eyebrow absolute top-3 left-3 rounded-full bg-stone-900/90 px-2.5 py-1 text-amber-300 shadow-sm backdrop-blur-sm">
          Original
        </span>

        {bestSaving && bestSaving.percent > 0 && (
          <span className="absolute right-0 bottom-0 bg-linear-to-r from-emerald-600 to-emerald-500 px-3 py-1.5 text-sm font-bold text-white tabular-nums">
            −{bestSaving.percent}%
          </span>
        )}
      </div>

      <div className="relative z-[2] flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="tz-brand text-amber-700">{result.brand}</p>
          <h3 className="tz-heading mt-0.5 text-base text-stone-900 transition-colors group-hover:text-amber-800">
            {result.name}
          </h3>
          <p className="tz-body mt-1.5 line-clamp-2 text-sm text-stone-500">
            {result.blurb}
          </p>
        </div>

        <div className="mt-auto space-y-2 border-t border-amber-900/10 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-medium text-stone-400">Original</span>
            <span className="text-sm font-bold text-stone-400 line-through tabular-nums">
              {formatPrice(result.priceGBP)}
            </span>
          </div>

          {cheapest && (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-medium text-stone-500">
                {alternatives.length} budget {noun} from
              </span>
              <span className="tz-heading text-xl text-stone-900 tabular-nums">
                {formatPrice(cheapest.priceGBP)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
