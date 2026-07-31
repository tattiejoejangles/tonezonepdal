import Link from "next/link";

import { MatchBadge } from "./MatchBadge";
import { PedalImage } from "./PedalImage";
import { ProsCons } from "./ProsCons";
import { RetailerButtons } from "./RetailerButtons";
import { SavingsBadge } from "./SavingsBadge";
import { calculateSavings, formatPrice } from "@/lib/format";
import { displayMatch } from "@/lib/reviews";
import type { Alternative } from "@/lib/types";

/**
 * A clone on an original's page.
 *
 * The whole card opens that clone's own page, but it also contains a "More
 * info" button and outbound retailer links - and an anchor can't legally wrap
 * either. So navigation is a transparent link stretched across the card, with
 * the genuinely interactive parts lifted above it. Clicking anywhere blank
 * goes to the pedal; clicking a control does what that control has always
 * done.
 */
export function AlternativeCard({
  alternative,
  originalPrice,
  originalName,
  rank,
  onOpen,
}: {
  alternative: Alternative;
  originalPrice: number;
  originalName: string;
  rank?: number;
  onOpen?: () => void;
}) {
  const saving = calculateSavings(originalPrice, alternative.priceGBP);

  return (
    <article className="tz-panel tz-card-hover group relative overflow-hidden">
      {/* Accent edge that fills in on hover. */}
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-amber-500 transition-transform duration-300 group-hover:scale-x-100" />

      {/* Stretched link: covers the card, sits under the controls below. */}
      <Link
        href={`/clone/${alternative.slug}`}
        aria-label={`View the ${alternative.name}`}
        className="absolute inset-0 z-10 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      />

      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:gap-6">
        {/* Photo and copy keep their own side-by-side split from sm up; the
            buy lane only peels off once the card is wide enough at lg. */}
        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row">
        <div className="tz-well relative h-40 w-full shrink-0 sm:h-44 sm:w-40">
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
            <PedalImage
              src={alternative.imageUrl}
              name={alternative.name}
              brand={alternative.brand}
              sizes="(max-width: 640px) 100vw, 160px"
            />
          </div>
          {rank !== undefined && (
            <span className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/85 text-xs font-bold text-white">
              {rank}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {/* A grid, not a wrapping flex row.
              `flex-wrap` meant a long blurb pushed the price block onto its own
              line - so the price sat top-right on one card and bottom-left on
              the next, which is exactly the thing the eye uses to compare
              cards. Two grid columns keep the price in the same place on every
              card and let the copy wrap under itself instead. */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">
            <div className="min-w-0">
              <p className="tz-brand text-amber-700">{alternative.brand}</p>
              <h3 className="tz-heading mt-1 text-lg text-stone-900 transition-colors group-hover:text-amber-700">
                {alternative.name}
              </h3>
              <p className="tz-body mt-1.5 text-sm text-stone-500">{alternative.blurb}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="tz-heading text-2xl text-stone-900 tabular-nums">
                {formatPrice(alternative.priceGBP)}
              </p>
              <p className="text-[11px] whitespace-nowrap text-stone-400">
                approx. UK price
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SavingsBadge saving={saving} comparedTo={originalName} />
            <MatchBadge match={displayMatch(alternative)} />
            {onOpen && (
              <button
                type="button"
                onClick={onOpen}
                className="tz-btn relative z-20 ml-auto bg-stone-900 px-3 py-1.5 text-[11px] text-white "
              >
                More info
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            )}
          </div>

          <ProsCons pros={alternative.pros} cons={alternative.cons} />
        </div>
        </div>

        {/* Buy stack in its own lane rather than under the pros and cons,
            which made every card ~170px taller. */}
        <div className="relative z-20 shrink-0 border-t border-stone-100 pt-4 lg:w-52 lg:border-t-0 lg:border-l lg:border-stone-100 lg:pt-0 lg:pl-5">
          <RetailerButtons pedal={alternative} size="sm" />
        </div>
      </div>
    </article>
  );
}
