import {
  MATCH_BLEND_HALF_WEIGHT,
  QUESTIONS,
  matchWasAdjusted,
  type CloneReview,
  type ReviewSummary,
} from "@/lib/reviews";

/**
 * "What players say" - the community score and the reviews themselves.
 *
 * Entirely a server component. The version this replaces fetched everything in
 * the browser after mount, because scores could change at any moment and a
 * cached page would show one visitor somebody else's vote. Moderation removes
 * that problem: a review only becomes visible when it is approved, which is a
 * deliberate act on an admin screen, so the five-minute revalidate window the
 * page already has is close enough. Rendering on the server means no loading
 * skeleton, no layout shift, and the same numbers the listing cards use.
 *
 * The form is no longer here at all - it lives behind "Leave a review" at the
 * top of the page, which is where the decision to write one is made.
 */
export function CloneReviews({
  originalName,
  summary,
  reviews,
  editorialMatch,
  effective,
}: {
  originalName: string;
  summary: ReviewSummary | null;
  reviews: CloneReview[];
  /** Our own judgement, for the "we said / owners say" line. */
  editorialMatch: number;
  /** The blended number actually on the badge above. */
  effective: number;
}) {
  const answered = QUESTIONS.filter((question) => summary?.questions[question.id]);
  const votes = summary?.votes ?? 0;
  const withComments = reviews.filter((review) => review.comment?.trim());

  return (
    <section className="mt-10">
      <div className="mb-4 border-b-2 border-stone-900/10 pb-3">
        <h2 className="tz-heading text-xl text-stone-900">What players say</h2>
      </div>

      {/* One column now. The form used to sit in a second lane here and, being
          nine controls tall, dominated the reviews it was meant to sit beside.
          It lives behind "Leave a review" at the top of the page instead. */}
      <div className="grid gap-6">
        <div className="space-y-6">
          {/* The score ------------------------------------------------------ */}
          <div className="tz-panel p-6">
            {votes > 0 && summary?.average != null ? (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="tz-heading text-4xl text-stone-900 tabular-nums">
                    {summary.average.toFixed(1)}
                    <span className="text-xl text-stone-400">/5</span>
                  </p>
                  <Stars value={summary.average} />
                  <p className="tz-body text-sm text-stone-500">
                    from {votes} {votes === 1 ? "player" : "players"}
                  </p>
                </div>

                {answered.length > 0 && (
                  <dl className="mt-5 space-y-3 border-t border-stone-100 pt-4">
                    {answered.map((question) => {
                      const score = summary.questions[question.id]!;
                      return (
                        <div key={question.id}>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-xs font-bold text-stone-700">
                              {question.short}
                            </dt>
                            <dd className="text-xs text-stone-500 tabular-nums">
                              <span className="font-bold text-stone-900">
                                {score.average.toFixed(1)}
                              </span>
                              <span className="ml-1">
                                · {score.votes}{" "}
                                {score.votes === 1 ? "answer" : "answers"}
                              </span>
                            </dd>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-stone-200">
                            <div
                              className="h-full rounded bg-amber-500"
                              style={{ width: `${(score.average / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </dl>
                )}

                {/* Says out loud that reviews moved the badge. A number that
                    quietly disagrees with the one we published is the sort of
                    thing that reads as a bug rather than as feedback. */}
                {matchWasAdjusted(editorialMatch, effective) && (
                  <p className="tz-body mt-4 border-t border-stone-100 pt-4 text-xs text-stone-500">
                    We rated the tonal match{" "}
                    <span className="font-bold text-stone-700 tabular-nums">
                      {editorialMatch}%
                    </span>
                    . With reviews factored in it now reads{" "}
                    <span className="font-bold text-stone-900 tabular-nums">
                      {effective}%
                    </span>
                    . Owners&apos; answers count for more as more of them arrive -
                    they carry equal weight with our own rating at{" "}
                    {MATCH_BLEND_HALF_WEIGHT} answers.
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="tz-heading text-base text-stone-900">
                  No reviews yet
                </h3>
                <p className="tz-body mt-1.5 text-sm text-stone-500">
                  Be the first to say how close this gets to the {originalName}.
                  Reviews also adjust the tonal match shown at the top of this
                  page.
                </p>
              </>
            )}
          </div>

          {/* The reviews --------------------------------------------------- */}
          {withComments.length > 0 && (
            <ul className="space-y-3">
              {withComments.map((review) => (
                <li
                  key={review.id}
                  className="tz-panel p-4"
                >
                  <div className="flex items-center gap-2">
                    <Stars value={review.rating} size="sm" />
                    <span className="text-xs font-bold text-stone-500 tabular-nums">
                      {review.rating}/5
                    </span>
                    <time
                      dateTime={review.createdAt}
                      className="ml-auto text-[11px] text-stone-400 tabular-nums"
                    >
                      {new Date(review.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <p className="tz-body mt-2 text-sm text-stone-700">
                    {review.comment}
                  </p>

                  {/* The answers behind the stars, as short chips. */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {QUESTIONS.map((question) => {
                      const score = review.scores[question.id];
                      if (score === undefined) return null;
                      return (
                        <span
                          key={question.id}
                          className="rounded bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600"
                        >
                          {question.short}{" "}
                          <span className="font-bold text-stone-900 tabular-nums">
                            {score}/5
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </section>
  );
}

/** Five stars filled to `value` out of 5, in half-star steps. */
function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <span
      className="flex gap-0.5"
      role="img"
      aria-label={`${value.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        // Clipped rather than swapped for a half-star glyph, so the partial
        // star is exactly the same shape as the full ones beside it.
        const fill = Math.min(1, Math.max(0, value - star + 1));
        return (
          <span key={star} className={`relative ${box}`}>
            <StarGlyph className="absolute inset-0 text-stone-300" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <StarGlyph
                  className={`absolute inset-y-0 left-0 text-amber-500 ${box}`}
                  filled
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function StarGlyph({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.1-5.6-3.2-5.6 3.2 1.3-6.1L3 9.6l6.3-.7z" />
    </svg>
  );
}
