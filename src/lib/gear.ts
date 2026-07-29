import type { Category } from "./types";

/**
 * What to call a thing.
 *
 * The catalogue holds amps alongside pedals, but the copy was written when it
 * only held pedals, so amp pages said things like "Buy this pedal" and "budget
 * pedals that get you close to the Fender Blues Junior". Every user-facing
 * noun now comes from here instead of being typed inline.
 *
 * `Alternative` has no category of its own - a clone is whatever its original
 * is - so a clone page passes `original.category`.
 */

/** Categories that aren't pedals. Currently just amps; heads/cabs would join. */
const AMP_CATEGORIES: Category[] = ["amp"];

export function isAmp(category: Category): boolean {
  return AMP_CATEGORIES.includes(category);
}

/** The two things this site catalogues. Drives the admin form's first question. */
export type GearType = "pedal" | "amp";

export function gearTypeOf(category: Category): GearType {
  return isAmp(category) ? "amp" : "pedal";
}

/** Categories belonging to one gear type, for narrowing the admin category list. */
export function categoriesFor(
  type: GearType,
  all: readonly Category[],
): Category[] {
  return all.filter((category) => gearTypeOf(category) === type);
}

/** "pedal" / "pedals" / "amp" / "amps", by category and count. */
export function gearNoun(category: Category, count = 1): string {
  const noun = isAmp(category) ? "amp" : "pedal";
  return count === 1 ? noun : `${noun}s`;
}

/**
 * The collective noun for a mixed list.
 *
 * "gear" rather than "pedals and amps" - it's what players call the category
 * themselves, and it stays correct when the catalogue grows again.
 */
export const GEAR_PLURAL = "gear";
