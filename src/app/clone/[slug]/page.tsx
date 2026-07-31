import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminTools } from "@/components/admin/AdminTools";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ClonesOf, type ClonedOriginalView } from "@/components/ClonesOf";
import { CloneReviews } from "@/components/CloneReviews";
import { MatchBadge } from "@/components/MatchBadge";
import { PedalDemos } from "@/components/PedalDemos";
import { PedalImage } from "@/components/PedalImage";
import { ProsCons } from "@/components/ProsCons";
import { RetailerButtons } from "@/components/RetailerButtons";
import { SavingsBadge } from "@/components/SavingsBadge";
import { ArtistChips, SpecList } from "@/components/SpecList";
import { getArtistIndex } from "@/data/artists";
import {
  getAllAlternatives,
  getAlternativeBySlug,
  getCatalogue,
  getDetail,
} from "@/data/catalogue";
import { getApprovedReviews } from "@/data/reviews";
import { calculateSavings, formatPrice } from "@/lib/format";
import { gearNoun } from "@/lib/gear";
import { displayMatch } from "@/lib/reviews";

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
  const artistIndex = await getArtistIndex();
  const detail = getDetail(alternative, original.artists ?? [], artistIndex);
  // A clone has no category of its own - it is whatever it copies.
  const noun = gearNoun(original.category);

  // The badge shows our rating blended with approved reviews; the reviews
  // section is handed both numbers so it can explain any gap between them.
  const summary = alternative.reviewSummary ?? null;
  const effective = displayMatch(alternative);
  const reviews = await getApprovedReviews(alternative.id);

  // Every original this clone stands in for, with the detail each popup needs
  // resolved here so opening one costs no round trip. Falls back to the single
  // original when the pairings table is empty, so the row never disappears.
  const catalogue = await getCatalogue();
  const pairings =
    alternative.clonesOf && alternative.clonesOf.length > 0
      ? alternative.clonesOf
      : [
          {
            id: original.id,
            slug: original.slug,
            name: original.name,
            brand: original.brand,
            priceGBP: original.priceGBP,
            imageUrl: original.imageUrl,
            category: original.category,
            matchQuality: alternative.matchQuality,
            primary: true,
          },
        ];

  const clonedOriginals: ClonedOriginalView[] = pairings.map((entry) => {
    const full = catalogue.find((candidate) => candidate.id === entry.id);
    return {
      original: entry,
      detail: getDetail(full ?? { slug: entry.slug, imageUrl: entry.imageUrl }, [], artistIndex),
      description: full?.description ?? "",
      blurb: full?.blurb ?? "",
    };
  });

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
            <span className="tz-ribbon tz-ribbon--green top-[10%]">Budget</span>
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
              <MatchBadge match={effective} />
            </div>

            {/* The community score in one line, linking down to the section
                that holds the detail and the form. The star widget that used to
                sit here duplicated everything below it. */}
            <div className="border-t border-stone-100 pt-4">
              {summary && summary.votes > 0 && summary.average != null ? (
                <a
                  href="#reviews"
                  className="tz-body group inline-flex flex-wrap items-baseline gap-x-2 text-sm text-stone-600"
                >
                  <span className="font-bold text-stone-900 tabular-nums">
                    {summary.average.toFixed(1)}/5
                  </span>
                  <span>
                    from {summary.votes}{" "}
                    {summary.votes === 1 ? "player" : "players"}
                  </span>
                  <span className="font-bold text-amber-700 underline decoration-amber-500 decoration-2 underline-offset-4 group-hover:text-amber-900">
                    Read the reviews
                  </span>
                </a>
              ) : (
                <a
                  href="#reviews"
                  className="tz-body text-sm text-stone-600"
                >
                  No reviews yet.{" "}
                  <span className="font-bold text-amber-700 underline decoration-amber-500 decoration-2 underline-offset-4 hover:text-amber-900">
                    Be the first
                  </span>
                </a>
              )}
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

            {/* Save and Compare are one stack of equal-width buttons; the admin
                Edit link stays its own size because only one person sees it. */}
            <div className="mt-4 border-t border-stone-200/80 pt-4">
              <BookmarkButton kind="clone" slug={alternative.slug} full />
            </div>

            <Link
              href={`/compare?a=${alternative.slug}`}
              className="tz-btn mt-3 flex w-full items-center justify-center gap-2 bg-white px-5 py-2.5 text-xs tracking-wider text-stone-700 uppercase ring-1 ring-stone-300 hover:text-stone-900"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M8 7H3m0 0 3-3M3 7l3 3M16 17h5m0 0-3 3m3-3-3-3" />
              </svg>
              Compare
            </Link>

            <Link
              href={`/suggest?kind=alternative&slug=${alternative.slug}`}
              className="mt-3 block text-xs font-bold text-stone-500 underline underline-offset-4 transition-colors hover:text-amber-700"
            >
              Suggest a change
            </Link>

            <AdminTools kind="alternative" slug={alternative.slug} />
          </div>
        </div>

        {/* Our verdict and the cross-sell, as a band inside the hero rather
            than two cards floating under it. They were a separate row of boxes
            that read as unrelated to the product above them, and left the hero
            card ending abruptly on a thin strip of white. Inside the same card
            they read as part of the pitch, which is what they are - and the two
            of them fill the width the hero already occupies. Tinted panels
            rather than bordered cards, because a card inside a card is one
            frame too many. */}
        <div className="grid gap-px border-t border-stone-200/70 bg-stone-200/70 sm:grid-cols-2">
          {detail.verdict && (
            <div className="bg-amber-50/80 p-6 sm:p-7">
              {/* "Our verdict", not "What players say" - that heading belongs to
                  the community review section further down, and having both on
                  one page read the same made our editorial line look like a
                  quote from a reviewer. */}
              <p className="tz-eyebrow mb-1.5 text-amber-800">Our verdict</p>
              <p className="tz-body text-sm text-stone-700">{detail.verdict}</p>
            </div>
          )}

          {/* The cross-sell now leads with the original's photo rather than
              just naming it - you recognise a Tube Screamer on sight long
              before you read the words - and opens the same detail popup the
              row below uses, so "more info" and "go to pedal" are two steps
              rather than one blind jump onto another product page. */}
          <div
            className={`flex flex-col bg-indigo-50 p-6 sm:p-7 ${
              // Spans both columns when there is no verdict beside it, so the
              // band never ends on a half-width panel.
              detail.verdict ? "" : "sm:col-span-2"
            }`}
          >
            <p className="tz-eyebrow text-indigo-700">Looking for the real deal?</p>

            <div className="mt-3 flex items-center gap-4">
              <div className="tz-well relative h-20 w-20 shrink-0 rounded bg-white">
                <PedalImage
                  src={original.imageUrl}
                  name={original.name}
                  brand={original.brand}
                  sizes="80px"
                />
              </div>

              <p className="tz-body min-w-0 text-sm text-indigo-950">
                This is a budget alternative to the{" "}
                <span className="font-bold">{original.name}</span>, which sells
                for about {formatPrice(original.priceGBP)}.
              </p>
            </div>

            <Link
              href={`/pedal/${original.slug}`}
              className="tz-btn mt-4 w-fit bg-indigo-700 px-5 py-2.5 text-sm text-white"
            >
              See the original
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <ClonesOf items={clonedOriginals} clonePrice={alternative.priceGBP} />

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

      {/* Scroll target for the score line in the hero. */}
      <div id="reviews" className="scroll-mt-24" />
      <CloneReviews
        alternativeId={alternative.id}
        originalName={original.name}
        noun={noun}
        summary={summary}
        reviews={reviews}
        editorialMatch={alternative.matchQuality}
        effective={effective}
      />

      <PedalDemos brand={alternative.brand} name={alternative.name} noun={noun} />
    </div>
  );
}
