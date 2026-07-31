"use client";

import { useEffect, useState } from "react";

import type { Demo } from "@/lib/youtube";

/**
 * Video demos for a pedal.
 *
 * Hearing one is worth more than any amount of prose about how it sounds,
 * which is the whole reason this section exists.
 *
 * Fetched on view rather than during the build. A build renders ~120 pedal and
 * clone pages, and at 100 YouTube quota units per search that spent the entire
 * 10,000/day free allowance in one deploy - every page then rendered "no
 * demos" off the back of a 429. On view, only pedals someone looks at cost
 * anything, and the route behind this caches hard at the CDN.
 *
 * Embeds use youtube-nocookie.com, so watching one here doesn't drop tracking
 * cookies on a visitor who never asked for them.
 */
export function PedalDemos({
  brand,
  name,
  noun = "pedal",
}: {
  brand: string;
  name: string;
  /** "pedal" or "amp" - the fallback copy names the thing. */
  noun?: string;
}) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "ready"; demos: Demo[] } | { status: "failed" }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const query = `brand=${encodeURIComponent(brand)}&name=${encodeURIComponent(name)}`;

    fetch(`/api/demos?${query}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { demos?: Demo[] }) => {
        if (!cancelled) setState({ status: "ready", demos: data.demos ?? [] });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "failed" });
      });

    return () => {
      cancelled = true;
    };
  }, [brand, name]);

  const subject = name.toLowerCase().startsWith(brand.toLowerCase())
    ? name
    : `${brand} ${name}`;
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject} demo`)}`;

  const demos = state.status === "ready" ? state.demos : [];

  return (
    <section aria-labelledby="demos" className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-stone-900/10 pb-3">
        <h2 id="demos" className="tz-heading text-xl text-stone-900">
          Hear it
        </h2>

        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tz-eyebrow shrink-0 text-stone-500 transition-colors hover:text-amber-700"
        >
          More on YouTube
        </a>
      </div>

      {state.status === "loading" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((slot) => (
            <div
              key={slot}
              className="tz-chamfer aspect-video w-full animate-pulse bg-stone-200/70"
            />
          ))}
        </div>
      ) : demos.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => (
            <article
              key={demo.videoId}
              className="tz-chamfer tz-card overflow-hidden tz-panel"
            >
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
        <div className="tz-chamfer bg-white/70 px-6 py-10 text-center">
          <p className="tz-body text-sm text-stone-600">
            No demos here yet for this {noun}.
          </p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tz-btn mt-4 inline-flex bg-stone-900 px-6 py-2.5 text-xs text-white"
          >
            Search YouTube for demos
          </a>
        </div>
      )}
    </section>
  );
}
