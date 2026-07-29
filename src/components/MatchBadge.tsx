/**
 * How close a clone gets to the original it copies.
 *
 * Was a pastel pill with a coloured ring round it and "78% MATCH" set in caps.
 * Nothing else on the site is built that way - the savings badge is a solid
 * gradient block, the brand tag is a flat chip - so the ringed pill read as
 * imported from somewhere else rather than part of the page.
 *
 * This version says the thing in words and shows the number as a filled meter,
 * which is what the number actually is. The band's own colour fills the track;
 * the label carries the meaning, so the colour is reinforcement rather than
 * the only signal (a red and an amber pill were otherwise the same object).
 */

interface Band {
  label: string;
  /** Meter fill. Solid, matching the savings badge's treatment. */
  fill: string;
  text: string;
}

function bandFor(match: number): Band {
  if (match >= 90) {
    return { label: "Near identical", fill: "bg-emerald-500", text: "text-emerald-800" };
  }
  if (match >= 80) {
    return { label: "Very close", fill: "bg-emerald-500", text: "text-emerald-800" };
  }
  if (match >= 70) {
    return { label: "Close", fill: "bg-amber-500", text: "text-amber-800" };
  }
  if (match >= 55) {
    return { label: "In the ballpark", fill: "bg-orange-500", text: "text-orange-800" };
  }
  return { label: "Its own thing", fill: "bg-stone-400", text: "text-stone-600" };
}

export function MatchBadge({
  match,
  size = "md",
}: {
  match: number;
  size?: "sm" | "md";
}) {
  const band = bandFor(match);
  const small = size === "sm";

  return (
    <span
      className="inline-flex items-center gap-2"
      title={`${band.label} - ${match}% tonal match`}
    >
      {/* aria-hidden: the meter is a picture of the number that follows it. */}
      <span
        aria-hidden
        className={`relative block overflow-hidden rounded-full bg-stone-200/80 ${
          small ? "h-1 w-10" : "h-1.5 w-14"
        }`}
      >
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${band.fill}`}
          style={{ width: `${Math.min(100, Math.max(0, match))}%` }}
        />
      </span>

      <span
        className={`font-bold whitespace-nowrap ${band.text} ${
          small ? "text-[11px]" : "text-xs"
        }`}
      >
        {band.label}
        <span className="ml-1 font-medium text-stone-400 tabular-nums">
          {match}%
        </span>
      </span>
    </span>
  );
}
