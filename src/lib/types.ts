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
  // Amps sit in the same model as pedals: an expensive original with cheaper
  // alternatives against it. They get their own section rather than a genre.
  "amp",
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

/** A budget pedal that gets you close to an `Original` for less money. */
export interface Alternative {
  id: string;
  slug: string;
  /** FK to `Original.id`. */
  originalId: string;
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
  /** 0-100: how close this gets to the original's actual sound and feel. */
  matchQuality: number;
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
  artists: string[];
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
