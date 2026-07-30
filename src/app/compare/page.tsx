import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ComparePicker, type PickerOption } from "@/components/ComparePicker";
import { CompareTable } from "@/components/CompareTable";
import { getCatalogue } from "@/data/catalogue";
import { comparablesInCategories, findComparable } from "@/lib/compare";
import { AMP_GENRES, GENRES } from "@/lib/sections";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}): Promise<Metadata> {
  const { a, b } = await searchParams;
  const catalogue = await getCatalogue();
  const left = a ? findComparable(catalogue, a) : undefined;
  const right = b ? findComparable(catalogue, b) : undefined;

  if (left && right) {
    return {
      title: `${left.name} vs ${right.name}`,
      description: `Side by side: ${left.name} against ${right.name} - price, specs, pros and cons, and how close each gets.`,
    };
  }

  return {
    title: left ? `Compare the ${left.name}` : "Compare",
    description: "Put two pedals or amps side by side, spec for spec.",
  };
}

/**
 * Head to head.
 *
 * Scoped to one genre, because that's the only comparison that means anything:
 * a fuzz against a delay has no shared axis. The genre comes from whatever is
 * in `?a=`, and every other item in it - originals and clones together - is
 * offered as the right-hand side.
 *
 * Both sides live in the URL so a pairing is shareable and the back button
 * steps through the ones you looked at.
 */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  if (!a) notFound();

  const catalogue = await getCatalogue();
  const left = findComparable(catalogue, a);
  if (!left) notFound();

  const genre =
    [...GENRES, ...AMP_GENRES].find((entry) =>
      entry.categories.includes(left.category),
    ) ?? GENRES[0];

  const everything = comparablesInCategories(catalogue, genre.categories);
  const others = everything.filter((item) => item.slug !== left.slug);

  // An unknown or out-of-genre `?b=` falls back to the picker rather than
  // 404ing - the left-hand side is still useful on its own.
  const right =
    b && b !== left.slug
      ? others.find((item) => item.slug === b)
      : undefined;

  const options: PickerOption[] = others.map((item) => ({
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    priceGBP: item.priceGBP,
    imageUrl: item.imageUrl,
    kind: item.kind,
    matchQuality: item.matchQuality,
  }));

  return (
    <div className="tz-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-xs">
        <Link
          href={left.href}
          className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
        >
          ← {left.name}
        </Link>
        <span className="text-stone-300">/</span>
        <Link
          href={`/pedals/${genre.id}`}
          className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
        >
          {genre.label}
        </Link>
      </nav>

      <header className="mb-8 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Head to head</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
          {right ? `${left.name} vs ${right.name}` : `Compare the ${left.name}`}
        </h1>
        <p className="tz-body mt-2 max-w-prose text-base text-stone-600">
          {right
            ? `Every spec both of them list, side by side. Rows that differ are highlighted.`
            : `Pick anything else in ${genre.label} to put beside it.`}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-8">
        <div className="min-w-0">
          {right ? (
            <CompareTable left={left} right={right} />
          ) : (
            <div className="tz-chamfer bg-white/70 px-6 py-16 text-center ring-1 ring-stone-200">
              <p className="text-lg font-bold text-stone-800">
                Choose something to compare
              </p>
              <p className="tz-body mx-auto mt-2 max-w-md text-sm text-stone-500">
                {options.length > 0
                  ? `There are ${options.length} other ${genre.label.toLowerCase()} entries to put beside the ${left.name}.`
                  : `Nothing else in ${genre.label} yet.`}
              </p>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ComparePicker
            leftSlug={left.slug}
            options={options}
            selectedSlug={right?.slug ?? null}
            genreLabel={genre.label}
          />
        </div>
      </div>
    </div>
  );
}
