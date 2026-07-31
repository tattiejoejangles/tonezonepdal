import Link from "next/link";

/**
 * 404. Reached by `notFound()` on a pedal or clone slug that isn't in the
 * catalogue, and by any unknown URL.
 *
 * Offers the two things someone who lands here actually wants - the browse
 * page and the home page - rather than a dead end.
 */
export default function NotFound() {
  return (
    <div className="tz-page tz-page--narrow py-20 text-center">
      <p className="tz-eyebrow text-amber-700">404</p>
      <h1 className="tz-heading mt-2 text-3xl text-stone-900 sm:text-4xl">
        We couldn&apos;t find that one
      </h1>
      <p className="tz-body mx-auto mt-3 max-w-md text-base text-stone-600">
        It may have been renamed, or it might not be in the catalogue yet.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/pedals"
          className="tz-btn bg-stone-900 px-6 py-3 text-xs tracking-wider text-white uppercase"
        >
          Browse everything
        </Link>
        <Link
          href="/"
          className="tz-btn bg-white px-6 py-3 text-xs tracking-wider text-stone-700 uppercase ring-1 ring-stone-200"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
