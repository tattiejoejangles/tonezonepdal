import { gearNoun, gearTypeOf } from "./gear";
import type { Savings } from "./format";
import { calculateSavings } from "./format";
import { displayMatch, type ReviewSummary } from "./reviews";
import {
  footprintOf,
  specCompleteness,
  specsByField,
  SPEC_FIELDS,
  type SpecField,
} from "./specs";
import type {
  Alternative,
  Category,
  OriginalWithAlternatives,
  Spec,
} from "./types";

/**
 * Head-to-head comparison.
 *
 * Originals and clones are compared through one shape rather than two, because
 * the interesting comparisons cross the line: a Boss DS-1 against a Behringer
 * copy of it, or one budget distortion against another. Anything only one side
 * has - pros and cons, tonal match, "cheapest alternative" - is optional here
 * and simply shows as absent on the side that lacks it.
 */

export interface ComparableItem {
  kind: "original" | "clone";
  slug: string;
  href: string;
  name: string;
  brand: string;
  /** The genre this belongs to. A clone inherits its original's. */
  category: Category;
  priceGBP: number;
  blurb: string;
  description: string | null;
  imageUrl: string | null;
  searchQuery?: string;
  specs: Spec[];
  artists: string[];
  popularity: number;
  /**
   * Clones only: the tonal match as displayed, i.e. our rating already blended
   * with approved reviews. The comparison shows the same number the clone's own
   * page and its listing card show.
   */
  matchQuality?: number;
  /** Clones only: our rating before reviews, for the "we said / owners say" row. */
  editorialMatch?: number;
  /** Approved-review aggregate. Clones only, and absent until one is approved. */
  reviewSummary?: ReviewSummary;
  pros?: string[];
  cons?: string[];
  verdict?: string;
  /** Clones only: the original it copies. */
  comparedTo?: { name: string; slug: string; priceGBP: number };
  /** Originals only. */
  cheapest?: { name: string; priceGBP: number } | null;
  alternativeCount?: number;
  saving?: Savings | null;
}

export function originalToComparable(
  entry: OriginalWithAlternatives,
): ComparableItem {
  const cheapest =
    entry.alternatives.length > 0
      ? entry.alternatives.reduce((low, alt) =>
          alt.priceGBP < low.priceGBP ? alt : low,
        )
      : null;

  return {
    kind: "original",
    slug: entry.slug,
    href: `/pedal/${entry.slug}`,
    name: entry.name,
    brand: entry.brand,
    category: entry.category,
    priceGBP: entry.priceGBP,
    blurb: entry.blurb,
    description: entry.description ?? null,
    imageUrl: entry.imageUrl,
    searchQuery: entry.searchQuery,
    specs: entry.specs ?? [],
    artists: entry.artists ?? [],
    popularity: entry.popularity,
    cheapest: cheapest ? { name: cheapest.name, priceGBP: cheapest.priceGBP } : null,
    alternativeCount: entry.alternatives.length,
    saving: cheapest ? calculateSavings(entry.priceGBP, cheapest.priceGBP) : null,
  };
}

export function cloneToComparable(
  alternative: Alternative,
  original: OriginalWithAlternatives,
): ComparableItem {
  return {
    kind: "clone",
    slug: alternative.slug,
    href: `/clone/${alternative.slug}`,
    name: alternative.name,
    brand: alternative.brand,
    // A clone has no category of its own - it is whatever it copies.
    category: original.category,
    priceGBP: alternative.priceGBP,
    blurb: alternative.blurb,
    description: null,
    imageUrl: alternative.imageUrl,
    searchQuery: alternative.searchQuery,
    specs: alternative.specs ?? [],
    artists: alternative.artists ?? [],
    popularity: alternative.popularity,
    matchQuality: displayMatch(alternative),
    editorialMatch: alternative.matchQuality,
    reviewSummary: alternative.reviewSummary,
    pros: alternative.pros,
    cons: alternative.cons,
    verdict: alternative.verdict,
    comparedTo: {
      name: original.name,
      slug: original.slug,
      priceGBP: original.priceGBP,
    },
    saving: calculateSavings(original.priceGBP, alternative.priceGBP),
  };
}

/**
 * Everything in one genre, originals and their clones together, as one flat
 * list of things you could put side by side.
 */
export function comparablesInCategories(
  catalogue: OriginalWithAlternatives[],
  categories: readonly Category[],
): ComparableItem[] {
  const items: ComparableItem[] = [];

  for (const entry of catalogue) {
    if (!categories.includes(entry.category)) continue;
    items.push(originalToComparable(entry));
    for (const alternative of entry.alternatives) {
      items.push(cloneToComparable(alternative, entry));
    }
  }

  return items.sort((a, b) => a.priceGBP - b.priceGBP);
}

export function findComparable(
  catalogue: OriginalWithAlternatives[],
  slug: string,
): ComparableItem | undefined {
  for (const entry of catalogue) {
    if (entry.slug === slug) return originalToComparable(entry);
    for (const alternative of entry.alternatives) {
      if (alternative.slug === slug) return cloneToComparable(alternative, entry);
    }
  }
  return undefined;
}

/** One line of the comparison table. */
export interface CompareRow {
  label: string;
  left: string | null;
  right: string | null;
  /**
   * True when both sides have a value and the values differ. Drives the
   * highlight - a table where everything looks equally important is a table
   * nobody reads, and the differences are the entire point.
   */
  differs: boolean;
  /** True when neither side has this. Used to drop empty rows. */
  empty: boolean;
  /**
   * Which side is better on this row, for the quantities where "better" means
   * anything. Null on facts - 9V DC is not better than 18V DC - and on rows
   * where only one side has a value, because having a number is not the same as
   * winning on it.
   */
  winner?: "left" | "right" | null;
  /** "180g lighter", "3× the delay time". Only set alongside a winner. */
  margin?: string;
  hint?: string;
}

const normalise = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").replace(/[.,]$/, "").trim();

/**
 * A readable size of the gap between two quantities.
 *
 * Absolute difference for small ratios and a multiplier once one side is at
 * least twice the other, because "1400ms longer" and "3× the delay time" are the
 * same fact and the second is the one a person would say.
 */
function describeMargin(
  field: SpecField,
  better: number,
  worse: number,
): string | undefined {
  const unit = field.numeric?.unit ?? "";
  const low = Math.min(better, worse);
  const high = Math.max(better, worse);
  if (low <= 0) return undefined;

  const ratio = high / low;
  if (ratio >= 2) {
    // One decimal unless it lands on a whole multiple - "2× lighter" reads
    // better than "2.0× lighter".
    const rounded = Math.round(ratio * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}×`;
  }

  const gap = high - low;
  if (gap === 0) return undefined;
  const shown = gap < 10 ? Math.round(gap * 10) / 10 : Math.round(gap);
  return unit ? `${shown}${unit === "cm²" || unit === "Ω" ? " " : ""}${unit}` : `${shown}`;
}

/**
 * The spec table: one row per vocabulary field, always in the same order.
 *
 * Both sides are resolved through `lib/specs.ts` first, so the rows are the
 * shared vocabulary rather than whatever each side happened to call things -
 * which is what stops "Current Draw" and "Current draw" appearing as two
 * separate facts, and what lets a pedal that stored width, depth and height
 * separately line up against one that stored a single Dimensions row.
 *
 * Union rather than intersection: "this one lists its current draw and that one
 * doesn't" is useful, and an intersection would hide it. Fields neither side
 * has are dropped.
 *
 * Board space is appended after Dimensions when both sides quote three numbers.
 * It is derived rather than stored - no retailer publishes it - and it is the
 * number that actually answers "will this fit on my board".
 */
export function buildSpecRows(
  left: ComparableItem,
  right: ComparableItem,
): CompareRow[] {
  const leftSpecs = specsByField(left.specs);
  const rightSpecs = specsByField(right.specs);

  const rows: CompareRow[] = [];

  for (const field of SPEC_FIELDS) {
    const l = leftSpecs.get(field.id);
    const r = rightSpecs.get(field.id);
    if (!l && !r) continue;

    const row: CompareRow = {
      label: field.label,
      left: l?.value ?? null,
      right: r?.value ?? null,
      differs: Boolean(l && r && normalise(l.value) !== normalise(r.value)),
      empty: false,
      hint: field.hint,
      winner: null,
    };

    // A winner needs a direction, both amounts, and an actual difference.
    const direction = field.numeric?.direction;
    if (direction && l?.amount != null && r?.amount != null && l.amount !== r.amount) {
      const leftWins =
        direction === "lower" ? l.amount < r.amount : l.amount > r.amount;
      row.winner = leftWins ? "left" : "right";
      row.margin = describeMargin(field, l.amount, r.amount);
    }

    rows.push(row);

    if (field.id === "dimensions") {
      const boardRow = boardSpaceRow(l?.value, r?.value);
      if (boardRow) rows.push(boardRow);
    }
  }

  return rows;
}

/** The derived board-space row that follows Dimensions. */
function boardSpaceRow(
  leftValue: string | undefined,
  rightValue: string | undefined,
): CompareRow | null {
  const l = leftValue ? footprintOf(leftValue) : null;
  const r = rightValue ? footprintOf(rightValue) : null;
  if (l == null && r == null) return null;

  const row: CompareRow = {
    label: "Board space",
    hint: "Width × depth, worked out from the dimensions above.",
    left: l == null ? null : `${l.toFixed(0)} cm²`,
    right: r == null ? null : `${r.toFixed(0)} cm²`,
    differs: l != null && r != null && Math.round(l) !== Math.round(r),
    empty: false,
    winner: null,
  };

  if (l != null && r != null && Math.round(l) !== Math.round(r)) {
    row.winner = l < r ? "left" : "right";
    row.margin = describeMargin(BOARD_SPACE_FIELD, l, r);
  }

  return row;
}

/** Stand-in field so board space can use the same margin formatter. */
const BOARD_SPACE_FIELD: SpecField = {
  id: "footprint",
  label: "Board space",
  appliesTo: "all",
  numeric: { unit: "cm²", direction: "lower" },
};

/**
 * How many vocabulary fields each side fills in.
 *
 * Shown on the comparison because it is the honest caveat on everything above
 * it: a pedal that lists six specs and one that lists two are not equally
 * documented, and a blank row means "not published" rather than "doesn't have
 * one". Without this the reader cannot tell those apart.
 */
export function specCoverage(left: ComparableItem, right: ComparableItem) {
  return {
    left: specCompleteness(left.specs, gearTypeOf(left.category)),
    right: specCompleteness(right.specs, gearTypeOf(right.category)),
  };
}

/** A one-line summary of how the two compare on price. */
export function priceVerdict(
  left: ComparableItem,
  right: ComparableItem,
): string {
  if (left.priceGBP === right.priceGBP) return "Same price.";
  const cheaper = left.priceGBP < right.priceGBP ? left : right;
  const dearer = left.priceGBP < right.priceGBP ? right : left;
  const saving = calculateSavings(dearer.priceGBP, cheaper.priceGBP);
  return `The ${cheaper.name} is £${saving.amount} cheaper - ${saving.percent}% less.`;
}

/** "pedals" / "amps", for the genre being compared. */
export function compareNoun(category: Category): string {
  return gearNoun(category, 2);
}

/* ------------------------------------------------------------------ */

/**
 * One decided point in the head-to-head summary.
 *
 * The summary exists because a forty-row table does not answer "so which one".
 * Each point names the axis, who takes it, and by how much, and only appears
 * when there is a real difference - a scorecard padded with draws reads as
 * though nothing separates them.
 */
export interface ScorePoint {
  label: string;
  winner: "left" | "right";
  /** What the winning side has, e.g. "£45" or "4.6/5". */
  detail: string;
  /** The gap, where one can be stated plainly. */
  margin?: string;
  /** True for the axes that decide a purchase, so the UI can lead with them. */
  headline?: boolean;
}

/**
 * The axes on which one of these two genuinely beats the other.
 *
 * Deliberately a short list of things people choose on, not every numeric spec:
 * price, how close it gets, what owners think, board space and weight. Current
 * draw is included because a full power supply is the commonest reason a pedal
 * cannot go on a board.
 *
 * Ordered most decisive first, so the summary reads top-down as an argument.
 */
export function headToHead(
  left: ComparableItem,
  right: ComparableItem,
): ScorePoint[] {
  const points: ScorePoint[] = [];

  if (left.priceGBP !== right.priceGBP) {
    const leftWins = left.priceGBP < right.priceGBP;
    const winner = leftWins ? left : right;
    const saving = calculateSavings(
      Math.max(left.priceGBP, right.priceGBP),
      Math.min(left.priceGBP, right.priceGBP),
    );
    points.push({
      label: "Price",
      winner: leftWins ? "left" : "right",
      detail: `£${winner.priceGBP}`,
      margin: `£${saving.amount} less · ${saving.percent}%`,
      headline: true,
    });
  }

  // Only meaningful when both are clones of something - an original has nothing
  // to be a match for, so "the original wins on tonal match" would be nonsense.
  if (left.matchQuality !== undefined && right.matchQuality !== undefined) {
    if (left.matchQuality !== right.matchQuality) {
      const leftWins = left.matchQuality > right.matchQuality;
      points.push({
        label: "Closer to the original",
        winner: leftWins ? "left" : "right",
        detail: `${leftWins ? left.matchQuality : right.matchQuality}% match`,
        margin: `${Math.abs(left.matchQuality - right.matchQuality)} points`,
        headline: true,
      });
    }
  }

  const leftStars = left.reviewSummary?.average ?? null;
  const rightStars = right.reviewSummary?.average ?? null;
  if (leftStars != null && rightStars != null && leftStars !== rightStars) {
    const leftWins = leftStars > rightStars;
    points.push({
      label: "Better reviewed",
      winner: leftWins ? "left" : "right",
      detail: `${(leftWins ? leftStars : rightStars).toFixed(1)}/5`,
      margin: `${Math.abs(leftStars - rightStars).toFixed(1)} higher`,
      headline: true,
    });
  }

  // The physical axes, read straight out of the resolved specs so they stay in
  // step with the table below rather than being computed a second way.
  const leftSpecs = specsByField(left.specs);
  const rightSpecs = specsByField(right.specs);

  // Board space first: it is the one people actually choose on.
  const leftBoard = footprintOf(leftSpecs.get("dimensions")?.value ?? "");
  const rightBoard = footprintOf(rightSpecs.get("dimensions")?.value ?? "");
  if (leftBoard != null && rightBoard != null && Math.round(leftBoard) !== Math.round(rightBoard)) {
    const leftWins = leftBoard < rightBoard;
    points.push({
      label: "Takes less board space",
      winner: leftWins ? "left" : "right",
      detail: `${(leftWins ? leftBoard : rightBoard).toFixed(0)} cm²`,
      margin: describeMargin(BOARD_SPACE_FIELD, leftBoard, rightBoard),
    });
  }

  for (const id of ["weight", "current_draw", "power_output"] as const) {
    const field = SPEC_FIELDS.find((candidate) => candidate.id === id);
    const l = leftSpecs.get(id)?.amount;
    const r = rightSpecs.get(id)?.amount;
    if (!field || l == null || r == null || l === r) continue;

    const better = field.numeric?.direction === "higher" ? Math.max : Math.min;
    const leftWins = better(l, r) === l;
    const label =
      id === "weight"
        ? "Lighter"
        : id === "current_draw"
          ? "Draws less current"
          : "More power";

    points.push({
      label,
      winner: leftWins ? "left" : "right",
      detail: (leftWins ? leftSpecs.get(id) : rightSpecs.get(id))!.value,
      margin: describeMargin(field, l, r),
    });
  }

  return points;
}
