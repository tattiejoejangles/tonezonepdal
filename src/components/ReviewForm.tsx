"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { getVoterId, useReviewed } from "@/lib/local-store";
import {
  MAX_COMMENT_LENGTH,
  QUESTIONS,
  type QuestionId,
} from "@/lib/reviews";
import { getSupabase } from "@/lib/supabase";

/**
 * The button that opens the form, for the top of a clone page.
 *
 * The form used to sit permanently in a panel at the foot of the page, beside
 * the reviews. It is a nine-control form, so it dominated whatever it sat next
 * to and pushed the reviews themselves - the thing people came to read - into a
 * narrow column. Behind a button it costs one line until somebody wants it, and
 * it can sit next to the rating at the top where the decision to review is
 * actually made.
 */
export function LeaveReviewButton({
  alternativeId,
  originalName,
  noun,
}: {
  alternativeId: string;
  originalName: string;
  noun: string;
}) {
  const [open, setOpen] = useState(false);
  const { has, ready } = useReviewed();
  const already = ready && has(alternativeId);

  // Nothing to open if the database isn't configured - the form would only be
  // able to tell you it can't save.
  if (getSupabase() === null) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        disabled={already}
        className="tz-btn bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-4 w-4"
          fill="currentColor"
        >
          <path d="m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.1-5.6-3.2-5.6 3.2 1.3-6.1L3 9.6l6.3-.7z" />
        </svg>
        {already ? "Review submitted" : "Leave a review"}
      </button>

      {open && (
        <ReviewDialog
          alternativeId={alternativeId}
          originalName={originalName}
          noun={noun}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ReviewDialog({
  alternativeId,
  originalName,
  noun,
  onClose,
}: {
  alternativeId: string;
  originalName: string;
  noun: string;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="tz-fade fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="tz-pop relative max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-lg"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded bg-stone-900/85 text-white transition hover:bg-stone-900"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div id={titleId} className="sr-only">
          Review the {originalName} alternative
        </div>

        <ReviewForm
          alternativeId={alternativeId}
          originalName={originalName}
          noun={noun}
          bare
        />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Leave a review: stars, three questions, a comment. One screen.
 *
 * Replaces a two-tier form - a one-tap star, then an "Add detail" panel holding
 * five separate axes named voicing, gain character, dynamics, noise floor and
 * build quality. Two problems with that: hardly anyone opened the second tier,
 * and the axes behind it were written in builder's vocabulary. Someone who owns
 * one overdrive can tell you whether it sounds like the real thing and whether
 * it felt worth the money; they cannot rate its noise floor out of five.
 *
 * Everything except the star is optional, and skipping a question leaves it
 * genuinely unanswered rather than defaulting to a middling 3 - a guess would
 * move the average without anyone having judged it.
 *
 * Written straight from the browser under the anon key, which may only INSERT a
 * row with `status = 'pending'`. Nothing here reaches the site until it is
 * approved in /admin/reviews, so this form's success state promises review, not
 * publication.
 */
export function ReviewForm({
  alternativeId,
  originalName,
  noun,
  bare = false,
}: {
  alternativeId: string;
  originalName: string;
  /** "pedal" / "amp" / "cab", for copy that would otherwise say "pedal". */
  noun: string;
  /** Inside the dialog, which supplies its own frame. */
  bare?: boolean;
}) {
  const { has, add, ready } = useReviewed();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [scores, setScores] = useState<Partial<Record<QuestionId, number>>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentId = useId();

  const supabaseConfigured = getSupabase() !== null;

  async function submit() {
    const supabase = getSupabase();
    if (!supabase || rating < 1) return;

    setSaving(true);
    setError(null);

    const trimmed = comment.trim().slice(0, MAX_COMMENT_LENGTH);

    const { error: failure } = await supabase.from("clone_reviews").insert({
      alternative_id: alternativeId,
      voter_id: getVoterId(),
      rating,
      // Named explicitly rather than spread, so an unanswered question is sent
      // as null instead of being omitted and defaulting server-side.
      sounds_like: scores.sounds_like ?? null,
      build_quality: scores.build_quality ?? null,
      value: scores.value ?? null,
      comment: trimmed || null,
    });

    setSaving(false);

    if (failure) {
      // 23505 is unique_violation: one review per browser per clone.
      setError(
        failure.code === "23505"
          ? "You have already reviewed this one."
          : "Couldn't save that. Try again shortly.",
      );
      return;
    }

    add(alternativeId);
    setDone(true);
  }

  if (!supabaseConfigured) return null;

  if (done || (ready && has(alternativeId))) {
    return (
      <div
        className={
          bare
            ? "p-6"
            : "tz-chamfer border border-emerald-200 bg-emerald-50/70 p-5"
        }
      >
        <p className="tz-eyebrow mb-1 text-emerald-800">Thanks</p>
        <p className="tz-body text-sm text-emerald-950">
          {done
            ? "Your review has been sent for approval. It appears here once it's been checked."
            : "You've already reviewed this one. Thanks for that."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        bare ? "p-6" : "tz-chamfer border border-stone-200 bg-stone-50/70 p-5"
      }
    >
      <h3 className="tz-heading text-lg text-stone-900">
        Reviewed this {noun}?
      </h3>
      <p className="tz-body mt-1 mb-4 text-xs text-stone-500">
        Reviews are checked before they go up. Only the star rating is required.
      </p>

      {/* Overall stars ---------------------------------------------------- */}
      <fieldset onMouseLeave={() => setHover(0)}>
        <legend className="text-xs font-bold text-stone-700">
          Overall, how good is it?
        </legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onFocus={() => setHover(star)}
              onBlur={() => setHover(0)}
              aria-label={`${star} out of 5`}
              aria-pressed={rating === star}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className={`h-7 w-7 ${
                  star <= (hover || rating) ? "text-amber-500" : "text-stone-300"
                }`}
                fill={star <= (hover || rating) ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              >
                <path d="m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.1-5.6-3.2-5.6 3.2 1.3-6.1L3 9.6l6.3-.7z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      {/* The three questions ---------------------------------------------- */}
      <div className="mt-5 space-y-4 border-t border-stone-200 pt-4">
        {QUESTIONS.map((question) => {
          const chosen = scores[question.id];
          return (
            <fieldset key={question.id}>
              <legend className="text-xs font-bold text-stone-700">
                {question.label}
              </legend>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = chosen === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setScores((current) => ({
                          ...current,
                          // Tapping the active value clears it, so a question
                          // you have no opinion on can go back to unanswered.
                          [question.id]: active ? undefined : value,
                        }))
                      }
                      aria-pressed={active}
                      aria-label={`${question.label} ${value} out of 5${
                        value === 1
                          ? ` - ${question.low}`
                          : value === 5
                            ? ` - ${question.high}`
                            : ""
                      }`}
                      className={`h-9 w-9 rounded-lg text-xs font-bold transition-colors ${
                        active
                          ? "bg-stone-900 text-white shadow-sm"
                          : "bg-white text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>

              {/* Both ends of the scale, always visible. A row of bare numbers
                  means nothing until you know which end is good. */}
              <p className="mt-1.5 flex justify-between text-[11px] text-stone-400">
                <span>1 · {question.low}</span>
                <span>5 · {question.high}</span>
              </p>
            </fieldset>
          );
        })}
      </div>

      {/* Comment ---------------------------------------------------------- */}
      <div className="mt-5 border-t border-stone-200 pt-4">
        <label htmlFor={commentId} className="text-xs font-bold text-stone-700">
          Anything else? (optional)
        </label>
        <textarea
          id={commentId}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          placeholder={`How does it hold up against the ${originalName}? What did you play it through?`}
          className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-500"
        />
        <p className="mt-1 flex justify-between text-[11px] text-stone-400">
          <span>Shown publicly once approved. No personal details, please.</span>
          <span className="tabular-nums">
            {comment.length}/{MAX_COMMENT_LENGTH}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving || rating < 1}
          className="tz-btn bg-stone-900 px-6 py-2.5 text-xs text-white disabled:opacity-40"
        >
          {saving ? "Sending…" : "Submit review"}
        </button>
        {rating < 1 && (
          <p className="text-xs text-stone-500">Pick a star rating to submit.</p>
        )}
        {error && (
          <p aria-live="polite" className="text-xs text-rose-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
