import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Boards",
  description:
    "Build a pedalboard, see what it costs, and share it. Coming soon to The Tone Zone.",
  // Nothing here to index yet.
  robots: { index: false, follow: true },
};

/**
 * Pedalboard builder - placeholder.
 *
 * Deliberately empty for now: the nav slot exists so the third section can be
 * built without moving the navigation again, and an honest "not yet" beats a
 * link that 404s. When it lands this becomes the board grid.
 */
export default function BoardsPage() {
  return (
    <div className="tz-page tz-page--narrow py-20 text-center">
      <span className="tz-eyebrow inline-flex rounded bg-amber-100 px-3 py-1.5 text-amber-800">
        Coming soon
      </span>

      <h1 className="tz-heading mt-5 text-3xl text-stone-900 sm:text-4xl">Boards</h1>

      <p className="tz-body mx-auto mt-3 max-w-md text-base text-stone-600">
        Build a pedalboard from anything in the catalogue, see what it costs
        against the boutique version, and share it.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/pedals"
          className="tz-btn bg-stone-900 px-6 py-3 text-xs tracking-wider text-white uppercase"
        >
          Browse pedals
        </Link>
        <Link
          href="/saved"
          className="tz-btn bg-white px-6 py-3 text-xs tracking-wider text-stone-700 uppercase ring-1 ring-stone-200"
        >
          Your saved gear
        </Link>
      </div>
    </div>
  );
}
