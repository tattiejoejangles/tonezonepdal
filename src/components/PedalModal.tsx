"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MatchBadge } from "./MatchBadge";
import { PedalImage } from "./PedalImage";
import { ProsCons } from "./ProsCons";
import { RetailerButtons } from "./RetailerButtons";
import { SavingsBadge } from "./SavingsBadge";
import { ArtistChips, SpecList } from "./SpecList";
import { calculateSavings, formatPrice } from "@/lib/format";
import { displayMatch } from "@/lib/reviews";
import type { Alternative, PedalDetail } from "@/lib/types";

interface Props {
  alternative: Alternative;
  detail: PedalDetail;
  originalName: string;
  originalPrice: number;
  /** When set, the footer offers a way out to this item's own page. */
  href?: string;
  /**
   * "pedal" / "amp" / "cab", from `gearNoun` on the original's category.
   *
   * The footer button read "Go to pedal" for everything, so an amp picked as
   * Find of the Day offered to take you to a pedal. Defaults to "pedal" because
   * that is what the great majority of the catalogue is.
   */
  noun?: string;
  onClose: () => void;
}

const SLIDES = ["Overview", "Specs", "Artists"] as const;

export function PedalModal({
  alternative,
  detail,
  originalName,
  originalPrice,
  href,
  noun = "pedal",
  onClose,
}: Props) {
  const [slide, setSlide] = useState(0);
  const [image, setImage] = useState(0);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const saving = calculateSavings(originalPrice, alternative.priceGBP);
  const images = detail.images.length > 0 ? detail.images : [alternative.imageUrl];

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  // Escape closes, arrows move between panels.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  // Stop the page behind scrolling while the dialog is up.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // A portal needs a DOM to land in. This dialog only ever mounts in response
  // to a click, so there's no server pass to guard against beyond this.
  if (typeof document === "undefined") return null;

  /**
   * Rendered into <body> rather than in place.
   *
   * Keeps the dialog out of whatever card opened it. Cards used to be cut
   * with clip-path, which clips every descendant including `position: fixed`
   * ones, and trapped this dialog inside the hero card. Cards are a plain
   * radius now, but portalling is still the right call - it keeps the dialog
   * clear of any future transform, filter or overflow on an ancestor.
   */
  return createPortal(
    <div
      className="tz-fade fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
role="presentation"
    >
      {/* dvh, not vh: on iOS the toolbars overlay a vh-sized panel, which
          buries the footer buttons. overscroll-contain stops a scroll that
          reaches the end of this panel from dragging the page behind it. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="tz-pop relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto overscroll-contain bg-white shadow-2xl outline-none sm:max-h-[88dvh] sm:rounded-2xl"
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

        <div className="grid gap-0 md:grid-cols-[minmax(0,340px)_1fr]">
          {/* Gallery */}
          <div className="bg-white p-5">
            <div className="tz-well relative aspect-square w-full">
              <PedalImage
                src={images[image] ?? null}
                name={alternative.name}
                brand={alternative.brand}
                eager
                sizes="(max-width: 768px) 90vw, 340px"
              />
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setImage(index)}
                    aria-label={`Image ${index + 1}`}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white transition ${
                      index === image
                        ? "ring-2 ring-amber-500"
                        : "opacity-60 ring-1 ring-stone-300 hover:opacity-100"
                    }`}
                  >
                    <PedalImage
                      src={src ?? null}
                      name={alternative.name}
                      brand={alternative.brand}
                      eager
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col p-5 sm:p-6">
            <p className="tz-brand text-amber-700">{alternative.brand}</p>
            <h2 id={titleId} className="tz-heading mt-1 text-2xl text-stone-900">
              {alternative.name}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="tz-heading text-2xl text-stone-900">
                {formatPrice(alternative.priceGBP)}
              </span>
              <SavingsBadge saving={saving} comparedTo={originalName} size="sm" />
              <MatchBadge match={displayMatch(alternative)} size="sm" />
            </div>

            {/* Slide tabs */}
            <div className="mt-5 flex gap-1 border-b border-stone-200">
              {SLIDES.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSlide(index)}
                  className={`relative px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors ${
                    index === slide
                      ? "text-stone-900"
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {label}
                  {index === slide && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 bg-linear-to-r from-amber-500 to-orange-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Sliding panels */}
            <div className="relative mt-4 min-h-52 overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${slide * 100}%)` }}
              >
                <Panel>
                  <p className="tz-body text-sm text-stone-600">{alternative.blurb}</p>
                  {detail.verdict && (
                    <div className="mt-3 border-l-2 border-amber-500 bg-amber-50/60 p-3">
                      <p className="tz-eyebrow mb-1 text-amber-800">Our verdict</p>
                      <p className="tz-body text-sm text-stone-700">{detail.verdict}</p>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-stone-500">
                    Compared against the {originalName} at {formatPrice(originalPrice)}.
                  </p>
                  <div className="mt-4">
                    <ProsCons pros={alternative.pros} cons={alternative.cons} />
                  </div>
                </Panel>

                <Panel>
                  {detail.specsKnown ? (
                    <SpecList specs={detail.specs} size="sm" />
                  ) : (
                    <p className="tz-body text-sm text-stone-500">
                      Not confirmed yet.
                    </p>
                  )}
                </Panel>

                <Panel>
                  {detail.artists.length > 0 ? (
                    <>
                      <p className="tz-body mb-3 text-sm text-stone-600">
                        {detail.artistsAreForOriginal
                          ? `Associated with the ${originalName}, the circuit this copies.`
                          : "Known users."}
                      </p>
                      <ArtistChips
                        artists={detail.artists}
                        muted={detail.artistsAreForOriginal}
                      />
                    </>
                  ) : (
                    <p className="tz-body text-sm text-stone-500">
                      None recorded yet.
                    </p>
                  )}
                </Panel>
              </div>
            </div>

            {/* Slide controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-1.5">
                {SLIDES.map((label, index) => (
                  <span
                    key={label}
                    className={`h-1.5 transition-all ${
                      index === slide ? "w-6 bg-amber-500" : "w-1.5 bg-stone-300"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <ArrowButton onClick={prev} disabled={slide === 0} dir="left" />
                <ArrowButton onClick={next} disabled={slide === SLIDES.length - 1} dir="right" />
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-stone-200 pt-4">
              {href && (
                <Link
                  href={href}
                  onClick={onClose}
                  className="tz-btn flex w-full items-center justify-center gap-2 bg-linear-to-b from-stone-800 to-stone-950 px-5 py-2.5 text-xs tracking-wider text-white uppercase"
                >
                  Go to {noun}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              )}
              <RetailerButtons pedal={alternative} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="w-full shrink-0 px-0.5">{children}</div>;
}

function ArrowButton({
  onClick,
  disabled,
  dir,
}: {
  onClick: () => void;
  disabled: boolean;
  dir: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "Previous" : "Next"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white transition enabled:hover:bg-amber-600 disabled:opacity-25"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d={dir === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}
