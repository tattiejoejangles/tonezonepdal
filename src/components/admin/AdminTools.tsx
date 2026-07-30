"use client";

import Link from "next/link";

import { useIsAdmin } from "@/lib/use-admin";

/**
 * Edit affordance on a pedal's own page, shown only when signed into admin.
 *
 * Client-side on purpose. The obvious version is a server component calling
 * `isAuthed()`, but reading a cookie during render opts the page out of static
 * generation — and that would take all ~160 pedal and clone pages dynamic to
 * show a button one person sees. Instead the page stays static and asks a
 * no-store endpoint after mount.
 *
 * The request itself lives in `useIsAdmin`, shared with the artist pen buttons -
 * a pedal page carries a dozen of those, and each doing its own fetch would
 * mean a dozen identical round trips per page load.
 *
 * Renders nothing until the answer comes back, so visitors never see it flash.
 */
export function AdminTools({
  kind,
  slug,
}: {
  kind: "original" | "alternative";
  slug: string;
}) {
  const authed = useIsAdmin();

  if (!authed) return null;

  return (
    <Link
      href={`/admin/edit/${kind}/${slug}`}
      title="Edit this entry"
      // Carries its own top margin: it renders nothing for visitors, so a
      // spacer div around it in the page would leave dead space for everyone.
      className="tz-btn mt-3 inline-flex bg-stone-900 px-3 py-2 text-[11px] tracking-wider text-white uppercase hover:bg-stone-700"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      Edit
    </Link>
  );
}
