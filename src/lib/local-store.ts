"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Browser-local state shared across components and tabs.
 *
 * Bookmarks and the voter id live here rather than in a database because the
 * site has no accounts. That is a deliberate trade: saving a pedal is instant
 * and needs no sign-up, at the cost of not following you to another device.
 *
 * Built on useSyncExternalStore, which is the primitive for exactly this -
 * localStorage is an external store, and it gives correct behaviour during
 * hydration for free: the server snapshot renders first, then React swaps in
 * the real value once mounted.
 */

const listeners = new Map<string, Set<() => void>>();

/**
 * Parsed values keyed by the raw string they came from.
 *
 * useSyncExternalStore compares snapshots by identity and re-renders forever
 * if the getter returns a fresh object each call, so a fresh JSON.parse per
 * read is not an option.
 */
const snapshots = new Map<string, { raw: string | null; parsed: unknown }>();

function subscribe(key: string, onChange: () => void): () => void {
  const set = listeners.get(key) ?? new Set<() => void>();
  set.add(onChange);
  listeners.set(key, set);

  // `storage` only fires in *other* tabs, so local writes are announced
  // directly - that is what keeps two buttons for the same pedal in step.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === key) onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshot<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback; // Private mode or blocked storage.
  }

  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.parsed as T;

  let parsed: T;
  try {
    parsed = raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    parsed = fallback; // Something else wrote junk under our key.
  }

  snapshots.set(key, { raw, parsed });
  return parsed;
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Nothing useful to do - saving is a convenience, not the product.
  }
  listeners.get(key)?.forEach((fn) => fn());
}

function useLocalValue<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    useCallback((onChange: () => void) => subscribe(key, onChange), [key]),
    () => snapshot(key, fallback),
    () => fallback,
  );

  const update = useCallback((next: T) => write(key, next), [key]);

  return [value, update] as const;
}

/** True once React has hydrated, so the UI can avoid a saved/unsaved flash. */
const noopSubscribe = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/* ------------------------------------------------------------------ */

export interface Bookmark {
  /** Which route it lives on. */
  kind: "original" | "clone";
  slug: string;
  /** When it was saved, so the list can show newest first. */
  savedAt: number;
}

const BOOKMARKS_KEY = "tz_bookmarks";

/** Stable reference - a new [] each call would loop useSyncExternalStore. */
const NO_BOOKMARKS: Bookmark[] = [];

export function useBookmarks() {
  const [bookmarks, update] = useLocalValue<Bookmark[]>(
    BOOKMARKS_KEY,
    NO_BOOKMARKS,
  );
  const ready = useHydrated();

  const has = useCallback(
    (kind: Bookmark["kind"], slug: string) =>
      bookmarks.some((mark) => mark.kind === kind && mark.slug === slug),
    [bookmarks],
  );

  const toggle = useCallback(
    (kind: Bookmark["kind"], slug: string) => {
      const saved = bookmarks.some(
        (mark) => mark.kind === kind && mark.slug === slug,
      );
      update(
        saved
          ? bookmarks.filter((mark) => !(mark.kind === kind && mark.slug === slug))
          : [{ kind, slug, savedAt: Date.now() }, ...bookmarks],
      );
    },
    [bookmarks, update],
  );

  const remove = useCallback(
    (kind: Bookmark["kind"], slug: string) =>
      update(bookmarks.filter((mark) => !(mark.kind === kind && mark.slug === slug))),
    [bookmarks, update],
  );

  return { bookmarks, has, toggle, remove, ready };
}

/* ------------------------------------------------------------------ */

const VOTER_KEY = "tz_voter_id";

/**
 * A random id identifying this browser to the ratings table.
 *
 * Not a security measure - clearing site data gets you a new one. It exists so
 * a person can change their mind about a rating instead of stacking votes, and
 * so the average means something without requiring anyone to sign up.
 */
export function getVoterId(): string {
  const existing = snapshot<string | null>(VOTER_KEY, null);
  if (existing) return existing;

  const fresh = crypto.randomUUID();
  write(VOTER_KEY, fresh);
  return fresh;
}

/* ------------------------------------------------------------------ */

const REVIEWED_KEY = "tz_reviewed";

/** Stable reference - a new [] each call would loop useSyncExternalStore. */
const NOTHING_REVIEWED: string[] = [];

/**
 * Which clones this browser has already reviewed, by alternative id.
 *
 * Kept locally because the reviews themselves can no longer answer the
 * question. A submitted review is `pending` until it is approved, and the RLS
 * policy only lets the public read approved rows - deliberately, since the whole
 * point of moderating prose is that unapproved prose is not readable. So the
 * database cannot tell this browser "you already reviewed this one", and without
 * that the form would invite a second review and then fail on the unique
 * constraint.
 *
 * Only a UI nicety: clearing site data lets the form reappear, and the insert
 * then fails on that same constraint, which the form reports honestly.
 */
export function useReviewed() {
  const [reviewed, update] = useLocalValue<string[]>(
    REVIEWED_KEY,
    NOTHING_REVIEWED,
  );
  const ready = useHydrated();

  const has = useCallback(
    (alternativeId: string) => reviewed.includes(alternativeId),
    [reviewed],
  );

  const add = useCallback(
    (alternativeId: string) => {
      if (reviewed.includes(alternativeId)) return;
      update([alternativeId, ...reviewed]);
    },
    [reviewed, update],
  );

  return { has, add, ready };
}
