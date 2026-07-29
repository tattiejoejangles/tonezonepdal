import { cache } from "react";

/**
 * Demo videos for a pedal, from the YouTube Data API.
 *
 * Needs YOUTUBE_API_KEY (server-only). Without it every call returns null and
 * the UI falls back to a plain "search YouTube" link — the section degrades
 * rather than disappearing, and nothing here ever invents a video id.
 *
 * Get a key at console.cloud.google.com: create a project, enable "YouTube
 * Data API v3", then create an API key. The free quota is 10,000 units a day
 * and a search costs 100, so ~100 distinct searches per day.
 *
 * That quota CANNOT be bought. Enabling billing on the Google Cloud project
 * does nothing for it - the only way up is Google's "YouTube API Services
 * Audit and Quota Extension" form, which is a review, not a payment. So the
 * only lever on this side is spending fewer units, which is what the
 * `Outcome` type below is for: a lookup that failed because the quota is gone
 * must not be retried on a short timer, or every retry burns another 100 units
 * and the project never climbs out.
 */

export interface Demo {
  videoId: string;
  title: string;
  channel: string;
}

/**
 * Why a lookup returned what it did, so the caller can cache accordingly.
 *
 * - `ok`       real results, cache hard
 * - `empty`    the search genuinely found nothing, cache for a while
 * - `blocked`  no key, quota exhausted, or the API said no - back right off
 */
export type Outcome =
  | { status: "ok"; demos: Demo[] }
  | { status: "empty" }
  | { status: "blocked"; reason: "no-key" | "quota" | "error" };

const ENDPOINT = "https://www.googleapis.com/youtube/v3/search";

interface SearchItem {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string };
}

async function search(query: string, limit: number): Promise<Outcome> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return { status: "blocked", reason: "no-key" };

  const url = new URL(ENDPOINT);
  url.searchParams.set("key", key);
  url.searchParams.set("q", query);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(limit));
  // Embeddable only: a video that refuses to embed would render an empty box.
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("relevanceLanguage", "en");

  try {
    const response = await fetch(url, {
      // Matches the pages' own revalidate window, so a pedal page costs at
      // most one search per day per hour rather than one per visit.
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      // 403 and 429 are both how the API reports an exhausted daily quota.
      const quota = response.status === 429 || response.status === 403;
      console.error(
        `[youtube] search failed: ${response.status}${quota ? " (daily quota gone - this is not buyable, see the note above)" : ""}`,
      );
      return { status: "blocked", reason: quota ? "quota" : "error" };
    }

    const data = (await response.json()) as { items?: SearchItem[] };

    const demos = (data.items ?? [])
      .map((item) => ({
        videoId: item.id?.videoId ?? "",
        title: item.snippet?.title ?? "",
        channel: item.snippet?.channelTitle ?? "",
      }))
      .filter((demo) => demo.videoId !== "");

    return demos.length > 0 ? { status: "ok", demos } : { status: "empty" };
  } catch (error) {
    console.error("[youtube] search errored:", error);
    return { status: "blocked", reason: "error" };
  }
}

/** Cached per request so two components asking for the same pedal cost one call. */
export const findDemos = cache(async function findDemos(
  brand: string,
  name: string,
  limit = 3,
): Promise<Outcome> {
  // Names usually already lead with the brand; repeating it narrows the search
  // to nothing on pedals like "Boss BD-2 Blues Driver".
  const subject = name.toLowerCase().startsWith(brand.toLowerCase())
    ? name
    : `${brand} ${name}`;

  return search(`${subject} demo`, limit);
});

/** Where to send people when there's no API key, or nothing came back. */
export function youtubeSearchUrl(brand: string, name: string): string {
  const subject = name.toLowerCase().startsWith(brand.toLowerCase())
    ? name
    : `${brand} ${name}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject} demo`)}`;
}
