import { cache } from "react";

import type {
  Alternative,
  Category,
  Control,
  OriginalWithAlternatives,
  PedalDetail,
  Spec,
} from "@/lib/types";
import { buildSearchIndex, type SearchIndex } from "@/lib/search-index";
import { getSupabase } from "@/lib/supabase";

import { ALTERNATIVE_ARTISTS, VERDICTS } from "./details";
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

function mapOriginal(row: OriginalRow, alts: AlternativeRow[]): OriginalWithAlternatives {
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
    alternatives: alts
      .filter((alt) => alt.original_id === row.id)
      .map(mapAlternative)
      .sort((a, b) => a.priceGBP - b.priceGBP),
  };
}

function mapAlternative(row: AlternativeRow): Alternative {
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
    matchQuality: row.match_quality,
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

  return originals.map((original) => ({
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
export const getCatalogue = cache(loadCatalogue);

async function loadCatalogue(): Promise<OriginalWithAlternatives[]> {
  const supabase = getSupabase();
  if (!supabase) return localCatalogue();

  try {
    const [originalsResult, alternativesResult] = await Promise.all([
      supabase.from("originals").select("*").order("popularity", { ascending: false }),
      supabase.from("alternatives").select("*"),
    ]);

    if (originalsResult.error) throw originalsResult.error;
    if (alternativesResult.error) throw alternativesResult.error;

    const rows = (originalsResult.data ?? []) as OriginalRow[];
    if (rows.length === 0) return localCatalogue();

    const alts = (alternativesResult.data ?? []) as AlternativeRow[];
    return rows.map((row) => mapOriginal(row, alts));
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
): PedalDetail {
  const gallery = [pedal.imageUrl, ...(pedal.gallery ?? [])].filter(
    (url): url is string => Boolean(url),
  );

  const own = pedal.artists ?? [];
  const specs = pedal.specs ?? [];

  return {
    specs,
    specsKnown: specs.length > 0,
    artists: own.length > 0 ? own : originalArtists,
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

export async function getAlternativeBySlug(
  slug: string,
): Promise<AlternativeWithOriginal | undefined> {
  const catalogue = await getCatalogue();
  for (const original of catalogue) {
    const alternative = original.alternatives.find((alt) => alt.slug === slug);
    if (alternative) return { alternative, original };
  }
  return undefined;
}

/** Every clone, flattened, for search and static params. */
export async function getAllAlternatives(): Promise<AlternativeWithOriginal[]> {
  const catalogue = await getCatalogue();
  return catalogue.flatMap((original) =>
    original.alternatives.map((alternative) => ({ alternative, original })),
  );
}
