"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import { HeaderSearch } from "./HeaderSearch";
import type { SearchIndex } from "@/lib/search-index";
import type { Genre } from "@/lib/sections";

/**
 * The header's navigation, mobile first.
 *
 * The previous header laid the wordmark, a genre dropdown, two links and a
 * 20rem search box out in a single row and let them shrink. Below about 500px
 * that ran out of room: the search field collapsed to a sliver and the links
 * were pushed off the right edge.
 *
 * Now there are two layouts. Under `md` the bar carries the wordmark and a
 * disclosure button, and everything else - search first, then the links -
 * drops into a panel underneath at full width. From `md` up it is the
 * original single row.
 *
 * The panel closes on navigation, which `usePathname` reports; without that,
 * tapping a link leaves the menu hanging open over the page you just asked
 * for.
 */
export function SiteNav({
  searchIndex,
  genres,
}: {
  searchIndex: SearchIndex;
  genres: Genre[];
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();

  // Close on navigation. Adjusted during render rather than in an effect -
  // that's the documented way to reset state when an external value changes,
  // and it avoids the panel painting once over the page you just asked for.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      {/* Mobile: the toggle. Hidden from md up, where the row layout fits. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl text-stone-600 transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {/* Desktop row. */}
      <nav
        aria-label="Main"
        className="ml-auto hidden items-center gap-5 md:flex lg:gap-7"
      >
        <NavLink href="/pedals">All pedals</NavLink>
        <NavLink href="/pedals/amps">Amps</NavLink>
        <NavLink href="/saved">Saved</NavLink>
        <div className="w-56 lg:w-72">
          <HeaderSearch index={searchIndex} />
        </div>
      </nav>

      {/* Mobile panel. Full width, search first - it is what people came for. */}
      {open && (
        <div
          id={panelId}
          className="tz-pop absolute inset-x-0 top-full border-b border-stone-200/70 bg-white/95 shadow-lg backdrop-blur-md md:hidden"
        >
          <div className="tz-page space-y-4 py-4">
            <HeaderSearch index={searchIndex} />

            <nav aria-label="Main" className="grid gap-1">
              <PanelLink href="/pedals">All pedals</PanelLink>
              {genres.map((genre) => (
                <PanelLink key={genre.id} href={`/pedals/${genre.id}`} indent>
                  {genre.label}
                </PanelLink>
              ))}
              <PanelLink href="/pedals/amps" indent>
                Amps
              </PanelLink>
              <PanelLink href="/saved">Saved</PanelLink>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded text-xs font-bold tracking-wider whitespace-nowrap text-stone-500 uppercase transition-colors hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

/** 44px minimum height - these are thumb targets, not mouse targets. */
function PanelLink({
  href,
  children,
  indent = false,
}: {
  href: string;
  children: React.ReactNode;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-stone-800 transition-colors hover:bg-amber-50 focus-visible:bg-amber-50 focus-visible:outline-none ${
        indent ? "pl-7 text-stone-600" : ""
      }`}
    >
      {children}
    </Link>
  );
}
