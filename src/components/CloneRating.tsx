"use client";

import { useCallback, useEffect, useState } from "react";

import { getVoterId } from "@/lib/local-store";
import { getSupabase } from "@/lib/supabase";

interface Summary {
  average: number;
  votes: number;
}

/**
 * Reads the aggregate and this browser's own vote in one round trip.
 * Pure: returns what it found and touches no React state.
 */
async function fetchRating(alternativeId: string): Promise<
  { ok: false } | { ok: true; summary: Summary | null; mine: number | null }
> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false };

  const voterId = getVoterId();
  const [aggregate, own] = await Promise.all([
    supabase
      .from("clone_rating_summary")
      .select("average, votes")
      .eq("alternative_id", alternativeId)
      .maybeSingle(),
    supabase
      .from("clone_ratings")
      .select("rating")
      .eq("alternative_id", alternativeId)
      .eq("voter_id", voterId)
      .maybeSingle(),
  ]);

  if (aggregate.error) return { ok: false };

  return {
    ok: true,
    summary: aggregate.data
      ? { average: Number(aggregate.data.average), votes: aggregate.data.votes }
      : null,
    mine: own.data ? Number(own.data.rating) : null,
  };
}

/**
 * "How close is this to the original?" - a community accuracy score.
 *
 * Separate from the editorial `matchQuality` on the record, and deliberately
 * so: one is our judgement, this is what owners actually think, and the two
 * disagreeing is useful information rather than a bug.
 *
 * Read and written straight from the browser under the anon key. Row Level
 * Security allows reading the aggregate and inserting or changing your own
 * row, nothing else. The voter id is a random uuid in localStorage, which
 * stops casual vote stacking without pretending to be real authentication.
 *
 * Not fetched on the server: these pages are statically generated with a five
 * minute revalidate window, so a server-rendered score would routinely be
 * stale and would show every visitor a cached version of someone else's vote.
 */
export function CloneRating({
  alternativeId,
  originalName,
}: {
  alternativeId: string;
  originalName: string;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [mine, setMine] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">(
    "loading",
  );

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchRating>>) => {
    if (!result.ok) {
      setState("error");
      return;
    }
    setSummary(result.summary);
    setMine(result.mine);
    setState("ready");
  }, []);

  const reload = useCallback(async () => {
    apply(await fetchRating(alternativeId));
  }, [alternativeId, apply]);

  useEffect(() => {
    let cancelled = false;
    // Nothing sets state before this await, so the effect body itself stays
    // free of synchronous renders.
    fetchRating(alternativeId).then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, [alternativeId, apply]);

  async function vote(rating: number) {
    const supabase = getSupabase();
    if (!supabase) return;

    setState("saving");
    // Optimistic: the star fills immediately, then the average catches up.
    setMine(rating);

    const { error } = await supabase.from("clone_ratings").upsert(
      { alternative_id: alternativeId, voter_id: getVoterId(), rating },
      { onConflict: "alternative_id,voter_id" },
    );

    if (error) {
      setState("error");
      return;
    }

    await reload();
  }

  const shown = hover || mine || 0;

  return (
    <div>
      <p className="tz-eyebrow mb-2 text-stone-400">How close is it, really?</p>

      <div
        className="flex flex-wrap items-center gap-3"
        onMouseLeave={() => setHover(0)}
      >
        <div className="flex gap-1" role="group" aria-label="Rate accuracy out of 5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => vote(star)}
              onMouseEnter={() => setHover(star)}
              onFocus={() => setHover(star)}
              onBlur={() => setHover(0)}
              disabled={state === "loading" || state === "saving"}
              aria-label={`${star} out of 5 - ${star === 5 ? "indistinguishable" : star === 1 ? "nothing like it" : "close"}`}
              aria-pressed={mine === star}
              className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className={`h-6 w-6 ${
                  star <= shown ? "text-amber-500" : "text-stone-300"
                }`}
                fill={star <= shown ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              >
                <path d="m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.1-5.6-3.2-5.6 3.2 1.3-6.1L3 9.6l6.3-.7z" />
              </svg>
            </button>
          ))}
        </div>

        <p aria-live="polite" className="text-sm text-stone-600">
          {state === "error" ? (
            <span className="text-stone-500">Ratings are unavailable right now.</span>
          ) : summary && summary.votes > 0 ? (
            <>
              <span className="font-bold text-stone-900">
                {summary.average.toFixed(1)}
              </span>{" "}
              from {summary.votes} {summary.votes === 1 ? "player" : "players"}
              {mine !== null && (
                <span className="text-stone-500"> · you said {mine}</span>
              )}
            </>
          ) : state === "ready" ? (
            <span className="text-stone-500">
              No ratings yet - be the first.
            </span>
          ) : (
            <span className="text-stone-400">Loading…</span>
          )}
        </p>
      </div>

      <p className="tz-body mt-2 text-xs text-stone-500">
        Five means you could not tell it from the {originalName}. One means it is
        nothing like it.
      </p>
    </div>
  );
}
