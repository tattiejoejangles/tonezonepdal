import type { Alternative, OriginalWithAlternatives } from "./types";
import type { SearchIndex } from "./search-index";
import { calculateSavings, type Savings } from "./format";

/**
 * Pure search / filter / sort logic for the directory.
 *
 * Deliberately free of React and the DOM so it can be reasoned about and
 * tested on its own - the page component just calls `filterCatalogue` from a
 * useMemo and renders whatever comes back.
 */

export type SortId = "match" | "price-asc" | "price-desc" | "popular";

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "match", label: "Closest Match" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "popular", label: "Most Popular" },
];

/** Inclusive price window in GBP. Null on either end means "no bound". */
export interface PriceRange {
  min: number | null;
  max: number | null;
}

export const UNBOUNDED: PriceRange = { min: null, max: null };

export function isBounded(range: PriceRange): boolean {
  return range.min !== null || range.max !== null;
}

function withinRange(price: number, range: PriceRange): boolean {
  if (range.min !== null && price < range.min) return false;
  if (range.max !== null && price > range.max) return false;
  return true;
}

/**
 * Cheapest and dearest thing in the catalogue, originals and clones together.
 *
 * The slider's track is built from this rather than from a hardcoded 0-500, so
 * the handles always span real data and adding a £2,000 amp moves the ceiling
 * instead of putting it out of reach.
 */
export function priceBounds(catalogue: OriginalWithAlternatives[]): {
  min: number;
  max: number;
} {
  let min = Infinity;
  let max = 0;

  for (const entry of catalogue) {
    min = Math.min(min, entry.priceGBP);
    max = Math.max(max, entry.priceGBP);
    for (const alt of entry.alternatives) {
      min = Math.min(min, alt.priceGBP);
      max = Math.max(max, alt.priceGBP);
    }
  }

  if (!Number.isFinite(min)) return { min: 0, max: 0 };
  // Rounded outwards to tens so the handles land on tidy numbers.
  return { min: Math.floor(min / 10) * 10, max: Math.ceil(max / 10) * 10 };
}

export interface DirectoryOptions {
  query: string;
  /** Price window. Applied to an original's own price, or a clone's own. */
  price?: PriceRange;
  /**
   * Exact brand name, or null for all. Matches an original's own brand and a
   * clone's own brand - so "Boss" returns Boss originals and "Behringer"
   * returns Behringer clones, rather than one implying the other.
   */
  brand?: string | null;
  /**
   * Optional: the home page doesn't offer sorting (it's organised by genre),
   * so it falls back to cheapest-first. Sorting lives on the detail page,
   * where it reorders a single pedal's clones.
   */
  sort?: SortId;
}

/** A brand and how many pedals carry it, for the directory's brand picker. */
export interface BrandOption {
  brand: string;
  count: number;
}

/**
 * Every brand in the catalogue, most pedals first.
 *
 * Deliberately mixes the expensive makers with the budget ones. They're the
 * same question from the shopper's side - "show me the Boss pedals" and "show
 * me what Behringer do" are both just a brand.
 */
export function brandOptions(catalogue: OriginalWithAlternatives[]): BrandOption[] {
  const counts = new Map<string, number>();
  const bump = (brand: string) => counts.set(brand, (counts.get(brand) ?? 0) + 1);

  for (const entry of catalogue) {
    bump(entry.brand);
    for (const alt of entry.alternatives) bump(alt.brand);
  }

  return [...counts.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.brand.localeCompare(b.brand)));
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

/**
 * The searchable text of an original.
 *
 * Taken as loose fields rather than a whole `Original` so the same scoring
 * serves both the full catalogue and the compact client search index, which
 * carries these fields and nothing else.
 */
export interface OriginalFields {
  name: string;
  brand: string;
  tags: string[];
  cloneNames: string[];
  cloneBrands: string[];
}

/**
 * Relevance score for one original against a normalized query.
 * Returns 0 when it doesn't match at all.
 */
export function scoreOriginalFields(
  fields: OriginalFields,
  normalizedQuery: string,
): number {
  if (!normalizedQuery) return 0;

  const name = normalize(fields.name);
  const brand = normalize(fields.brand);
  const tags = fields.tags.map(normalize);
  const altNames = fields.cloneNames.map(normalize);
  const altBrands = fields.cloneBrands.map(normalize);

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

/** The searchable text of a clone. See `OriginalFields` for why it's loose. */
export interface CloneFields {
  name: string;
  brand: string;
  aliases: string[];
}

/**
 * Relevance score for one clone against a normalized query.
 * Returns 0 when it doesn't match at all.
 */
export function scoreCloneFields(fields: CloneFields, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const name = normalize(fields.name);
  const brand = normalize(fields.brand);
  const haystack = [name, brand, ...fields.aliases.map(normalize)].join(" ");
  const terms = normalizedQuery.split(" ").filter(Boolean);

  if (!terms.every((term) => haystack.includes(term))) return 0;

  let score = 1;
  if (name.includes(normalizedQuery)) score += 100;
  if (name.startsWith(normalizedQuery)) score += 60;
  if (brand.includes(normalizedQuery)) score += 25;

  return score;
}

/** Relevance score for one original from the full catalogue. */
export function scoreEntry(entry: OriginalWithAlternatives, normalizedQuery: string): number {
  return scoreOriginalFields(
    {
      name: entry.name,
      brand: entry.brand,
      tags: entry.tags,
      cloneNames: entry.alternatives.map((alt) => alt.name),
      cloneBrands: entry.alternatives.map((alt) => alt.brand),
    },
    normalizedQuery,
  );
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
 * Filters and sorts the catalogue's originals.
 *
 * The brand filter tests the original's own brand. Picking a budget maker like
 * Behringer therefore returns nothing here - correctly, since Behringer don't
 * make any of these originals - and the clones surface through
 * `filterAlternatives` instead.
 */
export function filterCatalogue(
  catalogue: OriginalWithAlternatives[],
  { query, brand = null, sort = "price-asc", price = UNBOUNDED }: DirectoryOptions,
): DirectoryResult[] {
  const normalizedQuery = normalize(query);

  const results: DirectoryResult[] = [];

  for (const entry of catalogue) {
    if (brand && entry.brand !== brand) continue;
    if (!withinRange(entry.priceGBP, price)) continue;

    const relevance = scoreEntry(entry, normalizedQuery);
    if (normalizedQuery && relevance === 0) continue;

    if (entry.alternatives.length === 0) continue;

    const ordered = sortAlternatives(entry.alternatives, sort);
    const cheapest = entry.alternatives.reduce((lowest, alt) =>
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
  { query, brand = null, price = UNBOUNDED }: Omit<DirectoryOptions, "sort">,
  /** Browse mode lists every clone even with nothing typed. */
  listWhenIdle = false,
): CloneResult[] {
  const normalizedQuery = normalize(query);

  // Idle directory: no query, brand or price band means nothing to list here.
  if (!normalizedQuery && !brand && !isBounded(price) && !listWhenIdle) return [];

  const results: CloneResult[] = [];

  for (const original of catalogue) {
    for (const alternative of original.alternatives) {
      if (brand && alternative.brand !== brand) continue;
      if (!withinRange(alternative.priceGBP, price)) continue;

      const relevance = scoreCloneFields(
        {
          name: alternative.name,
          brand: alternative.brand,
          aliases: alternative.aliases ?? [],
        },
        normalizedQuery,
      );
      // Scoring only rejects on a query. Brand-only browsing has no query to
      // score against, so every clone of that brand belongs in the results.
      if (normalizedQuery && relevance === 0) continue;

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

/** One row in the search box's suggestion dropdown. */
export interface Suggestion {
  kind: "original" | "clone";
  /** Where the row navigates to. */
  href: string;
  name: string;
  brand: string;
  priceGBP: number;
  imageUrl: string | null;
  /** Clones only: the original this copies. */
  originalName?: string;
  relevance: number;
}

/**
 * Pedals to offer as you type, originals and clones ranked together.
 *
 * Both halves are scored by the same functions the directory uses, so a
 * suggestion and an on-page result agree about what "behr" means. Ranking them
 * in one list rather than two fixed blocks is what makes that query behave:
 * the Behringer clones match on brand and outrank the pedals they copy, which
 * only match indirectly.
 *
 * Returns nothing for an empty query. That is deliberate and load-bearing -
 * the dropdown must stay shut until a character is typed.
 */
export function searchSuggestions(
  index: SearchIndex,
  query: string,
  limit = 8,
): Suggestion[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const matches: Suggestion[] = [];

  for (const entry of index) {
    const relevance =
      entry.kind === "original"
        ? scoreOriginalFields(entry, normalizedQuery)
        : scoreCloneFields(entry, normalizedQuery);

    if (relevance === 0) continue;

    matches.push({
      kind: entry.kind,
      href:
        entry.kind === "original" ? `/pedal/${entry.slug}` : `/clone/${entry.slug}`,
      name: entry.name,
      brand: entry.brand,
      priceGBP: entry.priceGBP,
      imageUrl: entry.imageUrl,
      originalName: entry.kind === "clone" ? entry.originalName : undefined,
      relevance,
    });
  }

  // Cheapest first among equally relevant pedals - this is a budget site.
  return matches
    .sort((a, b) =>
      b.relevance !== a.relevance ? b.relevance - a.relevance : a.priceGBP - b.priceGBP,
    )
    .slice(0, limit);
}
