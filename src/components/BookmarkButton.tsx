"use client";

import { useBookmarks, type Bookmark } from "@/lib/local-store";

/**
 * Save-for-later toggle.
 *
 * Stored in the browser, so it works with no account and no round trip. Until
 * localStorage has been read the button renders in its unsaved state and is
 * disabled — flashing "Saved" and then correcting itself is worse than a beat
 * of nothing.
 */
export function BookmarkButton({
  kind,
  slug,
  tone = "light",
}: {
  kind: Bookmark["kind"];
  slug: string;
  tone?: "light" | "dark";
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
      className={`tz-btn px-4 py-2 text-[11px] tracking-wider uppercase disabled:opacity-50 ${
        saved
          ? "bg-linear-to-b from-amber-500 to-orange-600 text-white shadow-md"
          : tone === "dark"
            ? "bg-white/10 text-stone-200 ring-1 ring-white/15 hover:bg-white/15"
            : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900"
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
