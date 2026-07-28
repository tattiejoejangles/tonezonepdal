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
 * and a search costs 100, so ~100 distinct pedals per day. Results are cached
 * per render pass and the pages hold them for their revalidate window, so real
 * usage sits far below that.
 */

export interface Demo {
  videoId: string;
  title: string;
  channel: string;
}

const ENDPOINT = "https://www.googleapis.com/youtube/v3/search";

interface SearchItem {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string };
}

async function search(query: string, limit: number): Promise<Demo[] | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

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
      console.error("[youtube] search failed:", response.status);
      return null;
    }

    const data = (await response.json()) as { items?: SearchItem[] };

    return (data.items ?? [])
      .map((item) => ({
        videoId: item.id?.videoId ?? "",
        title: item.snippet?.title ?? "",
        channel: item.snippet?.channelTitle ?? "",
      }))
      .filter((demo) => demo.videoId !== "");
  } catch (error) {
    console.error("[youtube] search errored:", error);
    return null;
  }
}

/** Cached per request so two components asking for the same pedal cost one call. */
export const findDemos = cache(async function findDemos(
  brand: string,
  name: string,
  limit = 3,
): Promise<Demo[] | null> {
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
