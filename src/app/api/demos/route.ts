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

  const outcome = await findDemos(brand, name);

  /**
   * How long the CDN holds this answer.
   *
   * The old version cached every non-result for 10 minutes, which is what
   * turned one exhausted quota into a permanent one: each expiry sent another
   * search, each search cost 100 of the 10,000 daily units, and the quota
   * never recovered enough to serve anyone. A blocked lookup is now held for
   * six hours - long enough for the daily reset to land - and a genuinely
   * empty search for a day, since a pedal with no demos today will not have
   * any tomorrow either.
   */
  const maxAge =
    outcome.status === "ok"
      ? 2592000 // 30 days - demos for a ten-year-old pedal don't change
      : outcome.status === "empty"
        ? 86400 // a day
        : 21600; // six hours, and no faster

  return NextResponse.json(
    {
      demos: outcome.status === "ok" ? outcome.demos : [],
      // Surfaced for debugging, not shown to visitors.
      status: outcome.status,
      reason: outcome.status === "blocked" ? outcome.reason : undefined,
    },
    {
      headers: {
        "cache-control": `public, s-maxage=${maxAge}, stale-while-revalidate=86400`,
      },
    },
  );
}
