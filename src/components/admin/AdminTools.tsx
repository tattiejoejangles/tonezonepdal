"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Edit affordance on a pedal's own page, shown only when signed into admin.
 *
 * Client-side on purpose. The obvious version is a server component calling
 * `isAuthed()`, but reading a cookie during render opts the page out of static
 * generation — and that would take all ~120 pedal and clone pages dynamic to
 * show a button one person sees. Instead the page stays static and asks a
 * no-store endpoint after mount.
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
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Nothing sets state before the await, so the effect body stays synchronous
    // -free of renders.
    fetch("/api/admin/status")
      .then((response) => (response.ok ? response.json() : { authed: false }))
      .then((data: { authed?: boolean }) => {
        if (!cancelled) setAuthed(Boolean(data.authed));
      })
      .catch(() => {
        // Offline or blocked: just don't offer the button.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!authed) return null;

  return (
    <Link
      href={`/admin/edit/${kind}/${slug}`}
      title="Edit this pedal"
      className="tz-btn inline-flex bg-stone-900 px-3 py-2 text-[11px] tracking-wider text-white uppercase hover:bg-stone-700"
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
