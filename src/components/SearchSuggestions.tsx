"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { PedalImage } from "./PedalImage";
import { searchSuggestions, type Suggestion } from "@/lib/filter";
import { formatPrice } from "@/lib/format";
import type { SearchIndex } from "@/lib/search-index";

/**
 * Shared behaviour for a search box that suggests pedals as you type.
 *
 * Both search boxes on the site use this: the hero box on the home page and
 * the compact one in the header. They look different and do different things
 * on submit, so they stay separate components - but the matching, keyboard
 * handling and dismissal are identical, and live here.
 */
export function useSuggestions(index: SearchIndex, query: string) {
  const router = useRouter();
  const listId = useId();

  // An empty query yields nothing, so the panel cannot open until a character
  // is typed. Clicking into the box shows no pedals.
  const suggestions = useMemo(() => searchSuggestions(index, query), [index, query]);

  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);

  // Reset the panel whenever the query changes. Adjusting during render rather
  // than from an effect, the same way Directory handles `?q=` - it settles in
  // one pass, with no flash of a stale highlight.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setDismissed(false);
    setActive(-1);
  }

  const open = !dismissed && suggestions.length > 0;

  function dismiss() {
    setDismissed(true);
    setActive(-1);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      // Only swallowed when there's a panel to close, so Escape still clears
      // the input the way a type="search" box normally does.
      if (open) {
        event.preventDefault();
        dismiss();
      }
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      // Only when a row is highlighted. With none, Enter falls through to the
      // form so the header search keeps submitting to ?q= as it does today.
      event.preventDefault();
      dismiss();
      router.push(suggestions[active].href);
    }
  }

  /** Closes once focus leaves the field and the panel together. */
  function onBlur(event: React.FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) dismiss();
  }

  return {
    suggestions,
    open,
    active,
    listId,
    setActive,
    dismiss,
    /** Spread onto the element wrapping both the input and the panel. */
    containerProps: { onBlur },
    /** Spread onto the input. */
    inputProps: {
      role: "combobox" as const,
      "aria-expanded": open,
      "aria-controls": listId,
      "aria-autocomplete": "list" as const,
      "aria-activedescendant":
        open && active >= 0 ? `${listId}-${active}` : undefined,
      onKeyDown,
    },
  };
}

/**
 * The dropdown itself: a photo, name and price per pedal, tagged so it's
 * obvious whether a row is the expensive original or the budget clone of it.
 * Rows are real links, so middle-click and open-in-new-tab work.
 */
export function SearchSuggestions({
  suggestions,
  active,
  listId,
  onHover,
  onSelect,
  tone = "light",
  minWidth = 0,
  anchorRef,
}: {
  suggestions: Suggestion[];
  active: number;
  listId: string;
  onHover: (index: number) => void;
  onSelect: () => void;
  tone?: "light" | "dark";
  /** The header box is too narrow for these rows to read well. */
  minWidth?: number;
  /** The input to hang the panel under. */
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const dark = tone === "dark";
  const panelRef = useAnchoredPanel(anchorRef, minWidth);

  if (typeof document === "undefined") return null;

  /**
   * Portalled to <body> and positioned with `fixed`.
   *
   * The hero is `isolate` + `overflow-hidden`: the first traps any z-index
   * inside its own stacking context, the second clips the panel at the hero's
   * bottom edge. Both are needed for the drifting pedal backdrop, so the panel
   * has to leave the tree rather than out-stack it.
   */
  return createPortal(
    <div
      id={listId}
      ref={panelRef}
      role="listbox"
      aria-label="Matching pedals"
      className={`tz-pop fixed top-0 left-0 z-9999 max-h-96 overflow-y-auto rounded-2xl text-left shadow-2xl ring-1 ${
        dark ? "bg-[#151c30] ring-white/10" : "bg-white ring-stone-200"
      }`}
    >
      {suggestions.map((suggestion, index) => {
        const highlighted = index === active;

        return (
          <Link
            key={suggestion.href}
            id={`${listId}-${index}`}
            href={suggestion.href}
            role="option"
            aria-selected={highlighted}
            onMouseEnter={() => onHover(index)}
            // Keep focus in the input. The panel now lives outside the field's
            // DOM subtree, so letting the press move focus would fire the
            // container's blur handler and unmount this link mid-click.
            onMouseDown={(event) => event.preventDefault()}
            onClick={onSelect}
            className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
              dark
                ? highlighted
                  ? "bg-white/10"
                  : "hover:bg-white/5"
                : highlighted
                  ? "bg-amber-50"
                  : "hover:bg-stone-50"
            }`}
          >
            <div
              className={`relative h-12 w-12 shrink-0 overflow-hidden bg-white ring-1 ${
                dark ? "ring-white/10" : "ring-stone-200"
              }`}
            >
              <PedalImage
                src={suggestion.imageUrl}
                name={suggestion.name}
                brand={suggestion.brand}
                eager
                sizes="48px"
              />
            </div>

            <div className="min-w-0 flex-1">
              {/* No Clone/Original pill: the "Alternative to …" line below
                  already says which is which, without the visual noise. */}
              <span
                className={`tz-eyebrow block truncate ${
                  dark ? "text-amber-400" : "text-amber-700"
                }`}
              >
                {suggestion.brand}
              </span>

              <p
                className={`truncate text-sm font-bold ${
                  dark ? "text-white" : "text-stone-900"
                }`}
              >
                {suggestion.name}
              </p>

              {suggestion.originalName && (
                <p
                  className={`truncate text-[11px] ${
                    dark ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  Alternative to {suggestion.originalName}
                </p>
              )}
            </div>

            <span
              className={`tz-heading shrink-0 text-base ${
                dark ? "text-white" : "text-stone-900"
              }`}
            >
              {formatPrice(suggestion.priceGBP)}
            </span>
          </Link>
        );
      })}
    </div>,
    document.body,
  );
}

/**
 * Positions a fixed panel under its anchor, imperatively.
 *
 * A ref callback rather than state and an effect: it runs after the DOM is
 * mutated but before paint, so the panel is never briefly visible in the wrong
 * place, and there is no render pass just to store coordinates.
 *
 * Recomputed on scroll and resize because `fixed` coordinates are viewport
 * relative - otherwise the panel would hang in space while the page moved. The
 * scroll listener captures so it also catches scrolling in any container
 * between the input and the document.
 */
function useAnchoredPanel(
  anchorRef: React.RefObject<HTMLElement | null>,
  minWidth: number,
) {
  return useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      const place = () => {
        const anchor = anchorRef.current;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const width = Math.max(rect.width, minWidth);
        // Keep it on screen when it's wider than the box it hangs off.
        const left = Math.min(
          Math.max(8, rect.left),
          Math.max(8, window.innerWidth - width - 8),
        );

        node.style.top = `${rect.bottom + 8}px`;
        node.style.left = `${left}px`;
        node.style.width = `${width}px`;
      };

      place();
      window.addEventListener("scroll", place, true);
      window.addEventListener("resize", place);

      // React 19 runs this when the ref detaches.
      return () => {
        window.removeEventListener("scroll", place, true);
        window.removeEventListener("resize", place);
      };
    },
    [anchorRef, minWidth],
  );
}
