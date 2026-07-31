"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  approveReviewScoresOnly,
  reviewCloneReview,
  type ActionState,
} from "@/app/admin/actions";
import { QUESTIONS } from "@/lib/reviews";
import type { PendingReview } from "@/lib/moderation";

const initial: ActionState = { ok: false, message: "" };

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-stone-100 text-stone-600",
};

/**
 * One review in the moderation queue.
 *
 * Three decisions rather than two. Approve and reject are the obvious pair, and
 * "scores only" is the one that gets used most: the numbers are fine and the
 * comment is not, and without this option that review has to be thrown away
 * whole. It's a second action, so it needs its own form - two `useActionState`
 * hooks, and the buttons sit in the form whose action they trigger.
 */
export function ReviewCard({ review }: { review: PendingReview }) {
  const [state, decide, deciding] = useActionState(reviewCloneReview, initial);
  const [scoresState, approveScores, approvingScores] = useActionState(
    approveReviewScoresOnly,
    initial,
  );

  const message = state.message || scoresState.message;
  const ok = state.message ? state.ok : scoresState.ok;
  const busy = deciding || approvingScores;

  return (
    <article className="tz-chamfer bg-white p-5 tz-card ring-1 ring-stone-200/60">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`tz-eyebrow rounded px-2.5 py-1 ${
            STATUS_TONE[review.status] ?? "bg-stone-100 text-stone-700"
          }`}
        >
          {review.status}
        </span>

        <span className="text-sm font-bold text-stone-900 tabular-nums">
          {review.rating}/5
        </span>

        {review.cloneName ? (
          <Link
            href={`/clone/${review.cloneSlug}`}
            className="text-xs font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900"
          >
            {review.cloneName}
          </Link>
        ) : (
          // The review outlived the clone it was about.
          <span className="text-xs text-stone-400">
            Unknown clone ({review.alternativeId})
          </span>
        )}

        <time
          dateTime={review.createdAt}
          className="ml-auto text-xs text-stone-400 tabular-nums"
        >
          {new Date(review.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>

      {/* The answers, so a decision can be made without opening anything. */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUESTIONS.map((question) => {
          const score = review.scores[question.id];
          return (
            <span
              key={question.id}
              className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                score === undefined
                  ? "bg-stone-50 text-stone-400"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {question.short}{" "}
              <span className="font-bold text-stone-900 tabular-nums">
                {score === undefined ? "—" : `${score}/5`}
              </span>
            </span>
          );
        })}
      </div>

      {review.comment ? (
        <p className="tz-body mt-3 border-l-2 border-stone-300 bg-stone-50/70 p-3 text-sm whitespace-pre-wrap text-stone-700">
          {review.comment}
        </p>
      ) : (
        <p className="mt-3 text-xs text-stone-400">No comment left.</p>
      )}

      {review.reviewNote && (
        <p className="mt-2 text-xs text-stone-500">
          Note: <span className="font-bold">{review.reviewNote}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
        <form action={decide} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={review.id} />

          {review.status === "pending" ? (
            <>
              <button
                type="submit"
                name="decision"
                value="approved"
                disabled={busy}
                className="tz-btn bg-emerald-600 px-5 py-2 text-xs tracking-wider text-white uppercase disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="submit"
                name="decision"
                value="rejected"
                disabled={busy}
                className="tz-btn bg-white px-5 py-2 text-xs tracking-wider text-stone-700 uppercase ring-1 ring-stone-200 disabled:opacity-40"
              >
                Reject
              </button>
            </>
          ) : (
            <button
              type="submit"
              name="decision"
              value="pending"
              disabled={busy}
              className="text-xs font-bold tracking-wider text-stone-500 uppercase hover:text-stone-900 disabled:opacity-40"
            >
              Move back to pending
            </button>
          )}
        </form>

        {review.status === "pending" && review.comment && (
          <form action={approveScores}>
            <input type="hidden" name="id" value={review.id} />
            <button
              type="submit"
              disabled={busy}
              title="Keep the ratings, delete the comment"
              className="text-xs font-bold tracking-wider text-amber-700 uppercase underline underline-offset-4 hover:text-amber-900 disabled:opacity-40"
            >
              Scores only
            </button>
          </form>
        )}

        {message && (
          <p
            aria-live="polite"
            className={`w-full text-xs ${ok ? "text-emerald-700" : "text-rose-700"}`}
          >
            {message}
          </p>
        )}
      </div>
    </article>
  );
}
