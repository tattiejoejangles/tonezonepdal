"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { MatchBadge } from "./MatchBadge";
import { PedalImage } from "./PedalImage";
import { formatPrice } from "@/lib/format";

/** One tile in the row. */
export interface SimilarItem {
  slug: string;
  name: string;
  brand: string;
  priceGBP: number;
  imageUrl: string | null;
  /** Clones only - originals show no match. */
  matchQuality?: number;
  blurb: string;
  /** What it is an alternative to, for the popup. */
  comparedTo?: string;
  kind: "original" | "clone";
}

/**
 * "Also similar to…" - other gear worth looking at from here.
 *
 * Replaces a row that listed only the originals this clone copies, which on the
 * great majority of pages was a single tile - a heading, a subheading and one
 * photo of something already named twice further up. The originals it copies
 * are still on the page; they are the cross-sell panel in the hero, where they
 * belong.
 *
 * What is useful at the foot of a clone page is somewhere else to go, so this
 * is now the other pedals in the same corner of the catalogue: siblings that
 * copy the same original first, then anything else in the genre. Picked on the
 * server - see the clone page for the ordering.
 */
export function SimilarPedals({ items }: { items: SimilarItem[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = items.find((item) => item.slug === openSlug);

  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 border-b-2 border-stone-900/10 pb-3">
        <h2 className="tz-heading text-xl text-stone-900">Also similar to…</h2>
        <p className="tz-body mt-1 text-sm text-stone-500">
          Others in the same corner of the catalogue. Tap one for the detail.
        </p>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">
        {items.map((item) => (
          <li key={item.slug}>
            <button
              type="button"
              onClick={() => setOpenSlug(item.slug)}
              aria-haspopup="dialog"
              className="group block w-full overflow-hidden rounded border border-stone-200 bg-white text-left transition-colors hover:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              <div className="tz-well relative aspect-square rounded-none">
                <PedalImage
                  src={item.imageUrl}
                  name={item.name}
                  brand={item.brand}
                  sizes="160px"
                />
                {item.matchQuality !== undefined && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-stone-900/85 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                    {item.matchQuality}%
                  </span>
                )}
              </div>

              <div className="border-t border-stone-100 p-2.5">
                <p className="truncate text-[11px] font-medium text-stone-500">
                  {item.brand}
                </p>
                <p className="tz-heading truncate text-xs text-stone-900 group-hover:text-amber-800">
                  {item.name}
                </p>
                <p className="mt-1 text-xs font-bold text-stone-900 tabular-nums">
                  {formatPrice(item.priceGBP)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {open && <SimilarDialog item={open} onClose={() => setOpenSlug(null)} />}
    </section>
  );
}

function SimilarDialog({
  item,
  onClose,
}: {
  item: SimilarItem;
  onClose: () => void;
}) {
  const titleId = useId();
  const href = item.kind === "clone" ? `/clone/${item.slug}` : `/pedal/${item.slug}`;

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
        className="tz-pop relative max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-lg"
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

        <div className="grid gap-0 sm:grid-cols-[minmax(0,220px)_1fr]">
          <div className="p-5">
            <div className="tz-well relative aspect-square w-full">
              <PedalImage
                src={item.imageUrl}
                name={item.name}
                brand={item.brand}
                eager
                sizes="(max-width: 640px) 90vw, 220px"
              />
              <span
                className={`tz-ribbon top-[8%] ${
                  item.kind === "clone" ? "tz-ribbon--green" : "tz-ribbon--dark"
                }`}
              >
                {item.kind === "clone" ? "Budget" : "Original"}
              </span>
            </div>
          </div>

          <div className="flex flex-col p-5 sm:p-6">
            <p className="tz-brand text-amber-700">{item.brand}</p>
            <h2 id={titleId} className="tz-heading mt-1 text-2xl text-stone-900">
              {item.name}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="tz-heading text-2xl text-stone-900 tabular-nums">
                {formatPrice(item.priceGBP)}
              </span>
              {item.matchQuality !== undefined && (
                <MatchBadge match={item.matchQuality} size="sm" />
              )}
            </div>

            <p className="tz-body mt-3 text-sm text-stone-600">{item.blurb}</p>

            {item.comparedTo && (
              <p className="mt-2 text-xs text-stone-500">
                An alternative to the{" "}
                <span className="font-bold">{item.comparedTo}</span>.
              </p>
            )}

            <div className="mt-5 border-t border-stone-200 pt-4">
              <Link
                href={href}
                onClick={onClose}
                className="tz-btn flex w-full items-center justify-center gap-2 bg-stone-900 px-5 py-3 text-sm text-white"
              >
                Go to {item.kind === "clone" ? "this pedal" : "the original"}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
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
