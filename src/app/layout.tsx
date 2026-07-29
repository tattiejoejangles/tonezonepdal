import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Link from "next/link";

import { siteUrl } from "./sitemap";

import { AmbientBackground } from "@/components/AmbientBackground";
import { TzLockup } from "@/components/Logo";
import { SiteNav } from "@/components/SiteNav";
import { Wordmark } from "@/components/Wordmark";
import { getSearchIndex } from "@/data/catalogue";
import type { SearchIndex } from "@/lib/search-index";
import { AMP_GENRES, GENRES } from "@/lib/sections";
import "./globals.css";

const TITLE = "The Tone Zone - Budget alternatives to expensive pedals and amps";
const DESCRIPTION =
  "Find cheap, well-reviewed alternatives to expensive guitar pedals and amps. Honest pros and cons, real savings, and where to buy.";

export const metadata: Metadata = {
  // Absolute base for OG tags and canonicals. Without it, social previews get
  // relative image paths and silently render nothing.
  metadataBase: new URL(siteUrl()),
  title: { default: TITLE, template: "%s - The Tone Zone" },
  description: DESCRIPTION,
  applicationName: "The Tone Zone",
  openGraph: {
    type: "website",
    siteName: "The Tone Zone",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // No maximum-scale or user-scalable=no: pinch zoom is an accessibility
  // feature, and disabling it is one of the fastest ways to fail an audit.
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f6f7",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Built on the server so the header's suggestions need no round trip, and so
  // nothing in the header forces a page to render on the client.
  const searchIndex = await getSearchIndex();

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AmbientBackground />
        <SiteHeader searchIndex={searchIndex} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader({ searchIndex }: { searchIndex: SearchIndex }) {
  return (
    // `relative` so the mobile panel can hang off the bar's bottom edge.
    <header className="sticky top-0 z-30 relative border-b border-stone-200/70 bg-white/85 backdrop-blur-md">
      <div className="tz-page flex items-center gap-4 py-3">
        <Wordmark />
        <SiteNav
          searchIndex={searchIndex}
          sections={[
            {
              href: "/pedals",
              label: "Pedals",
              genres: GENRES,
              genreBase: "/pedals",
            },
            {
              href: "/amps",
              label: "Amps",
              genres: AMP_GENRES,
              genreBase: "/pedals",
            },
            // No genres yet - renders as a plain link until the builder lands.
            { href: "/boards", label: "Boards", genres: [], genreBase: "/boards" },
          ]}
        />
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200/70 bg-white/60">
      {/* Two lanes on desktop: the mark on the left, the small print on the
          right. The footer is the one place with room for the full lockup, and
          the wide waveform is what stops a bare block of legal text reading as
          the page having simply run out. */}
      <div className="tz-page grid gap-8 py-10 text-sm text-stone-500 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-14">
        <div>
          <TzLockup
            className="h-12 w-auto text-stone-800"
            title="The Tone Zone"
          />
          <p className="mt-3 text-base font-bold text-stone-700">The Tone Zone</p>
          <p className="tz-body mt-1 text-xs text-stone-400">
            Great tone, not boutique prices.
          </p>
        </div>

        <div className="space-y-3">
          <p>
            <Link
              href="/suggest"
              className="text-sm font-bold text-amber-700 underline underline-offset-4 hover:text-amber-900"
            >
              Spotted something wrong? Make a suggestion
            </Link>
          </p>
          <p className="tz-body max-w-2xl">
            Prices are approximate UK street prices and change constantly - always check
            the retailer before buying. Some outbound links are affiliate links, which
            means we may earn a commission at no extra cost to you.
          </p>
          <p className="max-w-2xl text-xs text-stone-400">
            All product and brand names are trademarks of their respective owners, used
            here for identification and comparison only.
          </p>
        </div>
      </div>
    </footer>
  );
}
