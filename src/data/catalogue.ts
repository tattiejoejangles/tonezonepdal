import { cache } from "react";

import type {
  Alternative,
  Category,
  Control,
  OriginalWithAlternatives,
  PedalDetail,
  Spec,
} from "@/lib/types";
import { resolveArtists, type ArtistIndex } from "@/lib/artists";
import type { ReviewSummary } from "@/lib/reviews";
import { buildSearchIndex, type SearchIndex } from "@/lib/search-index";
import { getSupabase } from "@/lib/supabase";

import { ALTERNATIVE_ARTISTS, VERDICTS } from "./details";
import { getReviewSummaries } from "./reviews";
import generatedDetails from "./details.generated.json";
import generatedImages from "./images.generated.json";
import { alternatives, originals } from "./pedals";

/**
 * The catalogue the UI renders.
 *
 * Supabase is the source of truth: it holds the same records plus the
 * `image_url` column you fill in by hand, so a pasted URL appears on the site
 * without a redeploy.
 *
 * If Supabase is unreachable or unconfigured we fall back to the copy bundled
 * in src/data. That means a database outage degrades the site to slightly
 * stale data rather than taking it down, and it keeps local development
 * working with no credentials.
 */

interface OriginalRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  price_gbp: number | string;
  blurb: string;
  description: string | null;
  image_url: string | null;
  auto_image_url: string | null;
  image_credit: string | null;
  tags: string[] | null;
  artists: string[] | null;
  aliases: string[] | null;
  popularity: number;
  search_query: string | null;
  controls: Control[] | null;
  specs: Spec[] | null;
}

interface AlternativeRow {
  id: string;
  slug: string;
  original_id: string;
  name: string;
  brand: string;
  price_gbp: number | string;
  blurb: string;
  image_url: string | null;
  auto_image_url: string | null;
  pros: string[] | null;
  cons: string[] | null;
  aliases: string[] | null;
  popularity: number;
  match_quality: number;
  search_query: string | null;
  verdict: string | null;
  gallery: string[] | null;
  controls: Control[] | null;
  specs: Spec[] | null;
  artists: string[] | null;
}

/**
 * A hand-entered URL always beats one the scraper found.
 *
 * Blank-checked rather than null-checked: `??` only falls through on null, so
 * an `image_url` saved as an empty string - which is what an untouched form
 * field or a cleared cell produces - would win over a perfectly good
 * `auto_image_url` and show the "photo needed" plate instead.
 */
const blankToNull = (value: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const pickImage = (row: { image_url: string | null; auto_image_url: string | null }) =>
  blankToNull(row.image_url) ?? blankToNull(row.auto_image_url);

const num = (value: number | string) =>
  typeof value === "number" ? value : Number.parseFloat(value);

/** One row of `alternative_originals`. */
interface PairingRow {
  alternative_id: string;
  original_id: string;
  position: number;
  match_quality: number | null;
}

/**
 * Reads the pairings table into two lookups.
 *
 * `byAlternative` drives the "copies" row on a clone page. `byOriginal` is what
 * lets a clone appear under every original it is an alternative to, not just
 * the one named in its `original_id` column.
 */
function indexPairings(rows: PairingRow[]) {
  const byAlternative = new Map<string, PairingRow[]>();
  const byOriginal = new Map<string, PairingRow[]>();

  for (const row of rows) {
    const forAlt = byAlternative.get(row.alternative_id) ?? [];
    forAlt.push(row);
    byAlternative.set(row.alternative_id, forAlt);

    const forOriginal = byOriginal.get(row.original_id) ?? [];
    forOriginal.push(row);
    byOriginal.set(row.original_id, forOriginal);
  }

  for (const list of byAlternative.values()) {
    list.sort((a, b) => a.position - b.position);
  }

  return { byAlternative, byOriginal };
}

function mapOriginal(
  row: OriginalRow,
  alts: AlternativeRow[],
  reviews: Map<string, ReviewSummary>,
  pairings: ReturnType<typeof indexPairings>,
  originalsById: Map<string, OriginalRow>,
): OriginalWithAlternatives {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    priceGBP: num(row.price_gbp),
    blurb: row.blurb,
    description: row.description ?? "",
    imageUrl: pickImage(row),
    imageCredit: row.image_credit ?? undefined,
    tags: row.tags ?? [],
    artists: row.artists ?? [],
    aliases: row.aliases ?? [],
    popularity: row.popularity,
    searchQuery: row.search_query ?? undefined,
    controls: row.controls ?? [],
    specs: row.specs ?? [],
    // Every clone paired with this original, not just the ones whose
    // `original_id` column names it. That is what makes a clone of two pedals
    // show up on both their pages rather than only the first.
    alternatives: (pairings.byOriginal.get(row.id) ?? [])
      .map((pairing) => {
        const alt = alts.find((candidate) => candidate.id === pairing.alternative_id);
        if (!alt) return null;
        return mapAlternative(
          alt,
          reviews.get(alt.id),
          pairings.byAlternative.get(alt.id) ?? [],
          originalsById,
          // The pairing's own match where it has one: the same box can be a
          // close copy of the pedal it was cloned from and a loose stand-in
          // for another, and one number cannot say both.
          pairing.match_quality ?? undefined,
        );
      })
      .filter((alt): alt is Alternative => alt !== null)
      .sort((a, b) => a.priceGBP - b.priceGBP),
  };
}

function mapAlternative(
  row: AlternativeRow,
  reviewSummary?: ReviewSummary,
  pairings: PairingRow[] = [],
  originalsById?: Map<string, OriginalRow>,
  matchOverride?: number,
): Alternative {
  const clonesOf = originalsById
    ? pairings
        .map((pairing) => {
          const original = originalsById.get(pairing.original_id);
          if (!original) return null;
          return {
            id: original.id,
            slug: original.slug,
            name: original.name,
            brand: original.brand,
            priceGBP: num(original.price_gbp),
            imageUrl: pickImage(original),
            category: original.category,
            matchQuality: pairing.match_quality ?? row.match_quality,
            primary: original.id === row.original_id,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : [];

  return {
    id: row.id,
    slug: row.slug,
    originalId: row.original_id,
    name: row.name,
    brand: row.brand,
    priceGBP: num(row.price_gbp),
    blurb: row.blurb,
    imageUrl: pickImage(row),
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    aliases: row.aliases ?? [],
    popularity: row.popularity,
    matchQuality: matchOverride ?? row.match_quality,
    clonesOf,
    reviewSummary,
    searchQuery: row.search_query ?? undefined,
    verdict: row.verdict ?? undefined,
    gallery: row.gallery ?? [],
    controls: row.controls ?? [],
    specs: row.specs ?? [],
    artists: row.artists ?? [],
  };
}

/** The bundled copy, used when Supabase can't be reached. */
function localCatalogue(): OriginalWithAlternatives[] {
  const images = generatedImages as Record<string, { url: string } | undefined>;
  const details = generatedDetails as Record<string, { images?: string[] } | undefined>;

  // Same hidden list as the Supabase path, so the fallback doesn't quietly
  // reintroduce a pedal the live site is deliberately not showing.
  return originals
    .filter((original) => !HIDDEN_SLUGS.has(original.slug))
    .map((original) => ({
      ...original,
      imageUrl: original.imageUrl ?? images[original.slug]?.url ?? null,
      alternatives: alternatives
        .filter((alt) => alt.originalId === original.id)
        .sort((a, b) => a.priceGBP - b.priceGBP)
        .map((alt) => ({
          ...alt,
          imageUrl: alt.imageUrl ?? images[alt.slug]?.url ?? null,
          verdict: VERDICTS[alt.slug],
          gallery: details[alt.slug]?.images ?? [],
          artists: ALTERNATIVE_ARTISTS[alt.slug] ?? [],
        })),
    }));
}

/**
 * Cached per request: the root layout, the page and `getOriginalBySlug` all
 * want the catalogue while rendering the same request, and without this each
 * one would hit Supabase separately.
 */
/**
 * Originals kept out of the site without deleting them.
 *
 * The Klon Centaur is an original-only collector's piece that changes hands for
 * thousands, which dragged the top of every price filter out to £3,500 and left
 * the slider's whole usable range squashed into the first two percent of its
 * travel. Hiding it is one line to undo, unlike a DELETE - the row and its
 * clones are still in Supabase, and the clones (Silver Horse, Golden Horse and
 * friends) can be re-pointed at another original if it stays hidden.
 */
const HIDDEN_SLUGS = new Set(["klon-centaur"]);

export const getCatalogue = cache(loadCatalogue);

async function loadCatalogue(): Promise<OriginalWithAlternatives[]> {
  const supabase = getSupabase();
  if (!supabase) return localCatalogue();

  try {
    // Reviews are fetched alongside rather than after: they resolve to an empty
    // map on any failure, so they can never be the reason the catalogue falls
    // back to the bundled copy.
    const [originalsResult, alternativesResult, pairingsResult, reviews] =
      await Promise.all([
        supabase.from("originals").select("*").order("popularity", { ascending: false }),
        supabase.from("alternatives").select("*"),
        supabase.from("alternative_originals").select("*"),
        getReviewSummaries(),
      ]);

    if (originalsResult.error) throw originalsResult.error;
    if (alternativesResult.error) throw alternativesResult.error;

    const rows = (originalsResult.data ?? []) as OriginalRow[];
    if (rows.length === 0) return localCatalogue();

    const alts = (alternativesResult.data ?? []) as AlternativeRow[];

    /**
     * Pairings, falling back to each clone's own `original_id`.
     *
     * The fallback matters: it means the whole feature degrades to exactly the
     * old single-original behaviour if 13-multi-original.sql hasn't been
     * applied, rather than every clone vanishing from every pedal page.
     */
    const pairingRows = pairingsResult.error
      ? alts.map((alt) => ({
          alternative_id: alt.id,
          original_id: alt.original_id,
          position: 0,
          match_quality: null,
        }))
      : ((pairingsResult.data ?? []) as PairingRow[]);

    if (pairingsResult.error) {
      console.error("[catalogue] pairings unavailable:", pairingsResult.error.message);
    }

    const pairings = indexPairings(pairingRows);
    const originalsById = new Map(rows.map((row) => [row.id, row]));

    return rows
      .filter((row) => !HIDDEN_SLUGS.has(row.slug))
      .map((row) => mapOriginal(row, alts, reviews, pairings, originalsById));
  } catch (error) {
    console.error("[catalogue] Supabase unavailable, using bundled data:", error);
    return localCatalogue();
  }
}

/**
 * The compact catalogue the header search box carries on every page.
 * See src/lib/search-index.ts for what it deliberately leaves out.
 */
export const getSearchIndex = cache(async function getSearchIndex(): Promise<SearchIndex> {
  return buildSearchIndex(await getCatalogue());
});

export async function getOriginalBySlug(
  slug: string,
): Promise<OriginalWithAlternatives | undefined> {
  const catalogue = await getCatalogue();
  return catalogue.find((entry) => entry.slug === slug);
}

/**
 * Everything the pedal modal and detail pages show.
 *
 * Specs come from the record itself and are only shown when present -
 * `specsKnown` lets the UI say "not confirmed yet" rather than print a
 * plausible-looking guess.
 *
 * Artists prefer the pedal's own documented users. Budget clones almost never
 * have any, so we fall back to the original's players and flag that with
 * `artistsAreForOriginal` so the UI can label it honestly instead of implying
 * Hendrix played a £29 Behringer.
 */
export function getDetail(
  pedal: {
    slug: string;
    imageUrl: string | null;
    verdict?: string;
    gallery?: string[];
    specs?: Spec[];
    artists?: string[];
  },
  originalArtists: string[],
  /**
   * Artist photo lookup, from `getArtistIndex()`.
   *
   * Optional so every existing caller keeps working: without it the artists
   * come back with no photos, which is precisely the old behaviour. Resolving
   * here rather than in each component means anything already handed a
   * `PedalDetail` - including the client-side dialog - gets the pictures with
   * no extra prop threading.
   */
  artistIndex?: ArtistIndex,
): PedalDetail {
  const gallery = [pedal.imageUrl, ...(pedal.gallery ?? [])].filter(
    (url): url is string => Boolean(url),
  );

  const own = pedal.artists ?? [];
  const specs = pedal.specs ?? [];
  const names = own.length > 0 ? own : originalArtists;

  return {
    specs,
    specsKnown: specs.length > 0,
    artists: resolveArtists(names, artistIndex ?? new Map()),
    artistsAreForOriginal: own.length === 0,
    images: [...new Set(gallery)],
    verdict: pedal.verdict ?? VERDICTS[pedal.slug],
  };
}

/** A clone plus the original it copies, for the clone's own page. */
export interface AlternativeWithOriginal {
  alternative: Alternative;
  original: OriginalWithAlternatives;
}

/**
 * A clone and the original its own page leads with.
 *
 * Prefers the primary pairing. A clone now appears under every original it is
 * an alternative to, so without this it would be paired with whichever of them
 * happened to sort first by popularity - and the clone's page would open
 * comparing it to the wrong pedal, with the wrong saving.
 */
export async function getAlternativeBySlug(
  slug: string,
): Promise<AlternativeWithOriginal | undefined> {
  const catalogue = await getCatalogue();
  let fallback: AlternativeWithOriginal | undefined;

  for (const original of catalogue) {
    const alternative = original.alternatives.find((alt) => alt.slug === slug);
    if (!alternative) continue;
    if (alternative.originalId === original.id) return { alternative, original };
    fallback ??= { alternative, original };
  }

  return fallback;
}

/**
 * Every clone, once, for search and static params.
 *
 * Deduplicated on slug: a clone paired with three originals appears three times
 * in the catalogue tree, and feeding those duplicates to `generateStaticParams`
 * would ask Next to build the same route repeatedly. Each keeps its primary
 * original, by the same rule as `getAlternativeBySlug`.
 */
export async function getAllAlternatives(): Promise<AlternativeWithOriginal[]> {
  const catalogue = await getCatalogue();
  const bySlug = new Map<string, AlternativeWithOriginal>();

  for (const original of catalogue) {
    for (const alternative of original.alternatives) {
      const existing = bySlug.get(alternative.slug);
      // Primary wins; otherwise first seen.
      if (existing && existing.alternative.originalId === existing.original.id) {
        continue;
      }
      bySlug.set(alternative.slug, { alternative, original });
    }
  }

  return [...bySlug.values()];
}
