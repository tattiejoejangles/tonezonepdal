import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AlternativesPanel } from "@/components/AlternativesPanel";
import { PedalImage } from "@/components/PedalImage";
import { RetailerButtons } from "@/components/RetailerButtons";
import { SavingsBadge } from "@/components/SavingsBadge";
import { getCatalogue, getDetail, getOriginalBySlug } from "@/data/catalogue";
import { calculateSavings, formatPrice } from "@/lib/format";

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

  if (!pedal) return { title: "Pedal not found" };

  const cheapest = pedal.alternatives[0];
  const saving = cheapest ? calculateSavings(pedal.priceGBP, cheapest.priceGBP) : null;

  return {
    title: `${pedal.name} — cheap alternatives`,
    description: saving
      ? `${pedal.alternatives.length} budget alternatives to the ${pedal.name}, from ${formatPrice(cheapest.priceGBP)} — save up to ${formatPrice(saving.amount)} (${saving.percent}%).`
      : `Budget alternatives to the ${pedal.name}.`,
  };
}

/**
 * Credits Wikimedia Commons photos, which are CC-licensed and require
 * attribution. Retailer photos get no credit line — they're product images
 * used to identify the product being linked to.
 */
function ImageCredit({ credit }: { credit?: string }) {
  // Only Wikimedia photos are CC-licensed and need attribution; retailer
  // product shots are used to identify the product being linked to.
  if (!credit?.startsWith("wikimedia")) return null;

  const licence = credit.split("—")[1]?.trim();

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
      {licence ? ` — ${licence}` : ""}
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
  const bestSaving = cheapest
    ? calculateSavings(pedal.priceGBP, cheapest.priceGBP)
    : null;

  const artists = pedal.artists ?? [];
  const originalDetail = getDetail(pedal, pedal.category, artists);

  // Details are resolved on the server and handed to the client panel, so the
  // modal has everything it needs without another round trip.
  const items = pedal.alternatives.map((alternative) => ({
    alternative,
    detail: getDetail(alternative, pedal.category, artists),
  }));

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

      {/* Product hero: image left, the buy decision on the right. */}
      <section className="tz-chamfer overflow-hidden bg-white shadow-sm ring-1 ring-stone-200/70">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,380px)_1fr] md:gap-10">
          <div>
            <div className="relative aspect-square overflow-hidden bg-white ring-1 ring-stone-100">
              <PedalImage
                src={pedal.imageUrl}
                name={pedal.name}
                brand={pedal.brand}
                priority
                sizes="(max-width: 768px) 100vw, 380px"
              />
            </div>
            <ImageCredit credit={pedal.imageCredit} />
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="tz-eyebrow text-amber-700">{pedal.brand}</p>
              <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
                {pedal.name}
              </h1>
              <p className="tz-body mt-3 text-base text-stone-600">{pedal.blurb}</p>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="tz-heading text-3xl text-stone-900">
                {formatPrice(pedal.priceGBP)}
              </span>
              <span className="text-sm text-stone-400">typical UK price</span>
            </div>

            {cheapest && bestSaving && (
              <div className="border-l-2 border-emerald-500 bg-emerald-50/70 p-4">
                <p className="text-sm font-medium text-emerald-900">
                  Cheapest alternative:{" "}
                  <span className="font-bold">{cheapest.name}</span> at{" "}
                  <span className="font-bold">{formatPrice(cheapest.priceGBP)}</span>
                </p>
                <div className="mt-2.5">
                  <SavingsBadge saving={bestSaving} comparedTo={pedal.name} size="lg" />
                </div>
              </div>
            )}

            <p className="tz-body text-sm text-stone-600">{pedal.description}</p>

            {originalDetail.controls.length > 0 && (
              <div>
                <p className="tz-eyebrow mb-2 text-stone-400">Controls</p>
                <div className="flex flex-wrap gap-1.5">
                  {originalDetail.controls.map((control) => (
                    <span
                      key={control.name}
                      title={control.what}
                      className="bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-700"
                    >
                      {control.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {artists.length > 0 && (
              <div>
                <p className="tz-eyebrow mb-2 text-stone-400">Played by</p>
                <p className="tz-body text-sm text-stone-600">{artists.join(" · ")}</p>
              </div>
            )}

            <div className="mt-auto space-y-2 border-t border-stone-100 pt-5">
              <p className="tz-eyebrow text-stone-400">Buy the original</p>
              <RetailerButtons pedal={pedal} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <AlternativesPanel
          items={items}
          originalName={pedal.name}
          originalPrice={pedal.priceGBP}
        />
      </section>
    </div>
  );
}
