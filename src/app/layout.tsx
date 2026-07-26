import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Link from "next/link";

import { HeaderSearch } from "@/components/HeaderSearch";
import { Wordmark } from "@/components/Wordmark";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Tone Zone — Budget alternatives to expensive guitar pedals",
    template: "%s — The Tone Zone",
  },
  description:
    "Find cheap, well-reviewed clones of expensive guitar pedals. Honest pros and cons, real savings, and where to buy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Wordmark />

        <div className="ml-auto flex items-center gap-3">
          <HeaderSearch />

          <Link
            href="/#directory"
            className="hidden text-xs font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-amber-700 sm:block"
          >
            Browse
          </Link>
        </div>
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
          Prices are approximate UK street prices and change constantly — always check
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
