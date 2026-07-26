"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { PedalImage } from "./PedalImage";
import { ProsCons } from "./ProsCons";
import { RetailerButtons } from "./RetailerButtons";
import { SavingsBadge } from "./SavingsBadge";
import { calculateSavings, formatPrice } from "@/lib/format";
import type { Alternative, PedalDetail } from "@/lib/types";

interface Props {
  alternative: Alternative;
  detail: PedalDetail;
  originalName: string;
  originalPrice: number;
  onClose: () => void;
}

const SLIDES = ["Overview", "Controls", "Artists"] as const;

export function PedalModal({
  alternative,
  detail,
  originalName,
  originalPrice,
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

  return (
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
        className="tz-pop relative max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-white shadow-2xl outline-none sm:max-h-[88vh] sm:rounded-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center bg-stone-900/85 text-white transition hover:bg-stone-900 hover:rotate-90"
          style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="grid gap-0 md:grid-cols-[minmax(0,340px)_1fr]">
          {/* Gallery */}
          <div className="bg-stone-50 p-5">
            <div className="relative aspect-square w-full bg-white">
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
                    className={`relative h-14 w-14 shrink-0 bg-white transition ${
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
            <p className="tz-eyebrow text-amber-700">{alternative.brand}</p>
            <h2 id={titleId} className="tz-heading mt-1 text-2xl text-stone-900">
              {alternative.name}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="tz-heading text-2xl text-stone-900">
                {formatPrice(alternative.priceGBP)}
              </span>
              <SavingsBadge saving={saving} comparedTo={originalName} size="sm" />
              <span className="bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600">
                {alternative.matchQuality}% MATCH
              </span>
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
                      <p className="tz-eyebrow mb-1 text-amber-800">What players say</p>
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
                  {!detail.controlsKnown && (
                    <p className="tz-body text-sm text-stone-500">
                      We haven&apos;t confirmed this pedal&apos;s control layout yet,
                      so rather than guess we&apos;re leaving it blank.
                    </p>
                  )}
                  <ul className="space-y-2.5">
                    {detail.controls.map((control) => (
                      <li key={control.name} className="flex gap-3">
                        <span className="mt-0.5 shrink-0 bg-stone-900 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                          {control.name}
                        </span>
                        <span className="tz-body text-sm text-stone-600">
                          {control.what}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel>
                  {detail.artists.length > 0 ? (
                    <>
                      <p className="tz-body mb-3 text-sm text-stone-600">
                        {detail.artistsAreForOriginal
                          ? `No documented users of this clone specifically — these players are associated with the ${originalName}, the circuit it copies.`
                          : "Known users of this pedal."}
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {detail.artists.map((artist) => (
                          <li
                            key={artist}
                            className={`px-3 py-1.5 text-xs font-bold ${
                              detail.artistsAreForOriginal
                                ? "bg-stone-100 text-stone-600"
                                : "bg-linear-to-br from-stone-800 to-stone-900 text-white"
                            }`}
                          >
                            {artist}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="tz-body text-sm text-stone-500">
                      No artist associations recorded for this pedal yet.
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

            <div className="mt-5 border-t border-stone-200 pt-4">
              <RetailerButtons pedal={alternative} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
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
      className="flex h-8 w-8 items-center justify-center bg-stone-900 text-white transition enabled:hover:bg-amber-600 disabled:opacity-25"
      style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d={dir === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}
