import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OriginalCard } from "@/components/OriginalCard";
import { getCatalogue } from "@/data/catalogue";
import { calculateSavings } from "@/lib/format";
import type { DirectoryResult } from "@/lib/filter";
import { GENRES, entriesInGenre, findGenre } from "@/lib/sections";

/** Regenerate every 5 minutes, in step with the pedal and clone pages. */
export const revalidate = 300;

export function generateStaticParams() {
  return GENRES.map((genre) => ({ genre: genre.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre: id } = await params;
  const genre = findGenre(id);

  if (!genre) return { title: "Not found" };

  return {
    title: `${genre.label} pedals`,
    description: `${genre.blurb} Every ${genre.label.toLowerCase()} pedal on The Tone Zone, with the cheapest alternative to each.`,
  };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre: id } = await params;
  const genre = findGenre(id);

  if (!genre) notFound();

  const catalogue = await getCatalogue();
  const entries = entriesInGenre(catalogue, genre);

  // Same shape the home page's genre bands build, so one card serves both.
  const results: DirectoryResult[] = entries.map((entry) => {
    const cheapest = entry.alternatives[0] ?? null;
    return {
      ...entry,
      cheapest,
      bestSaving: cheapest ? calculateSavings(entry.priceGBP, cheapest.priceGBP) : null,
      relevance: 0,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/"
          className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
        >
          ← All pedals
        </Link>
      </nav>

      <header className="mb-8 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Pedals</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
          {genre.label}
        </h1>
        <p className="tz-body mt-2.5 text-base text-stone-600">{genre.blurb}</p>
        <p className="tz-eyebrow mt-3 text-stone-400">
          {results.length} {results.length === 1 ? "pedal" : "pedals"}
        </p>
      </header>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result, index) => (
            <OriginalCard key={result.id} result={result} priority={index < 3} />
          ))}
        </div>
      ) : (
        <p className="tz-body text-sm text-stone-500">
          Nothing in this category yet.
        </p>
      )}
    </div>
  );
}
