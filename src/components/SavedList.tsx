"use client";

import Link from "next/link";

import { PedalImage } from "./PedalImage";
import { useBookmarks } from "@/lib/local-store";
import { formatPrice } from "@/lib/format";
import type { SearchIndex } from "@/lib/search-index";

/**
 * The saved pedals list.
 *
 * Bookmarks store only a kind and a slug. Everything shown here is resolved
 * against the search index the layout already builds, so a saved pedal always
 * displays its current price and photo rather than a snapshot from whenever it
 * was saved - and a pedal that has since been removed simply drops out.
 */
export function SavedList({ index }: { index: SearchIndex }) {
  const { bookmarks, remove, ready } = useBookmarks();

  const items = bookmarks
    .map((mark) => {
      const entry = index.find(
        (candidate) =>
          candidate.slug === mark.slug &&
          (mark.kind === "original") === (candidate.kind === "original"),
      );
      return entry ? { mark, entry } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (!ready) {
    return <p className="tz-body text-sm text-stone-500">Loading your saved pedals…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="tz-chamfer bg-white/70 px-6 py-16 text-center ring-1 ring-stone-200">
        <p className="text-lg font-bold text-stone-800">Nothing saved yet</p>
        <p className="tz-body mx-auto mt-2 max-w-md text-sm text-stone-500">
          Hit <span className="font-bold">Save</span> on any pedal and it lands
          here. Saved pedals live in this browser, so they stay private and need
          no account - but they won&apos;t follow you to another device.
        </p>
        <Link
          href="/"
          className="tz-btn mt-5 inline-flex bg-linear-to-b from-stone-800 to-stone-950 px-6 py-3 text-sm tracking-wide text-white"
        >
          Browse pedals
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map(({ mark, entry }) => (
        <li
          key={`${mark.kind}-${mark.slug}`}
          className="tz-chamfer tz-card tz-card-hover group relative flex items-center gap-4 bg-white p-4 ring-1 ring-stone-200/60"
        >
          <Link
            href={entry.kind === "original" ? `/pedal/${entry.slug}` : `/clone/${entry.slug}`}
            className="absolute inset-0 z-10 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            aria-label={`View the ${entry.name}`}
          />

          <div className="tz-well relative h-16 w-16 shrink-0">
            <PedalImage
              src={entry.imageUrl}
              name={entry.name}
              brand={entry.brand}
              sizes="64px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="tz-brand text-amber-700">{entry.brand}</p>
            <p className="tz-heading truncate text-base text-stone-900 group-hover:text-amber-700">
              {entry.name}
            </p>
            {entry.kind === "clone" && (
              <p className="truncate text-[11px] text-stone-500">
                Alternative to {entry.originalName}
              </p>
            )}
          </div>

          <span className="tz-heading shrink-0 text-lg text-stone-900">
            {formatPrice(entry.priceGBP)}
          </span>

          <button
            type="button"
            onClick={() => remove(mark.kind, mark.slug)}
            aria-label={`Remove ${entry.name} from saved`}
            className="relative z-20 shrink-0 px-2 py-1 text-[11px] font-bold tracking-wider text-stone-400 uppercase transition-colors hover:text-rose-700"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
