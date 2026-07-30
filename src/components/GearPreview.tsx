"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { MatchBadge } from "./MatchBadge";
import { PedalImage } from "./PedalImage";
import { RetailerButtons } from "./RetailerButtons";
import { SavingsBadge } from "./SavingsBadge";
import { calculateSavings, formatPrice } from "@/lib/format";

export interface PreviewItem {
  kind: "original" | "clone";
  href: string;
  name: string;
  brand: string;
  blurb: string;
  imageUrl: string | null;
  priceGBP: number;
  searchQuery?: string;
  /** Clones: the original it copies, for savings and context. */
  comparedTo?: { name: string; priceGBP: number };
  /** Clones: how close it gets. */
  matchQuality?: number;
  /** Originals: the cheapest way in. */
  cheapest?: { name: string; priceGBP: number } | null;
  /** Originals: how many alternatives exist, and what to call them (plural). */
  alternativeCount?: number;
  noun?: string;
  /**
   * Singular noun for the thing itself - "pedal", "amp", "cab".
   *
   * Separate from `noun` above, which is pluralised for the alternatives count.
   * Drives the footer button, which used to say "Go to pedal" for every clone
   * including the amps.
   */
  itemNoun?: string;
}

/**
 * Quick look at one item from a browse listing.
 *
 * The browse grids used to navigate straight to a page, which is a heavy move
 * when you are scanning a hundred cards - you lose your place in the grid and
 * your filters to read two lines of blurb. This shows the two lines, the price
 * and where to buy, and offers the page as a deliberate next step.
 *
 * Simpler than PedalModal on purpose: that one has tabbed specs and artists
 * and belongs on a pedal's own page, where someone has already committed to
 * reading about one thing.
 */
export function GearPreview({
  item,
  onClose,
}: {
  item: PreviewItem;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (typeof document === "undefined") return null;

  const saving = item.comparedTo
    ? calculateSavings(item.comparedTo.priceGBP, item.priceGBP)
    : item.cheapest
      ? calculateSavings(item.priceGBP, item.cheapest.priceGBP)
      : null;

  return createPortal(
    <div
      className="tz-fade fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="tz-pop relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain bg-white shadow-2xl outline-none sm:max-h-[88dvh] sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900/85 text-white transition hover:rotate-90 hover:bg-stone-900"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="grid gap-0 sm:grid-cols-[minmax(0,240px)_1fr]">
          <div className="relative bg-white p-5">
            <div className="tz-well relative aspect-square w-full">
              <PedalImage
                src={item.imageUrl}
                name={item.name}
                brand={item.brand}
                eager
                sizes="(max-width: 640px) 90vw, 240px"
              />
            </div>
            <span
              className={`tz-ribbon top-[8%] ${
                item.kind === "clone" ? "tz-ribbon--green" : "tz-ribbon--dark"
              }`}
            >
              {item.kind === "clone" ? "Budget" : "Original"}
            </span>
          </div>

          <div className="flex flex-col p-5 sm:p-6">
            <p className="tz-brand text-amber-700">{item.brand}</p>
            <h2 id={titleId} className="tz-heading mt-1 text-2xl text-stone-900">
              {item.name}
            </h2>
            <p className="tz-body mt-2 text-sm text-stone-600">{item.blurb}</p>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
              <span className="tz-heading text-3xl text-stone-900 tabular-nums">
                {formatPrice(item.priceGBP)}
              </span>
              <span className="text-xs text-stone-400">approx. UK price</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.matchQuality !== undefined && (
                <MatchBadge match={item.matchQuality} />
              )}
              {saving && saving.percent > 0 && item.comparedTo && (
                <SavingsBadge saving={saving} comparedTo={item.comparedTo.name} />
              )}
            </div>

            {/* Originals: the reason to click through is the cheap option. */}
            {item.kind === "original" && item.cheapest && saving && (
              <p className="tz-chamfer mt-4 border-l-2 border-emerald-500 bg-emerald-50/70 p-3 text-sm text-emerald-900">
                Cheapest alternative:{" "}
                <span className="font-bold">{item.cheapest.name}</span> at{" "}
                <span className="font-bold tabular-nums">
                  {formatPrice(item.cheapest.priceGBP)}
                </span>{" "}
                - saving {formatPrice(saving.amount)}.
                {item.alternativeCount && item.alternativeCount > 1 ? (
                  <>
                    {" "}
                    {item.alternativeCount} {item.noun ?? "options"} in total.
                  </>
                ) : null}
              </p>
            )}

            <div className="mt-5 space-y-3 border-t border-stone-200 pt-4">
              <Link
                href={item.href}
                onClick={onClose}
                className="tz-btn flex w-full items-center justify-center gap-2 bg-linear-to-b from-stone-800 to-stone-950 px-5 py-3 text-xs tracking-wider text-white uppercase"
              >
                Go to {item.kind === "clone" ? (item.itemNoun ?? "pedal") : "page"}
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>

              <RetailerButtons pedal={item} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
