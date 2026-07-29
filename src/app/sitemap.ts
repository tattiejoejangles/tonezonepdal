import type { MetadataRoute } from "next";

import { getCatalogue } from "@/data/catalogue";
import { AMPS_GENRE, GENRES } from "@/lib/sections";

export const revalidate = 3600;

/**
 * The site's URL, for absolute links in the sitemap and metadata.
 *
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deploy, so production
 * gets the right host without anything being configured. Set NEXT_PUBLIC_SITE_URL
 * once there's a custom domain and it takes precedence.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const catalogue = await getCatalogue();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/pedals`, changeFrequency: "daily", priority: 0.9 },
  ];

  const genrePages: MetadataRoute.Sitemap = [...GENRES, AMPS_GENRE].map((genre) => ({
    url: `${base}/pedals/${genre.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const originalPages: MetadataRoute.Sitemap = catalogue.map((entry) => ({
    url: `${base}/pedal/${entry.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const clonePages: MetadataRoute.Sitemap = catalogue.flatMap((entry) =>
    entry.alternatives.map((alt) => ({
      url: `${base}/clone/${alt.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  );

  // /saved and /admin are deliberately absent: one is per-browser and the
  // other is a private authoring tool.
  return [...staticPages, ...genrePages, ...originalPages, ...clonePages];
}
