import type { Alternative, Category, OriginalWithAlternatives } from "./types";
import { calculateSavings, type Savings } from "./format";

/**
 * Home page organisation: genre groupings and the daily bargain pick.
 */

export interface Genre {
  id: string;
  label: string;
  blurb: string;
  categories: Category[];
  /**
   * What one item in this genre is called. Defaults to "pedal"; amps are not
   * pedals, and "Amps pedals - 5 PEDALS" reads like a bug.
   */
  noun?: string;
}

/** Singular and plural nouns for a genre's contents. */
export function genreNoun(genre: Genre, count: number): string {
  const noun = genre.noun ?? "pedal";
  return count === 1 ? noun : `${noun}s`;
}

/** Categories that are not guitar pedals, so the pedal menu can exclude them. */
export const NON_PEDAL_CATEGORIES: Category[] = ["amp"];

export const AMPS_GENRE: Genre = {
  id: "amps",
  label: "Amps",
  blurb: "Valve tone and clean headroom, without the boutique invoice.",
  categories: ["amp"],
  noun: "amp",
};

export const GENRES: Genre[] = [
  {
    id: "distortion",
    label: "Distortion & Fuzz",
    blurb: "Hard clipping, buzzsaws and everything that bites.",
    categories: ["distortion", "fuzz"],
  },
  {
    id: "overdrive",
    label: "Overdrive & Boost",
    blurb: "Amp-pushers, mid-humps and always-on tone thickeners.",
    categories: ["overdrive"],
  },
  {
    id: "delay",
    label: "Delay & Echo",
    blurb: "Slapback, analogue warmth and long digital trails.",
    categories: ["delay"],
  },
  {
    id: "modulation",
    label: "Modulation",
    blurb: "Chorus shimmer and flanger jet-sweeps.",
    categories: ["modulation"],
  },
  {
    id: "octave",
    label: "Octave & Pitch",
    blurb: "Sub-octaves, organ tones and synth-like bass.",
    categories: ["octave"],
  },
  {
    id: "eq",
    label: "EQ & Utility",
    blurb: "The unglamorous pedals that fix everything else.",
    categories: ["eq"],
  },
  {
    id: "reverb",
    label: "Reverb",
    blurb: "Springs, halls and plates.",
    categories: ["reverb"],
  },
];

export function findGenre(id: string): Genre | undefined {
  return [...GENRES, AMPS_GENRE].find((genre) => genre.id === id);
}

/** Every original in one genre, most popular first. */
export function entriesInGenre(
  catalogue: OriginalWithAlternatives[],
  genre: Genre,
): OriginalWithAlternatives[] {
  return catalogue
    .filter((entry) => genre.categories.includes(entry.category))
    .sort((a, b) => b.popularity - a.popularity);
}

export interface GenreGroup {
  genre: Genre;
  entries: OriginalWithAlternatives[];
}

/**
 * Groups the catalogue by genre, dropping genres with nothing in them yet.
 * Amps come last: they're the newest section and the least expected here.
 */
export function groupByGenre(catalogue: OriginalWithAlternatives[]): GenreGroup[] {
  return [...GENRES, AMPS_GENRE].map((genre) => ({
    genre,
    entries: catalogue.filter((entry) => genre.categories.includes(entry.category)),
  })).filter((group) => group.entries.length > 0);
}

export interface DailyFind {
  original: OriginalWithAlternatives;
  alternative: Alternative;
  saving: Savings;
}

/** Every original/clone pairing, biggest saving first. */
function rankedBargains(catalogue: OriginalWithAlternatives[]): DailyFind[] {
  return catalogue
    .flatMap((original) =>
      original.alternatives.map((alternative) => ({
        original,
        alternative,
        saving: calculateSavings(original.priceGBP, alternative.priceGBP),
      })),
    )
    .sort((a, b) => {
      if (b.saving.amount !== a.saving.amount) return b.saving.amount - a.saving.amount;
      return b.saving.percent - a.saving.percent;
    });
}

function dayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
}

/**
 * The Find of the Day.
 *
 * Rotates through the biggest price differentials rather than always showing
 * the single largest, so the pick changes daily but is always a genuine
 * bargain. Derived from the date rather than randomness so that the server
 * render and the client agree.
 */
export function findOfTheDay(
  catalogue: OriginalWithAlternatives[],
  date: Date = new Date(),
  poolSize = 10,
): DailyFind | undefined {
  const ranked = rankedBargains(catalogue);
  if (ranked.length === 0) return undefined;

  const pool = ranked.slice(0, Math.min(poolSize, ranked.length));
  return pool[dayNumber(date) % pool.length];
}
