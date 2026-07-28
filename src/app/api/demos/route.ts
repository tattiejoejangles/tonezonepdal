import { NextResponse } from "next/server";

import { findDemos } from "@/lib/youtube";

/**
 * Demo videos for one pedal.
 *
 * This exists because fetching demos during static generation does not scale:
 * a build renders ~120 pedal and clone pages, each search costs 100 quota
 * units, and the free YouTube allowance is 10,000 a day. One deploy spent the
 * lot and every page fell back to "no demos" with a 429.
 *
 * Fetching on view instead means only pedals somebody actually looks at cost
 * anything, and the CDN cache below collapses all traffic for one pedal into a
 * single upstream search per month. Demos for a ten-year-old pedal do not
 * change; there is no reason to ask again today.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const brand = params.get("brand")?.trim();
  const name = params.get("name")?.trim();

  if (!brand || !name) {
    return NextResponse.json({ error: "brand and name required" }, { status: 400 });
  }

  const configured = Boolean(process.env.YOUTUBE_API_KEY);
  const demos = await findDemos(brand, name);

  return NextResponse.json(
    { configured, demos: demos ?? [] },
    {
      headers: {
        // Long shared cache, short revalidate window. A failed lookup is not
        // cached for a month because `demos` is empty and the client treats
        // empty as "nothing yet" rather than a permanent answer.
        "cache-control": demos && demos.length > 0
          ? "public, s-maxage=2592000, stale-while-revalidate=86400"
          : "public, s-maxage=600",
      },
    },
  );
}
