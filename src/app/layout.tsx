import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
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

/**
 * Type: Archivo for anything that shouts, Inter for anything you read.
 *
 * Replaces Geist, which is Vercel's own face and turns up on so much generated
 * work that it reads as a default rather than a choice. Both of these are among
 * the most-used families on Google Fonts, so neither is exotic - the difference
 * is that Archivo is a grotesque with genuinely heavy weights, which is what
 * the solid-block look needs. Inter carries the small print, where its larger
 * x-height and open apertures are worth more than personality.
 *
 * Variable fonts, so the whole weight range costs one file each.
 */
const display = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

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
      className={`${display.variable} ${body.variable} h-full antialiased`}
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
      <div className="tz-page py-12 text-sm text-stone-500">
        <div className="grid gap-10 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-16">
          <div>
            <TzLockup className="h-12 w-auto text-stone-800" title="The Tone Zone" />
            <p className="mt-3 text-base font-bold text-stone-700">The Tone Zone</p>
            <p className="tz-body mt-1 text-xs text-stone-400">
              Great tone, not boutique prices.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn title="Browse">
              <FooterLink href="/pedals">All pedals</FooterLink>
              <FooterLink href="/amps">All amps</FooterLink>
              <FooterLink href="/boards">Boards</FooterLink>
              <FooterLink href="/saved">Saved gear</FooterLink>
            </FooterColumn>

            <FooterColumn title="Help out">
              <FooterLink href="/suggest">Make a suggestion</FooterLink>
              <FooterLink href="/suggest">Report a wrong price</FooterLink>
              <FooterLink href="/legal/trademarks">Takedown requests</FooterLink>
            </FooterColumn>

            <FooterColumn title="Legal">
              <FooterLink href="/legal/terms">Terms of use</FooterLink>
              <FooterLink href="/legal/privacy">Privacy &amp; cookies</FooterLink>
              <FooterLink href="/legal/affiliates">Affiliate disclosure</FooterLink>
              <FooterLink href="/legal/trademarks">Trademarks</FooterLink>
            </FooterColumn>
          </div>
        </div>

        {/* The disclosures that have to be visible on every page rather than
            one click away: the affiliate relationship, the fact prices are
            estimates, and that we are nobody's official anything. */}
        <div className="mt-10 space-y-3 border-t border-stone-200/70 pt-8">
          <p className="tz-body max-w-3xl text-xs">
            Prices are approximate UK street prices, recorded by hand and not fed live
            from any retailer - they change constantly, so always check the
            retailer&apos;s own listing before buying. Nothing here is an offer to sell.
          </p>
          <p className="tz-body max-w-3xl text-xs">
            Some outbound links are affiliate links, and we may earn a commission at no
            extra cost to you. As an Amazon Associate we earn from qualifying purchases.
            Commission never affects which alternatives we list or how we rate them -{" "}
            <Link
              href="/legal/affiliates"
              className="font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              full disclosure
            </Link>
            .
          </p>
          {/* Added once the site started taking reviews. Ratings are now
              published from members of the public and feed the tonal match
              figure, so who wrote them - and who is responsible for them - has
              to be stated where anyone reading one can see it. */}
          <p className="tz-body max-w-3xl text-xs">
            Reviews, ratings and comments are submitted by visitors and are their
            opinions, not ours. They are checked before publication, but we
            don&apos;t verify that anyone owns what they review, and star ratings
            adjust the tonal match figure shown on a page. Spot something that
            shouldn&apos;t be here?{" "}
            <Link
              href="/legal"
              className="font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              Tell us and we&apos;ll remove it
            </Link>
            .
          </p>
          <p className="max-w-3xl text-xs text-stone-400">
            All product and brand names are trademarks of their respective owners, used
            here for identification and comparison only. The Tone Zone is not affiliated
            with, endorsed by or authorised by any manufacturer or retailer named on this
            site. Tonal match figures, spec comparisons and pros and cons are editorial
            opinion. Product photography belongs to the manufacturers and retailers it
            came from and is used to identify the product being linked to; artist
            photographs are credited where a licence requires it.
          </p>
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} The Tone Zone.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="tz-eyebrow mb-3 text-stone-400">{title}</p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm font-medium text-stone-600 transition-colors hover:text-amber-700"
      >
        {children}
      </Link>
    </li>
  );
}
