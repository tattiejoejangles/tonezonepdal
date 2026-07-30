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

/**
 * Categories that aren't pedals.
 *
 * Every amp category has to be listed, not just the generic `amp` bucket. This
 * held `["amp"]` alone while the specific types existed, so `isAmp` answered
 * false for every reclassified row and a valve combo was described as a pedal
 * everywhere the noun came from here - including "Go to pedal" on the Find of
 * the Day dialog. `sections.ts` re-exports this list rather than keeping its
 * own copy, which is how the two drifted apart in the first place.
 */
export const AMP_CATEGORIES: Category[] = [
  "amp",
  "amp-valve",
  "amp-modelling",
  "amp-cab",
];

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

/**
 * "pedal" / "amp" / "cab", singular or plural by count.
 *
 * A speaker cab is not an amp - it has no amplifier in it - so it gets its own
 * noun rather than being folded in with the combos, matching the label its
 * genre already carries in `sections.ts`.
 */
export function gearNoun(category: Category, count = 1): string {
  const noun =
    category === "amp-cab" ? "cab" : isAmp(category) ? "amp" : "pedal";
  return count === 1 ? noun : `${noun}s`;
}

/**
 * The collective noun for a mixed list.
 *
 * "gear" rather than "pedals and amps" - it's what players call the category
 * themselves, and it stays correct when the catalogue grows again.
 */
export const GEAR_PLURAL = "gear";
