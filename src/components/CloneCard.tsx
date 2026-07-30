import Link from "next/link";

import { MatchTag } from "./MatchBadge";
import { PedalImage } from "./PedalImage";
import { formatPrice } from "@/lib/format";
import { displayMatch } from "@/lib/reviews";
import type { CloneResult } from "@/lib/filter";

/**
 * A budget alternative in a listing.
 *
 * Deliberately the plain one. It used to carry an amber ring and the same
 * gradient rule as an original, which made the cheap copy look every bit as
 * special as the thing it copies - so in a mixed grid the two were
 * indistinguishable at a glance.
 *
 * Now it is flat white with a hairline grey edge: no tint, no rule, no sheen.
 * That absence is the point. It still lifts on hover, because being the plain
 * option shouldn't mean feeling broken.
 */
export function CloneCard({
  result,
  onOpen,
}: {
  result: CloneResult;
  /** When given, the card opens a preview instead of navigating. */
  onOpen?: () => void;
}) {
  const { alternative, original, saving } = result;

  const shell =
    "tz-chamfer group relative flex flex-col overflow-hidden bg-white text-left ring-1 ring-stone-200 transition-all duration-300 hover:-translate-y-1 hover:ring-stone-300 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none";

  const body = (
    <>
      <div className="tz-well relative aspect-4/3 rounded-none">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <PedalImage
            src={alternative.imageUrl}
            name={alternative.name}
            brand={alternative.brand}
          />
        </div>

        {/* Ribbon rather than a floating pill: it's a label printed on the
            photo, not a control. */}
        <span className="tz-ribbon tz-ribbon--green top-[14%]">Budget</span>

        {saving.percent > 0 && (
          <span className="absolute right-0 bottom-0 rounded-tl-lg bg-linear-to-r from-emerald-700 to-emerald-600 px-3 py-1.5 text-sm font-bold text-white tabular-nums">
            −{saving.percent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="-mt-1">
          <MatchTag match={displayMatch(alternative)} />
        </div>

        <div>
          <p className="tz-brand text-stone-500">{alternative.brand}</p>
          <h3 className="tz-heading mt-0.5 text-base text-stone-800">
            {alternative.name}
          </h3>
          <p className="tz-body mt-1.5 line-clamp-2 text-sm text-stone-500">
            {alternative.blurb}
          </p>
        </div>

        <div className="mt-auto space-y-2 border-t border-stone-100 pt-3">
          <p className="line-clamp-1 text-[11px] text-stone-500">
            Alternative to <span className="font-bold">{original.name}</span>
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-stone-400 line-through tabular-nums">
              {formatPrice(original.priceGBP)}
            </span>
            <span className="tz-heading text-xl text-stone-800 tabular-nums">
              {formatPrice(alternative.priceGBP)}
            </span>
          </div>
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
        aria-label={`Quick look at the ${alternative.name}`}
        className={`${shell} w-full cursor-pointer`}
      >
        {body}
      </button>
    );
  }

  return (
    <Link href={`/clone/${alternative.slug}`} className={shell}>
      {body}
    </Link>
  );
}
