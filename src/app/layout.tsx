import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Link from "next/link";

import { AmbientBackground } from "@/components/AmbientBackground";
import { HeaderSearch } from "@/components/HeaderSearch";
import { NavMenu } from "@/components/NavMenu";
import { Wordmark } from "@/components/Wordmark";
import { getSearchIndex } from "@/data/catalogue";
import type { SearchIndex } from "@/lib/search-index";
import { GENRES } from "@/lib/sections";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Tone Zone - Budget alternatives to expensive guitar pedals",
    template: "%s - The Tone Zone",
  },
  description:
    "Find cheap, well-reviewed clones of expensive guitar pedals. Honest pros and cons, real savings, and where to buy.",
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
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Wordmark />

        {/* Pedals, Saved, then search - navigation first, the tool last. */}
        <nav className="ml-auto flex items-center gap-5 sm:gap-7">
          {/* Genres live behind one menu so amps can join as a sibling later. */}
          <NavMenu
            label="Pedals"
            items={GENRES.map((genre) => ({
              href: `/pedals/${genre.id}`,
              label: genre.label,
              blurb: genre.blurb,
            }))}
          />

          <Link
            href="/amps"
            className="text-xs font-bold tracking-wider whitespace-nowrap text-stone-500 uppercase transition-colors hover:text-amber-700"
          >
            Amps
          </Link>

          <Link
            href="/saved"
            className="text-xs font-bold tracking-wider whitespace-nowrap text-stone-500 uppercase transition-colors hover:text-amber-700"
          >
            Saved
          </Link>

          <HeaderSearch index={searchIndex} />
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200/70 bg-white/60">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-10 text-sm text-stone-500 sm:px-6">
        <p className="text-base font-bold text-stone-700">The Tone Zone</p>
        <p className="tz-body max-w-2xl">
          Prices are approximate UK street prices and change constantly - always check
          the retailer before buying. Some outbound links are affiliate links, which
          means we may earn a commission at no extra cost to you.
        </p>
        <p className="text-xs text-stone-400">
          All pedal and brand names are trademarks of their respective owners, used here
          for identification and comparison only.
        </p>
      </div>
    </footer>
  );
}
