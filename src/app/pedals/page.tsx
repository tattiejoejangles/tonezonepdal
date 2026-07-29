import type { Metadata } from "next";

import { GearBrowser } from "@/components/GearBrowser";
import { getCatalogue } from "@/data/catalogue";
import { NON_PEDAL_CATEGORIES } from "@/lib/sections";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All pedals",
  description:
    "Every guitar pedal on The Tone Zone - filter by family, brand and price to find the budget alternative to anything.",
};

/**
 * Browse every pedal.
 *
 * Pedals only: amps live at /amps. They were browsing together, which made
 * the price filter span £15 to four figures across two things nobody shops
 * for in the same session.
 */
export default async function AllPedalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const catalogue = await getCatalogue();

  const pedals = catalogue.filter(
    (entry) => !NON_PEDAL_CATEGORIES.includes(entry.category),
  );
  const clones = pedals.reduce((count, entry) => count + entry.alternatives.length, 0);

  return (
    <div className="tz-page py-8 sm:py-10">
      <header className="mb-8 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Browse</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
          All pedals
        </h1>
        <p className="tz-body mt-2 max-w-prose text-base text-stone-600">
          {pedals.length} originals and {clones} budget alternatives. Filter by
          family, brand or price.
        </p>
      </header>

      <GearBrowser catalogue={catalogue} scope="pedals" initialQuery={q ?? ""} />
    </div>
  );
}
