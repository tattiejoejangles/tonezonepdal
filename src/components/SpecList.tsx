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

  return (
    <dl className="divide-y divide-stone-100">
      {specs.map((spec) => (
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
 * The artist chips.
 *
 * Also shared - the pedal page rendered these as plain text joined with
 * middots while the clone page and modal used chips, so the same fact looked
 * like two different kinds of fact depending on which page you were on.
 */
export function ArtistChips({
  artists,
  muted = false,
}: {
  artists: readonly string[];
  /** Muted when the players belong to the original rather than this pedal. */
  muted?: boolean;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {artists.map((artist) => (
        <li
          key={artist}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            muted
              ? "bg-stone-100 text-stone-600"
              : "bg-linear-to-br from-stone-800 to-stone-900 text-white"
          }`}
        >
          {artist}
        </li>
      ))}
    </ul>
  );
}
