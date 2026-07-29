import { OriginalCard } from "./OriginalCard";
import { calculateSavings } from "@/lib/format";
import type { DirectoryResult } from "@/lib/filter";
import { genreNoun, type GenreGroup } from "@/lib/sections";

/**
 * One genre band on the home page. Originals are turned into DirectoryResults
 * here so the same card component serves both the genre view and search
 * results, rather than maintaining two near-identical cards.
 */
/**
 * Renders every genre band.
 *
 * The map lives in here rather than in the page because this whole tree is
 * passed to a client component as a prop, and an array built at that call site
 * loses its keys when React serialises it across the boundary.
 */
export function GenreSections({ groups }: { groups: GenreGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <GenreSection key={group.genre.id} group={group} />
      ))}
    </>
  );
}

export function GenreSection({ group }: { group: GenreGroup }) {
  const results: DirectoryResult[] = group.entries.map((entry) => {
    const cheapest = entry.alternatives[0] ?? null;
    return {
      ...entry,
      cheapest,
      bestSaving: cheapest ? calculateSavings(entry.priceGBP, cheapest.priceGBP) : null,
      relevance: 0,
    };
  });

  return (
    <section aria-labelledby={`genre-${group.genre.id}`}>
      <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-stone-900/10 pb-3">
        <div>
          <h2 id={`genre-${group.genre.id}`} className="tz-heading text-xl text-stone-900">
            {group.genre.label}
          </h2>
          <p className="tz-body mt-0.5 text-sm text-stone-500">{group.genre.blurb}</p>
        </div>
        <span className="tz-eyebrow shrink-0 text-stone-400">
          {results.length} {genreNoun(group.genre, results.length)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((result) => (
          <OriginalCard key={result.id} result={result} />
        ))}
      </div>
    </section>
  );
}
