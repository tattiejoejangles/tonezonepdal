"use client";

import { useState } from "react";

import { PedalImage } from "./PedalImage";
import { PedalModal } from "./PedalModal";
import { SavingsBadge } from "./SavingsBadge";
import { calculateSavings, formatPrice } from "@/lib/format";
import type { Alternative, PedalDetail } from "@/lib/types";

/**
 * The "cheapest alternative" panel in an original's hero.
 *
 * It's the first concrete answer the page gives, so it now shows the pedal
 * rather than only naming it, and opens the same detail modal the clone list
 * uses - reached from the top of the page instead of after a scroll.
 *
 * The trigger is a button stretched across the panel rather than a button
 * wrapping it: a photo and a savings badge aren't phrasing content, so they
 * can't legally live inside one. Same pattern as AlternativeCard.
 */
export function CheapestAlternative({
  alternative,
  detail,
  originalName,
  originalPrice,
  noun = "pedal",
}: {
  alternative: Alternative;
  detail: PedalDetail;
  originalName: string;
  originalPrice: number;
  /** "pedal" / "amp" / "cab", for the dialog's footer button. */
  noun?: string;
}) {
  const [open, setOpen] = useState(false);
  const saving = calculateSavings(originalPrice, alternative.priceGBP);

  return (
    <>
      <div className="group relative border-l-2 border-emerald-500 bg-emerald-50/70 transition-colors hover:bg-emerald-100/70">
        {/* Label is the name alone - most already lead with the brand. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`More about the ${alternative.name}`}
          className="absolute inset-0 z-10 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
        />

        <div className="flex items-center gap-4 p-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-white ring-1 ring-emerald-200">
            <PedalImage
              src={alternative.imageUrl}
              name={alternative.name}
              brand={alternative.brand}
              sizes="80px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-emerald-900">
              Cheapest alternative:{" "}
              <span className="font-bold">{alternative.name}</span> at{" "}
              <span className="font-bold">{formatPrice(alternative.priceGBP)}</span>
            </p>

            <div className="mt-2.5">
              <SavingsBadge saving={saving} comparedTo={originalName} size="lg" />
            </div>

            <p className="mt-2.5 flex items-center gap-1 text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
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
            </p>
          </div>
        </div>
      </div>

      {open && (
        <PedalModal
          alternative={alternative}
          detail={detail}
          originalName={originalName}
          originalPrice={originalPrice}
          href={`/clone/${alternative.slug}`}
          noun={noun}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
