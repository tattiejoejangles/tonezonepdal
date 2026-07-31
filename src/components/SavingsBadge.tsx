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
}: {
  saving: Savings;
  /** Name of the original this saving is measured against. */
  comparedTo?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-[11px] gap-1.5",
    md: "px-3 py-1.5 text-xs gap-2",
    lg: "px-4 py-2 text-sm gap-2.5",
  }[size];

  return (
    <span
      className={`inline-flex flex-wrap items-center rounded bg-emerald-600 font-bold tracking-wide text-white ${sizeClasses}`}
    >
      <span className="uppercase">
        Save {formatPrice(saving.amount)} · {saving.percent}%
      </span>
      {comparedTo && (
        <span className="font-medium text-emerald-50/90 normal-case">
          vs {comparedTo}
        </span>
      )}
    </span>
  );
}
