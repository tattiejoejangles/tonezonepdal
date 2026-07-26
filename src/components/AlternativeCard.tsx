import { PedalImage } from "./PedalImage";
import { ProsCons } from "./ProsCons";
import { RetailerButtons } from "./RetailerButtons";
import { SavingsBadge } from "./SavingsBadge";
import { calculateSavings, formatPrice } from "@/lib/format";
import type { Alternative } from "@/lib/types";

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
    <article className="tz-chamfer group relative bg-white shadow-sm ring-1 ring-stone-200/70 transition-all duration-300 hover:shadow-xl hover:ring-amber-400/60">
      {/* Accent edge that fills in on hover. */}
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-linear-to-r from-amber-400 via-orange-500 to-rose-500 transition-transform duration-300 group-hover:scale-x-100" />

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        <div className="relative h-40 w-full shrink-0 overflow-hidden bg-white sm:h-44 sm:w-40">
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
            <PedalImage
              src={alternative.imageUrl}
              name={alternative.name}
              brand={alternative.brand}
              sizes="(max-width: 640px) 100vw, 160px"
            />
          </div>
          {rank !== undefined && (
            <span className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center bg-stone-900/85 text-xs font-bold text-white">
              {rank}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="tz-eyebrow text-amber-700">{alternative.brand}</p>
              <h3 className="tz-heading mt-1 text-lg text-stone-900">
                {alternative.name}
              </h3>
              <p className="tz-body mt-1.5 text-sm text-stone-500">{alternative.blurb}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="tz-heading text-2xl text-stone-900">
                {formatPrice(alternative.priceGBP)}
              </p>
              <p className="text-[11px] text-stone-400">approx. UK price</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SavingsBadge saving={saving} comparedTo={originalName} />
            <span className="bg-stone-100 px-3 py-1.5 text-[11px] font-bold text-stone-600">
              {alternative.matchQuality}% TONAL MATCH
            </span>
            {onOpen && (
              <button
                type="button"
                onClick={onOpen}
                className="tz-btn ml-auto bg-linear-to-b from-stone-800 to-stone-950 px-3 py-1.5 text-[11px] tracking-wider text-white uppercase"
              >
                More info
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            )}
          </div>

          <ProsCons pros={alternative.pros} cons={alternative.cons} />

          <div className="border-t border-stone-100 pt-4">
            <RetailerButtons pedal={alternative} size="sm" />
          </div>
        </div>
      </div>
    </article>
  );
}
