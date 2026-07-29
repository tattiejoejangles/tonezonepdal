import type { Metadata } from "next";

import { GearBrowser } from "@/components/GearBrowser";
import { getCatalogue } from "@/data/catalogue";

/** In step with the pedal and clone pages. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "All pedals and amps",
  description:
    "Every pedal and amp on The Tone Zone in one place - filter by family, brand and price to find the budget alternative to anything.",
};

/**
 * The browse-everything page.
 *
 * This is where the header's "All pedals" goes. The home page stays curated -
 * Find of the Day and the genre bands - and this is the page for people who
 * would rather see the lot and filter it down themselves.
 */
export default async function AllPedalsPage() {
  const catalogue = await getCatalogue();

  const originals = catalogue.length;
  const clones = catalogue.reduce(
    (count, entry) => count + entry.alternatives.length,
    0,
  );

  return (
    <div className="tz-page py-8 sm:py-10">
      <header className="mb-8 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Browse</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
          All pedals and amps
        </h1>
        <p className="tz-body mt-2 max-w-prose text-base text-stone-600">
          {originals} originals and {clones} budget alternatives. Filter by
          family, brand or price.
        </p>
      </header>

      <GearBrowser catalogue={catalogue} />
    </div>
  );
}
