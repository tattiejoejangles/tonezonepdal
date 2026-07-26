import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Any HTTPS host is allowed.
     *
     * This is deliberate: the whole point of the `image_url` column in
     * Supabase is that you can paste a URL from anywhere — eBay, Reverb, a
     * manufacturer site, your own hosting — and have it appear. An allow-list
     * would mean every paste from a new host silently fell back to the
     * "photo needed" plate with no clue why.
     *
     * The trade-off: Next's image optimiser will resize images from any URL,
     * so someone could in principle use it as a proxy. If that ever matters,
     * narrow this to the hosts you actually use — the ones in play today are
     * thumbs.static-thomann.de, m.media-amazon.com and upload.wikimedia.org.
     */
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
