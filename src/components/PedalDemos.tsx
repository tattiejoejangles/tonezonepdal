import { findDemos, youtubeSearchUrl } from "@/lib/youtube";

/**
 * Video demos for a pedal.
 *
 * Hearing one is worth more than any amount of prose about how it sounds,
 * which is the whole reason this section exists.
 *
 * Embeds use youtube-nocookie.com, so watching one here doesn't drop tracking
 * cookies on a visitor who never asked for them. Iframes are lazy so three
 * players don't compete with the page for bandwidth on load.
 */
export async function PedalDemos({
  brand,
  name,
}: {
  brand: string;
  name: string;
}) {
  const demos = await findDemos(brand, name);
  const searchUrl = youtubeSearchUrl(brand, name);

  return (
    <section aria-labelledby="demos" className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-stone-900/10 pb-3">
        <div>
          <h2 id="demos" className="tz-heading text-xl text-stone-900">
            Hear it
          </h2>
          <p className="tz-body mt-0.5 text-sm text-stone-500">
            Demos from YouTube. We don&apos;t pick these - they&apos;re the top
            results for this pedal.
          </p>
        </div>

        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tz-eyebrow shrink-0 text-stone-500 transition-colors hover:text-amber-700"
        >
          More on YouTube
        </a>
      </div>

      {demos && demos.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => (
            <article key={demo.videoId} className="tz-chamfer tz-card overflow-hidden bg-white ring-1 ring-stone-200/60">
              <div className="relative aspect-video w-full bg-stone-900">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${demo.videoId}`}
                  title={demo.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-bold text-stone-900">
                  {demo.title}
                </p>
                <p className="tz-brand mt-1 text-stone-500">{demo.channel}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="tz-chamfer bg-white/70 px-6 py-10 text-center ring-1 ring-stone-200">
          <p className="tz-body text-sm text-stone-600">
            {demos === null
              ? "Video demos aren't switched on yet."
              : "No demos found for this one."}
          </p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tz-btn mt-4 inline-flex bg-linear-to-b from-stone-800 to-stone-950 px-6 py-2.5 text-xs tracking-wider text-white uppercase"
          >
            Search YouTube for demos
          </a>
        </div>
      )}
    </section>
  );
}
