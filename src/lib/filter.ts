import type { Alternative, OriginalWithAlternatives } from "./types";
import { calculateSavings, type Savings } from "./format";

/**
 * Pure search / filter / sort logic for the directory.
 *
 * Deliberately free of React and the DOM so it can be reasoned about and
 * tested on its own — the page component just calls `filterCatalogue` from a
 * useMemo and renders whatever comes back.
 */

export type PriceFilterId = "all" | "under-30" | "under-50" | "under-100";
export type SortId = "match" | "price-asc" | "price-desc" | "popular";

export const PRICE_FILTERS: { id: PriceFilterId; label: string; max: number }[] = [
  { id: "all", label: "All Prices", max: Number.POSITIVE_INFINITY },
  { id: "under-30", label: "Under £30", max: 30 },
  { id: "under-50", label: "Under £50", max: 50 },
  { id: "under-100", label: "Under £100", max: 100 },
];

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "match", label: "Closest Match" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "popular", label: "Most Popular" },
];

export interface DirectoryOptions {
  query: string;
  priceFilter: PriceFilterId;
  /**
   * Optional: the home page doesn't offer sorting (it's organised by genre),
   * so it falls back to cheapest-first. Sorting lives on the detail page,
   * where it reorders a single pedal's clones.
   */
  sort?: SortId;
}

export interface DirectoryResult extends OriginalWithAlternatives {
  /** Cheapest alternative still surviving the active price filter. */
  cheapest: Alternative | null;
  /** Biggest saving available against this original after filtering. */
  bestSaving: Savings | null;
  /** Search relevance. 0 when there is no active query. */
  relevance: number;
}

/** Lowercases and strips punctuation so "TS-9" and "ts9" both match. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function priceCeiling(id: PriceFilterId): number {
  return PRICE_FILTERS.find((filter) => filter.id === id)?.max ?? Number.POSITIVE_INFINITY;
}

/**
 * Relevance score for one original against a normalized query.
 * Returns 0 when the entry doesn't match at all.
 */
export function scoreEntry(entry: OriginalWithAlternatives, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const name = normalize(entry.name);
  const brand = normalize(entry.brand);
  const tags = entry.tags.map(normalize);
  const altNames = entry.alternatives.map((alt) => normalize(alt.name));
  const altBrands = entry.alternatives.map((alt) => normalize(alt.brand));

  const haystack = [name, brand, ...tags, ...altNames, ...altBrands].join(" ");
  const terms = normalizedQuery.split(" ").filter(Boolean);

  // Every term has to appear somewhere, so "boss delay" doesn't return every Boss pedal.
  if (!terms.every((term) => haystack.includes(term))) return 0;

  let score = 1; // Matched at all.

  if (name.includes(normalizedQuery)) score += 100;
  if (name.startsWith(normalizedQuery)) score += 60;
  if (tags.some((tag) => tag === normalizedQuery)) score += 80;
  if (tags.some((tag) => tag.includes(normalizedQuery))) score += 30;
  if (brand.includes(normalizedQuery)) score += 25;
  if (altNames.some((altName) => altName.includes(normalizedQuery))) score += 20;
  if (altBrands.some((altBrand) => altBrand.includes(normalizedQuery))) score += 10;

  return score;
}

function sortAlternatives(alternatives: Alternative[], sort: SortId): Alternative[] {
  const sorted = [...alternatives];

  switch (sort) {
    case "price-desc":
      return sorted.sort((a, b) => b.priceGBP - a.priceGBP);
    case "popular":
      return sorted.sort((a, b) => b.popularity - a.popularity);
    case "match":
      return sorted.sort((a, b) => b.matchQuality - a.matchQuality);
    case "price-asc":
    default:
      return sorted.sort((a, b) => a.priceGBP - b.priceGBP);
  }
}

/**
 * Filters and sorts the catalogue.
 *
 * The price filter applies to *alternatives*, not originals — every original
 * here costs three figures, so filtering them by price would return nothing.
 * An original survives only if at least one of its alternatives fits the
 * budget, and its list is narrowed to the ones that do.
 */
export function filterCatalogue(
  catalogue: OriginalWithAlternatives[],
  { query, priceFilter, sort = "price-asc" }: DirectoryOptions,
): DirectoryResult[] {
  const normalizedQuery = normalize(query);
  const ceiling = priceCeiling(priceFilter);

  const results: DirectoryResult[] = [];

  for (const entry of catalogue) {
    const relevance = scoreEntry(entry, normalizedQuery);
    if (normalizedQuery && relevance === 0) continue;

    const affordable = entry.alternatives.filter((alt) => alt.priceGBP <= ceiling);
    if (affordable.length === 0) continue;

    const ordered = sortAlternatives(affordable, sort);
    const cheapest = affordable.reduce((lowest, alt) =>
      alt.priceGBP < lowest.priceGBP ? alt : lowest,
    );

    results.push({
      ...entry,
      alternatives: ordered,
      cheapest,
      bestSaving: calculateSavings(entry.priceGBP, cheapest.priceGBP),
      relevance,
    });
  }

  return sortResults(results, sort);
}

function sortResults(results: DirectoryResult[], sort: SortId): DirectoryResult[] {
  const sorted = [...results];

  switch (sort) {
    case "price-asc":
      // Ranked by the cheapest way in, which is what a budget shopper cares about.
      return sorted.sort(
        (a, b) => (a.cheapest?.priceGBP ?? 0) - (b.cheapest?.priceGBP ?? 0),
      );
    case "price-desc":
      return sorted.sort(
        (a, b) => (b.cheapest?.priceGBP ?? 0) - (a.cheapest?.priceGBP ?? 0),
      );
    case "popular":
      return sorted.sort((a, b) => b.popularity - a.popularity);
    case "match":
    default:
      return sorted.sort((a, b) => {
        // With a query, relevance wins. Without one, fall back to how close
        // the best available clone actually gets to the original.
        if (a.relevance !== b.relevance) return b.relevance - a.relevance;
        const bestA = Math.max(...a.alternatives.map((alt) => alt.matchQuality));
        const bestB = Math.max(...b.alternatives.map((alt) => alt.matchQuality));
        if (bestA !== bestB) return bestB - bestA;
        return b.popularity - a.popularity;
      });
  }
}

/** A clone matched by search, with the original it copies for context. */
export interface CloneResult {
  alternative: Alternative;
  original: OriginalWithAlternatives;
  saving: Savings;
  relevance: number;
}

/**
 * Searches the clones themselves.
 *
 * People search for "Behringer TO800" as often as "Tube Screamer", so clones
 * need to be findable in their own right rather than only as a row inside
 * their original's page.
 */
export function filterAlternatives(
  catalogue: OriginalWithAlternatives[],
  { query, priceFilter }: Omit<DirectoryOptions, "sort">,
): CloneResult[] {
  const normalizedQuery = normalize(query);
  const ceiling = priceCeiling(priceFilter);
  if (!normalizedQuery) return [];

  const terms = normalizedQuery.split(" ").filter(Boolean);
  const results: CloneResult[] = [];

  for (const original of catalogue) {
    for (const alternative of original.alternatives) {
      if (alternative.priceGBP > ceiling) continue;

      const name = normalize(alternative.name);
      const brand = normalize(alternative.brand);
      const haystack = [name, brand, ...(alternative.aliases ?? []).map(normalize)].join(" ");
      if (!terms.every((term) => haystack.includes(term))) continue;

      let relevance = 1;
      if (name.includes(normalizedQuery)) relevance += 100;
      if (name.startsWith(normalizedQuery)) relevance += 60;
      if (brand.includes(normalizedQuery)) relevance += 25;

      results.push({
        alternative,
        original,
        saving: calculateSavings(original.priceGBP, alternative.priceGBP),
        relevance,
      });
    }
  }

  return results.sort((a, b) =>
    b.relevance !== a.relevance
      ? b.relevance - a.relevance
      : a.alternative.priceGBP - b.alternative.priceGBP,
  );
}
