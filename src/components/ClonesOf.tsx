"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { MatchBadge } from "./MatchBadge";
import { PedalImage } from "./PedalImage";
import { SpecList } from "./SpecList";
import { calculateSavings, formatPrice } from "@/lib/format";
import { gearNoun } from "@/lib/gear";
import type { ClonedOriginal, PedalDetail } from "@/lib/types";

/** An original in the row, with the detail its popup needs. */
export interface ClonedOriginalView {
  original: ClonedOriginal;
  detail: PedalDetail;
  description: string;
  blurb: string;
}

/**
 * "What this is an alternative to" - a row of the originals a clone copies.
 *
 * A clone can copy more than one thing: a Sub 'N' Up stands in for a POG and
 * for an OC-5. The page used to be able to name exactly one, so the second
 * pairing was invisible.
 *
 * Near-square tiles, deliberately small. They are a row of things to recognise
 * at a glance, not cards to read - the recognisable object is the photo, and a
 * photo the size of a thumbnail is enough for anyone who knows the pedal. Each
 * opens a popup with the price, the specs and a way through to its page, which
 * is the "more info, then go to pedal" path rather than dumping someone
 * straight onto another product page.
 */
export function ClonesOf({
  items,
  clonePrice,
}: {
  items: ClonedOriginalView[];
  /** For the saving shown against each original in its popup. */
  clonePrice: number;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((item) => item.original.id === openId);

  if (items.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-3">
        <h2 className="tz-heading text-xl text-stone-900">
          {items.length === 1
            ? "What it's an alternative to"
            : `An alternative to ${items.length} originals`}
        </h2>
        <p className="tz-body mt-1 text-sm text-stone-500">
          Tap any of them for the detail, and a way through to its page.
        </p>
      </div>

      {/* auto-fill rather than a fixed column count: two of these should not
          stretch to half the page each. */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,9.5rem))] gap-3">
        {items.map(({ original }) => (
          <li key={original.id}>
            <button
              type="button"
              onClick={() => setOpenId(original.id)}
              aria-haspopup="dialog"
              className="group block w-full overflow-hidden rounded border border-stone-200 bg-white text-left transition-colors hover:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              <div className="tz-well relative aspect-square rounded-none">
                <PedalImage
                  src={original.imageUrl}
                  name={original.name}
                  brand={original.brand}
                  sizes="152px"
                />
                {original.primary && (
                  <span className="absolute top-1.5 left-1.5 rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                    Main
                  </span>
                )}
              </div>

              <div className="border-t border-stone-100 p-2.5">
                <p className="truncate text-[11px] font-medium text-stone-500">
                  {original.brand}
                </p>
                <p className="tz-heading truncate text-xs text-stone-900 group-hover:text-amber-800">
                  {original.name}
                </p>
                <p className="mt-1 text-xs font-bold text-stone-900 tabular-nums">
                  {formatPrice(original.priceGBP)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <OriginalDialog
          view={open}
          clonePrice={clonePrice}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}

function OriginalDialog({
  view,
  clonePrice,
  onClose,
}: {
  view: ClonedOriginalView;
  clonePrice: number;
  onClose: () => void;
}) {
  const { original, detail, description, blurb } = view;
  const titleId = useId();
  const saving = calculateSavings(original.priceGBP, clonePrice);
  const noun = gearNoun(original.category);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="tz-fade fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="tz-pop relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-lg"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded bg-stone-900/85 text-white transition hover:bg-stone-900"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="grid gap-0 sm:grid-cols-[minmax(0,240px)_1fr]">
          <div className="bg-white p-5">
            <div className="tz-well relative aspect-square w-full">
              <PedalImage
                src={original.imageUrl}
                name={original.name}
                brand={original.brand}
                eager
                sizes="(max-width: 640px) 90vw, 240px"
              />
              <span className="tz-ribbon tz-ribbon--dark top-[8%]">Original</span>
            </div>
          </div>

          <div className="flex flex-col p-5 sm:p-6">
            <p className="tz-brand text-amber-700">{original.brand}</p>
            <h2 id={titleId} className="tz-heading mt-1 text-2xl text-stone-900">
              {original.name}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="tz-heading text-2xl text-stone-900 tabular-nums">
                {formatPrice(original.priceGBP)}
              </span>
              <MatchBadge match={original.matchQuality} size="sm" />
            </div>

            {saving.amount > 0 && (
              <p className="tz-body mt-2 text-sm text-stone-600">
                You save{" "}
                <span className="font-bold text-emerald-700 tabular-nums">
                  {formatPrice(saving.amount)}
                </span>{" "}
                going with the budget option.
              </p>
            )}

            <p className="tz-body mt-3 text-sm text-stone-600">
              {description || blurb}
            </p>

            {detail.specsKnown && (
              <div className="mt-4 border-t border-stone-100 pt-3">
                <p className="tz-eyebrow mb-2 text-stone-400">Specs</p>
                <SpecList specs={detail.specs} size="sm" />
              </div>
            )}

            <div className="mt-5 border-t border-stone-200 pt-4">
              <Link
                href={`/pedal/${original.slug}`}
                onClick={onClose}
                className="tz-btn flex w-full items-center justify-center gap-2 bg-stone-900 px-5 py-3 text-xs tracking-wider text-white uppercase"
              >
                Go to {noun}
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
