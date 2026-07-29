import type { MetadataRoute } from "next";

import { siteUrl } from "./sitemap";

/**
 * Crawl the catalogue, leave the private and per-browser routes alone.
 *
 * /admin is a password-gated authoring tool and /saved is bookmarks held in
 * one person's browser - neither is a page anyone should reach from a search
 * result.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/saved", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
