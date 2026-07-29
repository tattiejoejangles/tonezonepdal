"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState } from "react";

import { HeaderSearch } from "./HeaderSearch";
import type { SearchIndex } from "@/lib/search-index";
import type { Genre } from "@/lib/sections";

export interface NavSection {
  /** Where "Browse all" goes, e.g. /pedals. */
  href: string;
  label: string;
  /** Genres listed inside the dropdown. */
  genres: Genre[];
  /** Base path each genre hangs off, e.g. /pedals. */
  genreBase: string;
}

/**
 * The header's navigation.
 *
 * Three sections - Pedals, Amps, Boards. The first two open a menu of their
 * genres with a "Browse all" at the foot, so the dropdown answers both "take
 * me to fuzz" and "show me everything" without needing two controls.
 *
 * Desktop opens on hover *and* click; a hover-only menu is unreachable by
 * keyboard and unusable on a touchscreen laptop. Under `md` the whole thing
 * collapses into one panel, where sections are always expanded - a dropdown
 * inside a dropdown is a worse phone experience than a slightly longer list.
 */
export function SiteNav({
  searchIndex,
  sections,
}: {
  searchIndex: SearchIndex;
  sections: NavSection[];
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();

  // Close on navigation, adjusted during render rather than in an effect.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
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

      <nav
        aria-label="Main"
        className="ml-auto hidden items-center gap-5 md:flex lg:gap-7"
      >
        {sections.map((section) =>
          section.genres.length > 0 ? (
            <NavDropdown key={section.href} section={section} />
          ) : (
            <NavLink key={section.href} href={section.href}>
              {section.label}
            </NavLink>
          ),
        )}
        <NavLink href="/saved">Saved</NavLink>
        <div className="w-56 lg:w-64">
          <HeaderSearch index={searchIndex} />
        </div>
      </nav>

      {open && (
        <div
          id={panelId}
          className="tz-pop absolute inset-x-0 top-full max-h-[75dvh] overflow-y-auto overscroll-contain border-b border-stone-200/70 bg-white/95 shadow-lg backdrop-blur-md md:hidden"
        >
          <div className="tz-page space-y-5 py-4">
            <HeaderSearch index={searchIndex} />

            <nav aria-label="Main" className="space-y-4">
              {sections.map((section) => (
                <div key={section.href}>
                  <PanelLink href={section.href}>{section.label}</PanelLink>
                  {section.genres.map((genre) => (
                    <PanelLink
                      key={genre.id}
                      href={`${section.genreBase}/${genre.id}`}
                      indent
                    >
                      {genre.label}
                    </PanelLink>
                  ))}
                  {section.genres.length > 0 && (
                    <PanelLink href={section.href} indent muted>
                      Browse all {section.label.toLowerCase()} →
                    </PanelLink>
                  )}
                </div>
              ))}
              <PanelLink href="/saved">Saved</PanelLink>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function NavDropdown({ section }: { section: NavSection }) {
  const [clickOpen, setClickOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const open = clickOpen || hoverOpen;

  function close() {
    setClickOpen(false);
    setHoverOpen(false);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          close();
          triggerRef.current?.focus();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          setClickOpen(true);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setClickOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded text-xs font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      >
        {section.label}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        // No gap between trigger and panel: a few pixels of dead space is
        // enough for the pointer to leave both and close the menu mid-reach.
        <div
          id={menuId}
          className="tz-pop absolute top-full left-1/2 z-40 w-72 -translate-x-1/2 pt-3"
        >
          <div className="tz-chamfer overflow-hidden bg-white shadow-2xl ring-1 ring-stone-200">
            {section.genres.map((genre) => (
              <Link
                key={genre.id}
                href={`${section.genreBase}/${genre.id}`}
                onClick={close}
                className="block border-b border-stone-100 px-4 py-3 transition-colors hover:bg-amber-50 focus-visible:bg-amber-50 focus-visible:outline-none"
              >
                <span className="block text-sm font-bold text-stone-900">
                  {genre.label}
                </span>
                {genre.blurb && (
                  <span className="tz-body mt-0.5 block text-xs text-stone-500">
                    {genre.blurb}
                  </span>
                )}
              </Link>
            ))}

            <Link
              href={section.href}
              onClick={close}
              className="flex items-center justify-between gap-2 bg-stone-50 px-4 py-3 text-xs font-bold tracking-wider text-stone-700 uppercase transition-colors hover:bg-amber-50 hover:text-amber-800 focus-visible:bg-amber-50 focus-visible:outline-none"
            >
              Browse all {section.label.toLowerCase()}
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
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
  muted = false,
}: {
  href: string;
  children: React.ReactNode;
  indent?: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-bold transition-colors hover:bg-amber-50 focus-visible:bg-amber-50 focus-visible:outline-none ${
        indent ? "pl-7" : ""
      } ${muted ? "text-amber-700" : indent ? "text-stone-600" : "text-stone-900"}`}
    >
      {children}
    </Link>
  );
}
