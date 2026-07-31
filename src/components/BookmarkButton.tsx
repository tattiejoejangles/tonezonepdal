"use client";

import { useBookmarks, type Bookmark } from "@/lib/local-store";

/**
 * Save-for-later toggle.
 *
 * Stored in the browser, so it works with no account and no round trip. Until
 * localStorage has been read the button renders in its unsaved state and is
 * disabled - flashing "Saved" and then correcting itself is worse than a beat
 * of nothing.
 */
export function BookmarkButton({
  kind,
  slug,
  tone = "light",
  full = false,
}: {
  kind: Bookmark["kind"];
  slug: string;
  tone?: "light" | "dark";
  /**
   * Stretch to the container's width and adopt the Compare button's metrics.
   *
   * The detail pages stack Save above Compare in a narrow buy panel, where two
   * buttons of different widths and two different text sizes read as an
   * accident. `px-5 py-2.5 text-xs` is copied from that Compare link
   * deliberately - the pair only lines up while the numbers match.
   */
  full?: boolean;
}) {
  const { has, toggle, ready } = useBookmarks();
  const saved = ready && has(kind, slug);

  return (
    <button
      type="button"
      onClick={() => toggle(kind, slug)}
      disabled={!ready}
      aria-pressed={saved}
      title={saved ? "Remove from saved" : "Save for later"}
      className={`tz-btn disabled:opacity-50 ${
        full ? "flex w-full px-5 py-2.5 text-xs" : "px-4 py-2 text-[11px]"
      } ${
        saved
          ? "bg-amber-500 text-white shadow-md"
          : tone === "dark"
            ? "bg-amber-300/15 text-amber-200 ring-1 ring-amber-300/30 hover:bg-amber-300/25"
            : "bg-amber-100 text-amber-900 ring-1 ring-amber-300/70 hover:bg-amber-200"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-3.5 w-3.5"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      >
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-5-7 5V4a1 1 0 0 1 1-1z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
