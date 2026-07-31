import { formatPrice, type Savings } from "@/lib/format";

/**
 * "Save £164 vs the Boss DM-2" rather than a bare "Save £164".
 *
 * The number on its own reads like a discount off this pedal's own price,
 * which isn't what it means - it's the gap against the original being cloned.
 * Naming that pedal is the difference between a useful comparison and a
 * misleading claim.
 */
export function SavingsBadge({
  saving,
  comparedTo,
  size = "md",
  corner = false,
}: {
  saving: Savings;
  /** Name of the original this saving is measured against. */
  comparedTo?: string;
  size?: "sm" | "md" | "lg";
  /**
   * Pin it to the top-left of a positioned parent, as a yellow block.
   *
   * Used on a clone's hero photo. In the row of badges it used to sit in, the
   * single most persuasive fact on the page carried exactly as much weight as
   * everything beside it; as a block on the corner of the product shot it is
   * the first thing read. Yellow rather than green because green is used for
   * "better" throughout the comparison, and this is a price, not a verdict.
   */
  corner?: boolean;
}) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-[11px] gap-1.5",
    md: "px-3 py-1.5 text-xs gap-2",
    lg: "px-4 py-2 text-sm gap-2.5",
  }[size];

  if (corner) {
    return (
      <span className="absolute top-0 left-0 z-10 block rounded-tl rounded-br bg-amber-400 px-3 py-2 text-left shadow-sm">
        <span className="block text-base leading-none font-bold text-stone-900 tabular-nums">
          Save {formatPrice(saving.amount)}
        </span>
        <span className="mt-1 block text-[11px] leading-tight font-medium text-stone-800">
          {saving.percent}% off{comparedTo ? ` the ${comparedTo}` : ""}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-wrap items-center rounded bg-emerald-600 font-bold tracking-wide text-white ${sizeClasses}`}
    >
      <span>
        Save {formatPrice(saving.amount)} · {saving.percent}%
      </span>
      {comparedTo && (
        <span className="font-medium text-emerald-50/90">vs {comparedTo}</span>
      )}
    </span>
  );
}
