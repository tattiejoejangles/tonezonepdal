/**
 * Tonal match, colour-coded.
 *
 * The number alone made every clone look equivalent at a glance. Banding it by
 * colour lets you scan a list and see which ones actually get close, without
 * reading a single figure.
 *
 * Thresholds are deliberately strict: 90+ is "you would struggle to tell",
 * which very few earn, so green stays meaningful.
 */
export function MatchBadge({
  match,
  size = "md",
}: {
  match: number;
  size?: "sm" | "md";
}) {
  const band =
    match >= 90
      ? { tone: "bg-emerald-100 text-emerald-800 ring-emerald-200", label: "Near identical" }
      : match >= 80
        ? { tone: "bg-lime-100 text-lime-800 ring-lime-200", label: "Very close" }
        : match >= 70
          ? { tone: "bg-amber-100 text-amber-800 ring-amber-200", label: "Close" }
          : match >= 55
            ? { tone: "bg-orange-100 text-orange-800 ring-orange-200", label: "In the ballpark" }
            : { tone: "bg-rose-100 text-rose-800 ring-rose-200", label: "Its own thing" };

  return (
    <span
      title={`${band.label} - ${match}% tonal match`}
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset ${band.tone} ${
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[11px]"
      } font-bold`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {match}% MATCH
    </span>
  );
}
