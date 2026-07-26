"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Renders a hotlinked product photo when `src` is set, and falls back to
 * generated artwork when it is missing or fails to load.
 *
 * The fallback matters: remote product URLs rotate, 404, or come from a host
 * that isn't in next.config's `remotePatterns` allow-list. Any of those cases
 * fires onError and we draw a pedal instead of showing a broken image icon.
 */
export function PedalImage({
  src,
  name,
  brand,
  priority = false,
  eager = false,
  sizes = "(max-width: 768px) 50vw, 320px",
}: {
  src: string | null;
  name: string;
  brand: string;
  priority?: boolean;
  /**
   * Skip lazy loading. Needed inside the modal: its images sit in a fixed
   * overlay that Chrome's lazy-load observer never reports as intersecting,
   * so they stay unloaded forever. Anything only rendered on demand should
   * load immediately anyway — the user has already asked to see it.
   */
  eager?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div className="relative h-full w-full">
      {showFallback ? (
        <PedalArtwork name={name} brand={brand} />
      ) : (
        <Image
          src={src}
          alt={`${brand} ${name}`}
          fill
          sizes={sizes}
          priority={priority}
          loading={!priority && eager ? "eager" : undefined}
          className="object-contain p-3"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function initials(brand: string): string {
  return brand
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Shown when no real product photo could be sourced.
 *
 * Deliberately NOT an illustration of a pedal. An invented stompbox drawing
 * misrepresents the product being compared, and roughly half this catalogue is
 * discontinued or unstocked gear that no accessible retailer photographs. An
 * honest gap marker is better than a plausible fake.
 *
 * To fill one in: run `npm run images:missing` for paste-ready search links,
 * then set `imageUrl` on that pedal's record in src/data/pedals.ts and add the
 * host to `remotePatterns` in next.config.ts.
 */
function PedalArtwork({ name, brand }: { name: string; brand: string }) {
  return (
    <div
      role="img"
      aria-label={`No photo available yet for the ${brand} ${name}`}
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-100 p-4 text-center"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-7 w-7 text-stone-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.6" />
        <path d="m4 17 5-4.5 3.5 3 3-2.5L20 17" />
      </svg>
      <span className="text-[10px] font-bold tracking-[0.14em] text-stone-400 uppercase">
        Photo needed
      </span>
      <span className="text-[11px] font-semibold text-stone-500">
        {initials(brand)}
      </span>
    </div>
  );
}
