/**
 * Artist name matching.
 *
 * Pedals store artists as free text - that's how the data already is, and
 * changing it would mean editing every row and every admin form. So the join
 * happens on a normalised key instead: strip accents, lowercase, collapse
 * everything non-alphanumeric to a hyphen. "Noel Gallagher", "noel gallagher"
 * and "NOEL  GALLAGHER" all land on `noel-gallagher`.
 *
 * Deliberately exact-after-normalising rather than fuzzy. Matching loose enough
 * to catch a misspelling is also loose enough to put the wrong face on a pedal,
 * and a wrong face is worse than no face. Misspellings go in the `aliases`
 * column instead, which is an explicit decision rather than a guess.
 */

export interface Artist {
  matchKey: string;
  name: string;
  /** Alternate spellings that resolve to this artist. */
  aliases: string[];
  imageUrl: string | null;
  imageCredit: string | null;
  knownFor: string | null;
}

/** An artist named on a pedal, resolved against the artists table. */
export interface ResolvedArtist {
  /** The name as stored on the pedal - that's what gets displayed. */
  name: string;
  imageUrl: string | null;
  imageCredit: string | null;
  knownFor: string | null;
}

export function artistKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    // Combining diacritical marks, so "Ólafur" keys the same as "Olafur".
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lookup keyed by `artistKey`, including every alias. */
export type ArtistIndex = Map<string, Artist>;

export function buildArtistIndex(artists: Artist[]): ArtistIndex {
  const index: ArtistIndex = new Map();

  // Canonical keys first, so an alias can never shadow a real artist.
  for (const artist of artists) index.set(artist.matchKey, artist);

  for (const artist of artists) {
    for (const alias of artist.aliases) {
      const key = artistKey(alias);
      if (!index.has(key)) index.set(key, artist);
    }
  }

  return index;
}

/**
 * Resolves the names stored on a pedal to artist records.
 *
 * Unmatched names still come back, with no photo: a name we have no picture for
 * is still a true and useful fact about the pedal.
 */
export function resolveArtists(
  names: readonly string[],
  index: ArtistIndex,
): ResolvedArtist[] {
  return names.map((name) => {
    const found = index.get(artistKey(name));
    return {
      name,
      imageUrl: found?.imageUrl ?? null,
      imageCredit: found?.imageCredit ?? null,
      knownFor: found?.knownFor ?? null,
    };
  });
}
