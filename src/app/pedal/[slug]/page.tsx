import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminTools } from "@/components/admin/AdminTools";
import { AlternativesPanel } from "@/components/AlternativesPanel";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CheapestAlternative } from "@/components/CheapestAlternative";
import { PedalDemos } from "@/components/PedalDemos";
import { PedalImage } from "@/components/PedalImage";
import { RetailerButtons } from "@/components/RetailerButtons";
import { ArtistChips, SpecList } from "@/components/SpecList";
import { getCatalogue, getDetail, getOriginalBySlug } from "@/data/catalogue";
import { calculateSavings, formatPrice } from "@/lib/format";
import { gearNoun } from "@/lib/gear";

/**
 * Regenerate every 5 minutes so an image URL pasted into Supabase appears on
 * the live site without a redeploy.
 */
export const revalidate = 300;

export async function generateStaticParams() {
  const catalogue = await getCatalogue();
  return catalogue.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pedal = await getOriginalBySlug(slug);

  if (!pedal) return { title: "Not found" };

  const cheapest = pedal.alternatives[0];
  const saving = cheapest ? calculateSavings(pedal.priceGBP, cheapest.priceGBP) : null;

  return {
    title: `${pedal.name} - cheap alternatives`,
    description: saving
      ? `${pedal.alternatives.length} budget alternatives to the ${pedal.name}, from ${formatPrice(cheapest.priceGBP)} - save up to ${formatPrice(saving.amount)} (${saving.percent}%).`
      : `Budget alternatives to the ${pedal.name}.`,
  };
}

/**
 * Credits Wikimedia Commons photos, which are CC-licensed and require
 * attribution. Retailer photos get no credit line - they're product images
 * used to identify the product being linked to.
 */
function ImageCredit({ credit }: { credit?: string }) {
  // Only Wikimedia photos are CC-licensed and need attribution; retailer
  // product shots are used to identify the product being linked to.
  if (!credit?.startsWith("wikimedia")) return null;

  const licence = credit.split("-")[1]?.trim();

  return (
    <p className="mt-2 px-1 text-[11px] leading-relaxed text-stone-400">
      Photo via{" "}
      <a
        href="https://commons.wikimedia.org"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-stone-600"
      >
        Wikimedia Commons
      </a>
      {licence ? ` - ${licence}` : ""}
    </p>
  );
}

export default async function PedalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pedal = await getOriginalBySlug(slug);

  if (!pedal) notFound();

  const cheapest = pedal.alternatives[0];
  const artists = pedal.artists ?? [];
  const originalDetail = getDetail(pedal, artists);

  // Details are resolved on the server and handed to the client panel, so the
  // modal has everything it needs without another round trip.
  const items = pedal.alternatives.map((alternative) => ({
    alternative,
    detail: getDetail(alternative, artists),
  }));

  const hasDetails = originalDetail.specsKnown || artists.length > 0;
  const noun = gearNoun(pedal.category);

  return (
    <div className="tz-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/"
          className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
        >
          ← All gear
        </Link>
      </nav>

      {/* Product hero: photo, the pitch, then the buy panel in its own lane.
          Specs and players used to sit in the middle lane, which made it two
          to three times taller than the two beside it and left a few hundred
          pixels of empty card in both bottom corners. They're a band of their
          own below now, where they get full width to line up in. */}
      <section className="tz-chamfer overflow-hidden bg-white tz-card ring-1 ring-stone-200/60">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,300px)_1fr] md:gap-10 lg:grid-cols-[minmax(0,320px)_1fr_minmax(0,17rem)] lg:gap-8">
          <div>
            <div className="tz-well relative aspect-square">
              <PedalImage
                src={pedal.imageUrl}
                name={pedal.name}
                brand={pedal.brand}
                priority
                sizes="(max-width: 768px) 100vw, 320px"
              />
            </div>
            <ImageCredit credit={pedal.imageCredit} />
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="tz-brand text-amber-700">{pedal.brand}</p>
              <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
                {pedal.name}
              </h1>
              {/* Capped measure: the middle lane is ~600px wide now, and a
                  line of body copy that long is past comfortable reading. */}
              <p className="tz-body mt-3 max-w-prose text-base text-stone-600">
                {pedal.blurb}
              </p>
            </div>

            {cheapest && (
              <CheapestAlternative
                alternative={cheapest}
                detail={getDetail(cheapest, artists)}
                originalName={pedal.name}
                originalPrice={pedal.priceGBP}
              />
            )}

            <p className="tz-body max-w-prose text-sm text-stone-600">
              {pedal.description}
            </p>
          </div>

          {/* Full width while the grid is two columns, its own lane once
              there's room. `self-start` so it doesn't stretch to the row
              height and leave a tall empty box under the last button. */}
          <div className="tz-chamfer self-start border-t border-stone-100 bg-stone-50/80 p-5 md:col-span-2 lg:col-span-1 lg:border-t-0">
            <p className="tz-eyebrow text-stone-400">Buy the original</p>

            <p className="tz-heading mt-2 text-3xl text-stone-900 tabular-nums">
              {formatPrice(pedal.priceGBP)}
            </p>
            <p className="text-xs text-stone-400">typical UK price</p>

            <div className="mt-4">
              <RetailerButtons pedal={pedal} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200/80 pt-4">
              <BookmarkButton kind="original" slug={pedal.slug} />
              <AdminTools kind="original" slug={pedal.slug} />
            </div>

            <Link
              href={`/suggest?kind=original&slug=${pedal.slug}`}
              className="mt-3 block text-xs font-bold text-stone-500 underline underline-offset-4 transition-colors hover:text-amber-700"
            >
              Suggest a change
            </Link>
          </div>
        </div>
      </section>

      {hasDetails && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {originalDetail.specsKnown && (
            <section className="tz-chamfer bg-white p-6 tz-card ring-1 ring-stone-200/60">
              <h2 className="tz-heading mb-3 text-xl text-stone-900">Specs</h2>
              <SpecList specs={originalDetail.specs} />
            </section>
          )}

          {artists.length > 0 && (
            <section className="tz-chamfer bg-white p-6 tz-card ring-1 ring-stone-200/60">
              <h2 className="tz-heading mb-3 text-xl text-stone-900">Played by</h2>
              <ArtistChips artists={artists} />
            </section>
          )}
        </div>
      )}

      <PedalDemos brand={pedal.brand} name={pedal.name} noun={noun} />

      <section className="mt-12">
        <AlternativesPanel
          items={items}
          originalName={pedal.name}
          originalPrice={pedal.priceGBP}
          noun={noun}
        />
      </section>
    </div>
  );
}
