import Link from "next/link";

import { PedalImage } from "./PedalImage";
import { formatPrice } from "@/lib/format";
import { gearNoun } from "@/lib/gear";
import type { DirectoryResult } from "@/lib/filter";

/**
 * An original in a listing - the expensive, sought-after thing.
 *
 * Deliberately the richer of the two cards. An original carries a warm surface,
 * an amber edge and a solid rule along the top; CloneCard is left plain white.
 * The clone is not styled *differently*, it is styled *less* - that's what
 * makes the pair read as a hierarchy rather than as two colour schemes.
 */
export function OriginalCard({
  result,
  priority = false,
  onOpen,
}: {
  result: DirectoryResult;
  priority?: boolean;
  /**
   * When given, the card opens a preview instead of navigating. The browse
   * listings use this - losing your scroll position and your filters to read
   * two lines of blurb is a bad trade. Genre bands still link straight
   * through, where you arrived having already chosen a category.
   */
  onOpen?: () => void;
}) {
  const { cheapest, bestSaving, alternatives } = result;
  const noun = gearNoun(result.category, alternatives.length);

  const shell =
    "tz-chamfer tz-legend tz-legend-edge group relative flex flex-col overflow-hidden text-left transition-all duration-300  focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none";

  /* The card's insides, rendered into either a button or a link below. Held in
     a variable rather than a little wrapper component, because defining a
     component during render remounts the whole subtree on every parent
     render. */
  const body = (
    <>
      {/* Always lit, not hover-only: this is the mark of an original. */}
      <span className="absolute inset-x-0 top-0 z-10 h-1 bg-amber-500" />

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

        <span className="tz-ribbon tz-ribbon--dark top-[14%]">Original</span>

        {bestSaving && bestSaving.percent > 0 && (
          <span className="absolute right-0 bottom-0 rounded-tl-lg bg-emerald-700 px-3 py-1.5 text-sm font-bold text-white tabular-nums">
            −{bestSaving.percent}%
          </span>
        )}
      </div>

      <div className="relative z-[2] flex flex-1 flex-col gap-3 p-5">
        {/* No tonal match here. An original is the reference - it has nothing
            to be matched against - and the tag that used to sit here showed
            its cheapest clone's score, which read as a rating of the original
            itself. Match belongs on a clone, where it means something: the
            clone cards, the alternatives panel and the compare table. */}
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
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`Quick look at the ${result.name}`}
        className={`${shell} w-full cursor-pointer`}
      >
        {body}
      </button>
    );
  }

  return (
    <Link href={`/pedal/${result.slug}`} className={shell}>
      {body}
    </Link>
  );
}
