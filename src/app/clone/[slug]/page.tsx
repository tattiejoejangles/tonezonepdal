import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PedalImage } from "@/components/PedalImage";
import { ProsCons } from "@/components/ProsCons";
import { RetailerButtons } from "@/components/RetailerButtons";
import { SavingsBadge } from "@/components/SavingsBadge";
import {
  getAllAlternatives,
  getAlternativeBySlug,
  getDetail,
} from "@/data/catalogue";
import { calculateSavings, formatPrice } from "@/lib/format";

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
  if (!found) return { title: "Pedal not found" };

  const { alternative, original } = found;
  const saving = calculateSavings(original.priceGBP, alternative.priceGBP);

  return {
    title: `${alternative.name} — ${original.name} alternative`,
    description: `${alternative.name} at ${formatPrice(alternative.priceGBP)} — a budget alternative to the ${original.name}. Save ${formatPrice(saving.amount)} (${saving.percent}%). Honest pros and cons.`,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-xs">
        <Link
          href="/"
          className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
        >
          ← All pedals
        </Link>
        <span className="text-stone-300">/</span>
        <Link
          href={`/pedal/${original.slug}`}
          className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
        >
          {original.name}
        </Link>
      </nav>

      <section className="tz-chamfer overflow-hidden bg-white shadow-sm ring-1 ring-stone-200/70">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,380px)_1fr] md:gap-10">
          <div className="relative aspect-square overflow-hidden bg-white ring-1 ring-stone-100">
            <PedalImage
              src={alternative.imageUrl}
              name={alternative.name}
              brand={alternative.brand}
              priority
              sizes="(max-width: 768px) 100vw, 380px"
            />
            <span className="tz-eyebrow absolute top-3 left-3 bg-amber-400 px-2.5 py-1 text-stone-900">
              Budget clone
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="tz-eyebrow text-amber-700">{alternative.brand}</p>
              <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
                {alternative.name}
              </h1>
              <p className="tz-body mt-3 text-base text-stone-600">{alternative.blurb}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="tz-heading text-3xl text-stone-900">
                {formatPrice(alternative.priceGBP)}
              </span>
              <SavingsBadge saving={saving} comparedTo={original.name} />
              <span className="bg-stone-100 px-3 py-1.5 text-[11px] font-bold text-stone-600">
                {alternative.matchQuality}% TONAL MATCH
              </span>
            </div>

            {/* The "real deal" cross-sell — deliberately a different colour to
                the rest of the page so it reads as a distinct route out. */}
            <div className="tz-chamfer border-2 border-indigo-300 bg-linear-to-br from-indigo-50 to-violet-50 p-4">
              <p className="tz-eyebrow text-indigo-700">Looking for the real deal?</p>
              <p className="tz-body mt-1.5 text-sm text-indigo-950">
                This is a budget alternative to the{" "}
                <span className="font-bold">{original.name}</span>, which sells for
                about {formatPrice(original.priceGBP)}.
              </p>
              <Link
                href={`/pedal/${original.slug}`}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-linear-to-b from-indigo-600 to-indigo-800 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
              >
                See the original
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>

            {detail.verdict && (
              <div className="border-l-2 border-amber-500 bg-amber-50/60 p-4">
                <p className="tz-eyebrow mb-1 text-amber-800">What players say</p>
                <p className="tz-body text-sm text-stone-700">{detail.verdict}</p>
              </div>
            )}

            <div className="mt-auto space-y-2 border-t border-stone-100 pt-5">
              <p className="tz-eyebrow text-stone-400">Buy this pedal</p>
              <RetailerButtons pedal={alternative} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="tz-chamfer bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
          <h2 className="tz-heading mb-4 text-xl text-stone-900">
            How it compares to the {original.name}
          </h2>
          <ProsCons pros={alternative.pros} cons={alternative.cons} />
        </section>

        <div className="space-y-6">
          <section className="tz-chamfer bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
            <h2 className="tz-heading mb-4 text-xl text-stone-900">Controls</h2>
            {detail.controlsKnown ? (
              <ul className="space-y-2.5">
                {detail.controls.map((control) => (
                  <li key={control.name} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 bg-stone-900 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                      {control.name}
                    </span>
                    <span className="tz-body text-sm text-stone-600">{control.what}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tz-body text-sm text-stone-500">
                We haven&apos;t confirmed this pedal&apos;s control layout yet, so
                rather than guess we&apos;re leaving it blank.
              </p>
            )}
          </section>

          <section className="tz-chamfer bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
            <h2 className="tz-heading mb-3 text-xl text-stone-900">Players</h2>
            {detail.artists.length > 0 ? (
              <>
                <p className="tz-body mb-3 text-sm text-stone-500">
                  {detail.artistsAreForOriginal
                    ? `No documented users of this clone specifically — these players are associated with the ${original.name}, the circuit it copies.`
                    : "Known users of this pedal."}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {detail.artists.map((artist) => (
                    <li
                      key={artist}
                      className={`px-3 py-1.5 text-xs font-bold ${
                        detail.artistsAreForOriginal
                          ? "bg-stone-100 text-stone-600"
                          : "bg-linear-to-br from-stone-800 to-stone-900 text-white"
                      }`}
                    >
                      {artist}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="tz-body text-sm text-stone-500">
                No artist associations recorded yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
