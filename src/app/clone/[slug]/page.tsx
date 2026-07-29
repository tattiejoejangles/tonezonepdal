import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminTools } from "@/components/admin/AdminTools";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CloneRating } from "@/components/CloneRating";
import { MatchBadge } from "@/components/MatchBadge";
import { PedalDemos } from "@/components/PedalDemos";
import { PedalImage } from "@/components/PedalImage";
import { ProsCons } from "@/components/ProsCons";
import { RetailerButtons } from "@/components/RetailerButtons";
import { SavingsBadge } from "@/components/SavingsBadge";
import { ArtistChips, SpecList } from "@/components/SpecList";
import {
  getAllAlternatives,
  getAlternativeBySlug,
  getDetail,
} from "@/data/catalogue";
import { calculateSavings, formatPrice } from "@/lib/format";
import { gearNoun } from "@/lib/gear";

/** Regenerate every 5 minutes, so image URLs added in Supabase appear quickly. */
export const revalidate = 300;

export async function generateStaticParams() {
  const all = await getAllAlternatives();
  return all.map(({ alternative }) => ({ slug: alternative.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getAlternativeBySlug(slug);
  if (!found) return { title: "Not found" };

  const { alternative, original } = found;
  const saving = calculateSavings(original.priceGBP, alternative.priceGBP);

  return {
    title: `${alternative.name} - ${original.name} alternative`,
    description: `${alternative.name} at ${formatPrice(alternative.priceGBP)} - a budget alternative to the ${original.name}. Save ${formatPrice(saving.amount)} (${saving.percent}%). Honest pros and cons.`,
  };
}

export default async function ClonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getAlternativeBySlug(slug);

  if (!found) notFound();

  const { alternative, original } = found;
  const saving = calculateSavings(original.priceGBP, alternative.priceGBP);
  const detail = getDetail(alternative, original.artists ?? []);
  // A clone has no category of its own - it is whatever it copies.
  const noun = gearNoun(original.category);

  return (
    <div className="tz-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-xs">
        <Link
          href="/"
          className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
        >
          ← All gear
        </Link>
        <span className="text-stone-300">/</span>
        <Link
          href={`/pedal/${original.slug}`}
          className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
        >
          {original.name}
        </Link>
      </nav>

      {/* The cross-sell and verdict panels used to live in the middle lane,
          which ran ~540px tall against a 300px image and a 216px buy stack -
          i.e. roughly 550px of empty card across the two bottom corners. They
          are a full-width band below the hero now. */}
      <section className="tz-chamfer overflow-hidden bg-white tz-card ring-1 ring-stone-200/60">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,300px)_1fr] md:gap-10 lg:grid-cols-[minmax(0,320px)_1fr_minmax(0,17rem)] lg:gap-8">
          <div className="tz-well relative aspect-square self-start">
            <PedalImage
              src={alternative.imageUrl}
              name={alternative.name}
              brand={alternative.brand}
              priority
              sizes="(max-width: 768px) 100vw, 320px"
            />
            <span className="tz-eyebrow absolute top-3 left-3 rounded-full bg-amber-400 px-2.5 py-1 text-stone-900">
              Budget
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="tz-brand text-amber-700">{alternative.brand}</p>
              <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
                {alternative.name}
              </h1>
              <p className="tz-body mt-3 max-w-prose text-base text-stone-600">
                {alternative.blurb}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SavingsBadge saving={saving} comparedTo={original.name} />
              <MatchBadge match={alternative.matchQuality} />
            </div>

            <div className="border-t border-stone-100 pt-4">
              <CloneRating
                alternativeId={alternative.id}
                originalName={original.name}
              />
            </div>
          </div>

          {/* Full width at two columns, its own lane once there's room. */}
          <div className="tz-chamfer self-start border-t border-stone-100 bg-stone-50/80 p-5 md:col-span-2 lg:col-span-1 lg:border-t-0">
            <p className="tz-eyebrow text-stone-400">Buy this {noun}</p>

            <p className="tz-heading mt-2 text-3xl text-stone-900 tabular-nums">
              {formatPrice(alternative.priceGBP)}
            </p>
            <p className="text-xs text-stone-400">
              vs {formatPrice(original.priceGBP)} for the original
            </p>

            <div className="mt-4">
              <RetailerButtons pedal={alternative} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200/80 pt-4">
              <BookmarkButton kind="clone" slug={alternative.slug} />
              <AdminTools kind="alternative" slug={alternative.slug} />
            </div>

            <Link
              href={`/suggest?kind=alternative&slug=${alternative.slug}`}
              className="mt-3 block text-xs font-bold text-stone-500 underline underline-offset-4 transition-colors hover:text-amber-700"
            >
              Suggest a change
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* The "real deal" cross-sell - deliberately a different colour to the
            rest of the page so it reads as a distinct route out. */}
        <div className="tz-chamfer flex flex-col border border-indigo-200 bg-linear-to-br from-indigo-50 to-violet-50 p-5">
          <p className="tz-eyebrow text-indigo-700">Looking for the real deal?</p>
          <p className="tz-body mt-1.5 text-sm text-indigo-950">
            This is a budget alternative to the{" "}
            <span className="font-bold">{original.name}</span>, which sells for
            about {formatPrice(original.priceGBP)}.
          </p>
          <Link
            href={`/pedal/${original.slug}`}
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-linear-to-b from-indigo-600 to-indigo-800 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
          >
            See the original
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        </div>

        {detail.verdict && (
          <div className="tz-chamfer border border-amber-200 bg-amber-50/70 p-5">
            <p className="tz-eyebrow mb-1 text-amber-800">What players say</p>
            <p className="tz-body text-sm text-stone-700">{detail.verdict}</p>
          </div>
        )}
      </div>

      {/* Three panels on one row rather than one tall panel beside a stack of
          two: pros/cons, specs and players are siblings, and reading them as
          siblings is easier when their headings line up. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="tz-chamfer bg-white p-6 tz-card ring-1 ring-stone-200/60">
          <h2 className="tz-heading mb-4 text-xl text-stone-900">
            How it compares to the {original.name}
          </h2>
          <ProsCons pros={alternative.pros} cons={alternative.cons} />
        </section>

        <section className="tz-chamfer bg-white p-6 tz-card ring-1 ring-stone-200/60">
          <h2 className="tz-heading mb-4 text-xl text-stone-900">Specs</h2>
          {detail.specsKnown ? (
            <SpecList specs={detail.specs} />
          ) : (
            <p className="tz-body text-sm text-stone-500">Not confirmed yet.</p>
          )}
        </section>

        <section className="tz-chamfer bg-white p-6 tz-card ring-1 ring-stone-200/60">
          <h2 className="tz-heading mb-4 text-xl text-stone-900">Players</h2>
          {detail.artists.length > 0 ? (
            <>
              <p className="tz-body mb-3 text-sm text-stone-500">
                {detail.artistsAreForOriginal
                  ? `Associated with the ${original.name}, the circuit this copies.`
                  : `Known users of this ${noun}.`}
              </p>
              <ArtistChips
                artists={detail.artists}
                muted={detail.artistsAreForOriginal}
              />
            </>
          ) : (
            <p className="tz-body text-sm text-stone-500">None recorded yet.</p>
          )}
        </section>
      </div>

      <PedalDemos brand={alternative.brand} name={alternative.name} noun={noun} />
    </div>
  );
}
