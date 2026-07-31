import { ArtistEditor } from "./admin/ArtistEditor";
import type { ResolvedArtist } from "@/lib/artists";
import { resolveSpecs } from "@/lib/specs";
import type { PedalDetail } from "@/lib/types";

/**
 * The label/value spec table.
 *
 * One component because there were three: the pedal page used a 8rem label
 * column with rules top and bottom, the clone page used 8rem with rules
 * between rows only, and the modal used 7rem at a smaller type size. Three
 * spec tables that nearly line up is worse than one that does, and this is the
 * component most responsible for a pedal page looking "aligned" or not.
 *
 * A two-column grid rather than a flex row with a fixed-width term: the grid
 * sizes the label column to the longest label present and then holds every row
 * to it, so values start on the same x for the whole table instead of being
 * pushed around by one long label. It stacks below `sm`, where a 9rem label
 * column would leave values about twelve characters of width.
 */
export function SpecList({
  specs,
  size = "md",
}: {
  specs: PedalDetail["specs"];
  size?: "sm" | "md";
}) {
  const text = size === "sm" ? "text-xs" : "text-sm";

  // Resolved through the vocabulary so every pedal lists the same fields in the
  // same order - Power, Current draw, Bypass, Connections, Dimensions, Weight,
  // Enclosure, Features - whatever the rows happen to be called in storage. The
  // comparison reads them through the same resolver, so a pedal's own page and
  // any comparison it appears in can never disagree.
  const resolved = resolveSpecs(specs).map((spec) => ({
    label: spec.label,
    value: spec.value,
  }));

  // Nothing matched the vocabulary at all: show what there is rather than an
  // empty panel.
  const rows = resolved.length > 0 ? resolved : specs;

  return (
    <dl className="divide-y divide-stone-100">
      {rows.map((spec) => (
        <div
          key={spec.label}
          className="grid gap-x-4 gap-y-0.5 py-2 sm:grid-cols-[minmax(0,9rem)_1fr]"
        >
          <dt className={`font-bold text-stone-500 ${text}`}>{spec.label}</dt>
          {/* tabular-nums so "9V / 18mA" style values don't shuffle their
              columns from row to row. */}
          <dd className={`tz-body min-w-0 text-stone-700 tabular-nums ${text}`}>
            {spec.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The artist list, with photos.
 *
 * Was a row of word-chips, which left the most evocative fact on the page -
 * who actually used this thing - looking like a tag cloud. Each artist now
 * gets a face where we have one.
 *
 * Artists without a photo fall back to their initials on a tinted disc rather
 * than a broken image or a gap, so a half-populated table still looks
 * deliberate. That matters because the table ships empty: photos get filled in
 * one at a time.
 */
export function ArtistChips({
  artists,
  muted = false,
}: {
  artists: readonly ResolvedArtist[];
  /** Muted when the players belong to the original rather than this pedal. */
  muted?: boolean;
}) {
  return (
    // A grid of square cards, not a row of chips. A face wants to be square
    // and reasonably large - a 28px disc inside a pill was decoration, not a
    // photograph. Auto-fill means the same markup gives four across a wide
    // panel and two on a phone without breakpoint guesswork.
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
      {artists.map((artist) => (
        <li key={artist.name} className="min-w-0">
          <figure className="group">
            <div
              className={`tz-chamfer relative aspect-square overflow-hidden ring-1 ${
                muted ? "bg-stone-100 ring-stone-200" : "bg-stone-900 ring-stone-200"
              }`}
            >
              <ArtistAvatar artist={artist} muted={muted} />
              {/* Renders nothing unless signed into admin. Inside the square so
                  the pen sits on the photo's corner, and `group-hover` on the
                  figure above is what reveals it. */}
              <ArtistEditor
                name={artist.name}
                imageUrl={artist.imageUrl}
                imageCredit={artist.imageCredit}
                knownFor={artist.knownFor}
              />
            </div>
            <figcaption
              className={`mt-1.5 text-center text-[11px] leading-tight font-bold ${
                muted ? "text-stone-500" : "text-stone-700"
              }`}
            >
              {artist.name}
              {artist.knownFor && (
                <span className="mt-0.5 block font-medium text-stone-400">
                  {artist.knownFor}
                </span>
              )}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

/**
 * The photo, or initials.
 *
 * A plain <img> rather than next/image: these URLs are pasted in by hand from
 * arbitrary hosts, and next/image refuses any domain not listed in
 * next.config, which would mean a config edit every time an artist is added.
 * They're 32px, so there is nothing to optimise.
 */
function ArtistAvatar({
  artist,
  muted,
}: {
  artist: ResolvedArtist;
  muted: boolean;
}) {
  if (artist.imageUrl) {
    return (
      /* See the note above: URLs are pasted in by hand from arbitrary hosts,
         and next/image rejects any domain not listed in next.config - which
         would mean a config edit and a redeploy every time an artist is
         added. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={artist.imageUrl}
        alt={artist.name}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  const initials = artist.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  // Placeholder until a photo is pasted in: initials on the brand's own dark
  // gradient. Deliberately not a generic silhouette - initials read as
  // "waiting for a picture" rather than "this is broken", which matters while
  // the table fills up one artist at a time.
  return (
    <span
      aria-hidden
      className={`absolute inset-0 flex items-center justify-center text-lg font-bold tracking-tight ${
        muted
          ? "bg-stone-200 text-stone-500"
          : "bg-linear-to-br from-stone-700 via-stone-900 to-black text-amber-300/90"
      }`}
    >
      {initials}
    </span>
  );
}
