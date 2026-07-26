import type { OriginalWithAlternatives } from "./types";

/**
 * A stripped-down catalogue for client-side search suggestions.
 *
 * The header search box lives in the root layout, so it is present on every
 * page and has no data of its own. Rather than fetch on each keystroke, the
 * server bundles this index into the page and hands it over as a prop.
 *
 * That only pays off because it is small: every field the suggestion dropdown
 * cannot render is dropped — descriptions, pros, cons, controls, artists,
 * galleries, verdicts. What remains is roughly 12KB across ~86 pedals, and it
 * sits inert until the user actually types a character.
 *
 * The searchable fields mirror exactly what `scoreOriginalFields` and
 * `scoreCloneFields` read in ./filter, so a suggestion ranks a pedal the same
 * way the full directory does.
 */

interface IndexedPedalBase {
  slug: string;
  name: string;
  brand: string;
  priceGBP: number;
  imageUrl: string | null;
}

export interface IndexedOriginal extends IndexedPedalBase {
  kind: "original";
  /** Search aliases — "ts9", "klon", "screamer". */
  tags: string[];
  /** Its clones' names, so "behringer" also surfaces the pedal they copy. */
  cloneNames: string[];
  cloneBrands: string[];
}

export interface IndexedClone extends IndexedPedalBase {
  kind: "clone";
  /** Alternate retail names. */
  aliases: string[];
  /** The original this copies, shown under the name in the dropdown. */
  originalName: string;
}

export type SearchIndexEntry = IndexedOriginal | IndexedClone;
export type SearchIndex = SearchIndexEntry[];

/** Flattens the catalogue into originals and clones, side by side. */
export function buildSearchIndex(catalogue: OriginalWithAlternatives[]): SearchIndex {
  const index: SearchIndex = [];

  for (const original of catalogue) {
    index.push({
      kind: "original",
      slug: original.slug,
      name: original.name,
      brand: original.brand,
      priceGBP: original.priceGBP,
      imageUrl: original.imageUrl,
      tags: original.tags,
      cloneNames: original.alternatives.map((alt) => alt.name),
      cloneBrands: original.alternatives.map((alt) => alt.brand),
    });

    for (const alt of original.alternatives) {
      index.push({
        kind: "clone",
        slug: alt.slug,
        name: alt.name,
        brand: alt.brand,
        priceGBP: alt.priceGBP,
        imageUrl: alt.imageUrl,
        aliases: alt.aliases ?? [],
        originalName: original.name,
      });
    }
  }

  return index;
}
