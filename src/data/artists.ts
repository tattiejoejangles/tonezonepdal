import { cache } from "react";

import { buildArtistIndex, type Artist, type ArtistIndex } from "@/lib/artists";
import { getSupabase } from "@/lib/supabase";

interface ArtistRow {
  match_key: string;
  name: string;
  aliases: string[] | null;
  image_url: string | null;
  image_credit: string | null;
  known_for: string | null;
}

/**
 * The artist lookup, cached per request.
 *
 * Returns an empty index if the table doesn't exist yet or Supabase is
 * unreachable, and that is a deliberate no-op rather than an error: every
 * "Played by" section then renders exactly what it rendered before - names
 * without photos - instead of the page failing. So this can ship before
 * 08-artists.sql is applied.
 */
export const getArtistIndex = cache(async function getArtistIndex(): Promise<ArtistIndex> {
  const supabase = getSupabase();
  if (!supabase) return new Map();

  try {
    const { data, error } = await supabase
      .from("artists")
      .select("match_key, name, aliases, image_url, image_credit, known_for");

    if (error) {
      // Most likely the migration hasn't been run. Logged once per render, not
      // surfaced to visitors.
      console.error("[artists] lookup unavailable:", error.message);
      return new Map();
    }

    const artists: Artist[] = ((data ?? []) as ArtistRow[]).map((row) => ({
      matchKey: row.match_key,
      name: row.name,
      aliases: row.aliases ?? [],
      imageUrl: row.image_url,
      imageCredit: row.image_credit,
      knownFor: row.known_for,
    }));

    return buildArtistIndex(artists);
  } catch (error) {
    console.error("[artists] lookup errored:", error);
    return new Map();
  }
});
