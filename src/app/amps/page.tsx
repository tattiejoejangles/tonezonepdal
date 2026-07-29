import type { Metadata } from "next";

import { GearBrowser } from "@/components/GearBrowser";
import { getCatalogue } from "@/data/catalogue";
import { NON_PEDAL_CATEGORIES } from "@/lib/sections";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All amps",
  description:
    "Every amp on The Tone Zone - valve, modelling and cabs, with the budget alternatives that get close.",
};

/**
 * Browse every amp.
 *
 * Was a redirect to /pedals/amps, which put amps in a URL that says "pedals"
 * and listed them alongside effects. They are their own section now, split
 * into valve, modelling and cabs - a modelling combo is not an alternative to
 * a speaker cabinet, and one flat "amps" list implied it might be.
 */
export default async function AmpsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const catalogue = await getCatalogue();

  const amps = catalogue.filter((entry) =>
    NON_PEDAL_CATEGORIES.includes(entry.category),
  );
  const clones = amps.reduce((count, entry) => count + entry.alternatives.length, 0);

  return (
    <div className="tz-page py-8 sm:py-10">
      <header className="mb-8 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Browse</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
          All amps
        </h1>
        <p className="tz-body mt-2 max-w-prose text-base text-stone-600">
          {amps.length} originals and {clones} budget alternatives. Valve,
          modelling and cabs.
        </p>
      </header>

      <GearBrowser catalogue={catalogue} scope="amps" initialQuery={q ?? ""} />
    </div>
  );
}
