import type { ResolvedArtist } from "./artists";
import type { ReviewSummary } from "./reviews";

/**
 * Core domain types for The ToneZone.
 *
 * These interfaces are deliberately shaped to map 1:1 onto Supabase tables
 * later on: `Original` becomes `originals`, `Alternative` becomes
 * `alternatives` with an `original_id` foreign key. Keeping the shapes stable
 * now means the migration is a swap of the data module, not a rewrite.
 */

/** A knob, switch or socket, explained. */
export interface Control {
  name: string;
  what: string;
}

/**
 * One line of the spec sheet - "Power", "9V DC centre-negative".
 *
 * Free-form label/value rather than fixed fields: what's worth stating varies
 * by pedal, and an empty list is meaningful (the UI says specs aren't
 * confirmed rather than printing a plausible guess).
 */
export interface Spec {
  label: string;
  value: string;
}

/** A retailer we send affiliate traffic to. */
export type RetailerId = "amazon" | "reverb" | "gear4music";

/**
 * Effect family, used to group the directory into genre sections.
 *
 * A const array rather than a bare union so the admin form can render the
 * options from the same source the type comes from - the values must match
 * the `category` CHECK constraint on the Supabase table exactly.
 */
export const CATEGORIES = [
  "overdrive",
  "distortion",
  "fuzz",
  "delay",
  "modulation",
  "octave",
  "eq",
  "reverb",
  // Amps sit in the same model as pedals - an expensive original with cheaper
  // alternatives against it - but they browse separately, and "amps" on its
  // own turned out to be too coarse: a valve combo, a modelling box and a
  // speaker cab are not alternatives to one another.
  //
  // `amp` is kept as the generic bucket so existing rows stay valid against
  // the CHECK constraint; supabase/seed/06-amp-categories.sql reclassifies
  // them and everything new should use one of the specific ones.
  "amp",
  "amp-valve",
  "amp-modelling",
  "amp-cab",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** An expensive, sought-after pedal that people want a cheaper version of. */
export interface Original {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  /** Typical UK street price in GBP. Estimate - verify before launch. */
  priceGBP: number;
  /** One-line hook shown on directory cards. */
  blurb: string;
  /** Longer copy for the detail page. */
  description: string;
  /** Remote product photo. Null renders the "photo needed" plate. */
  imageUrl: string | null;
  /** Where the photo came from, e.g. "wikimedia - CC BY 2.0". */
  imageCredit?: string;
  /** Search aliases - what people actually type ("ts9", "klon", "screamer"). */
  tags: string[];
  /** 0-100, drives the "Most Popular" sort. */
  popularity: number;
  /** Overrides the retailer search string when the display name searches badly. */
  searchQuery?: string;
  /** Alternate retail names, used when hunting for product photography. */
  aliases?: string[];
  /** Players strongly associated with this pedal. */
  artists?: string[];
  /** Verified knob/switch layout. Absent means we haven't confirmed it. */
  controls?: Control[];
  /** Spec sheet rows. Empty means unconfirmed. */
  specs?: Spec[];
}

/**
 * One original a clone is an alternative to.
 *
 * A clone can copy more than one thing - a Sub 'N' Up stands in for a POG and
 * for an OC-5 - and how close it gets depends on which one you hold it against,
 * so the match belongs here rather than on the clone.
 */
export interface ClonedOriginal {
  id: string;
  slug: string;
  name: string;
  brand: string;
  priceGBP: number;
  imageUrl: string | null;
  category: Category;
  /** This pairing's match, falling back to the clone's own. */
  matchQuality: number;
  /** True for the original the clone's own page leads with. */
  primary: boolean;
}

/** A budget pedal that gets you close to an `Original` for less money. */
export interface Alternative {
  id: string;
  slug: string;
  /**
   * FK to `Original.id` - the PRIMARY original.
   *
   * Decides the clone's category and which pedal its page leads with. Further
   * pairings live in `clonesOf`.
   */
  originalId: string;
  /**
   * Every original this is an alternative to, primary first.
   *
   * Attached by the catalogue loader. Empty in the bundled fallback data, where
   * the single `originalId` is all there is.
   */
  clonesOf?: ClonedOriginal[];
  name: string;
  brand: string;
  /** Typical UK street price in GBP. Estimate - verify before launch. */
  priceGBP: number;
  imageUrl: string | null;
  blurb: string;
  /** How it beats the original, or holds its own. */
  pros: string[];
  /** Where it falls short. Honesty here is the whole point of the site. */
  cons: string[];
  popularity: number;
  /**
   * 0-100: our editorial judgement of how close this gets to the original.
   *
   * Stays the editorial number even once reviews exist. What the UI shows is
   * `displayMatch()`, which blends this with `reviewSummary` - keeping the two
   * apart is what lets a page say "we said 85, owners say 71".
   */
  matchQuality: number;
  /**
   * Approved-review aggregate, attached by the catalogue loader.
   *
   * Absent when nothing has been approved, when Supabase is unreachable, or in
   * the bundled fallback data - all of which mean "show the editorial number".
   */
  reviewSummary?: ReviewSummary;
  searchQuery?: string;
  aliases?: string[];
  /** Editorial summary of what players report. Stored in Supabase. */
  verdict?: string;
  /** Extra product shots for the modal gallery. Stored in Supabase. */
  gallery?: string[];
  /**
   * Players known to use this specific clone - not the original it copies.
   * Usually empty: budget clones rarely have documented famous users.
   */
  artists?: string[];
  /** Verified knob/switch layout. Absent means we haven't confirmed it. */
  controls?: Control[];
  /** Spec sheet rows. Empty means unconfirmed. */
  specs?: Spec[];
}

/** An original joined with its alternatives - the unit the UI renders. */
export interface OriginalWithAlternatives extends Original {
  alternatives: Alternative[];
}

/** Everything the detail modal shows beyond the basic record. */
export interface PedalDetail {
  /** Spec sheet rows - power, connections and anything else confirmed. */
  specs: Spec[];
  /** True when `specs` is verified data rather than an empty placeholder. */
  specsKnown: boolean;
  /** Names as stored on the pedal, each resolved to a photo where we have one. */
  artists: ResolvedArtist[];
  /** Whose artists these are - this pedal's, or the original it clones. */
  artistsAreForOriginal: boolean;
  /** Extra product shots for the modal gallery. */
  images: string[];
  /**
   * Short editorial summary of what players report about this pedal.
   * Written by hand - see scripts/fetch-details.mjs for why review text is
   * not scraped from retailers.
   */
  verdict?: string;
}
