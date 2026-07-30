"use client";

import { useEffect, useState } from "react";

/**
 * Whether this browser is signed into admin.
 *
 * Client-side on purpose, and the reason is the same one AdminTools gives:
 * reading the auth cookie during render opts the page out of static generation,
 * and that would take all ~160 pedal and clone pages dynamic to show a button
 * one person ever sees. The page stays static and asks a no-store endpoint
 * after mount.
 *
 * The answer is cached in a module-level promise because a pedal page can carry
 * a dozen artist cards, each of which wants to know. Without this they would
 * fire a dozen identical requests on every page load. One promise, shared by
 * every caller for the life of the tab.
 *
 * Returns false until the answer arrives, so nothing admin-only ever flashes
 * up for a visitor.
 */
let pending: Promise<boolean> | null = null;

function checkAuth(): Promise<boolean> {
  pending ??= fetch("/api/admin/status")
    .then((response) => (response.ok ? response.json() : { authed: false }))
    .then((data: { authed?: boolean }) => Boolean(data.authed))
    .catch(() => {
      // Offline or blocked: just don't offer the controls. Cleared so a later
      // mount can retry rather than being stuck on a failed first attempt.
      pending = null;
      return false;
    });

  return pending;
}

export function useIsAdmin(): boolean {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkAuth().then((result) => {
      if (!cancelled) setAuthed(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return authed;
}
