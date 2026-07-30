/**
 * How close a clone gets to the original it copies.
 *
 * This is the single most useful number on the site - "£40 instead of £249" is
 * only interesting once you know whether it actually sounds like the thing -
 * and it was being rendered as a hairline meter and some grey text, quieter
 * than the brand name above it. It is now a solid block in the same visual
 * language as the savings badge, because those two facts are a pair and should
 * carry the same weight.
 *
 * The verdict leads and the number follows it. "Very close" is what someone is
 * actually looking for; 84% is the supporting detail, not the headline.
 */

interface Band {
  label: string;
  /** Solid fill, mirroring SavingsBadge's treatment. */
  fill: string;
  /** Track fill for the inline meter. */
  meter: string;
}

function bandFor(match: number): Band {
  if (match >= 90) {
    return {
      label: "Near identical",
      fill: "bg-linear-to-r from-emerald-700 to-emerald-600",
      meter: "bg-white",
    };
  }
  if (match >= 80) {
    return {
      label: "Very close",
      fill: "bg-linear-to-r from-emerald-600 to-emerald-500",
      meter: "bg-white",
    };
  }
  if (match >= 70) {
    return {
      label: "Close",
      fill: "bg-linear-to-r from-amber-600 to-amber-500",
      meter: "bg-white",
    };
  }
  if (match >= 55) {
    return {
      label: "In the ballpark",
      fill: "bg-linear-to-r from-orange-600 to-orange-500",
      meter: "bg-white",
    };
  }
  return {
    label: "Its own thing",
    fill: "bg-linear-to-r from-stone-600 to-stone-500",
    meter: "bg-white",
  };
}

export function MatchBadge({
  match,
  size = "md",
}: {
  match: number;
  /** `lg` for a hero, `sm` inside a dialog, `md` everywhere else. */
  size?: "sm" | "md" | "lg";
}) {
  const band = bandFor(match);
  const clamped = Math.min(100, Math.max(0, match));

  const pad =
    size === "lg" ? "px-4 py-2.5 text-sm" : size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs";
  const meterWidth = size === "lg" ? "w-16" : size === "sm" ? "w-8" : "w-10";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold text-white shadow-sm ${band.fill} ${pad}`}
      title={`${band.label} - ${clamped}% tonal match to the original`}
    >
      <span className="tracking-wide whitespace-nowrap">
        {band.label}
      </span>

      {/* The meter is a picture of the number beside it, so it's decorative. */}
      <span
        aria-hidden
        className={`relative h-1 shrink-0 overflow-hidden rounded-full bg-black/25 ${meterWidth}`}
      >
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${band.meter}`}
          style={{ width: `${clamped}%` }}
        />
      </span>

      <span className="tabular-nums opacity-90">{clamped}%</span>
    </span>
  );
}

/**
 * Label only, for tight spots like a listing card where the full badge would
 * dominate a 300px column. Same bands, so the colour still means one thing.
 */
export function MatchTag({ match }: { match: number }) {
  const band = bandFor(match);
  return (
    <span className={`tz-tag text-white ${band.fill}`}>
      {band.label}
      <span className="font-medium tabular-nums opacity-90">{match}%</span>
    </span>
  );
}
