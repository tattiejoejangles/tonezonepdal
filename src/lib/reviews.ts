/**
 * Community reviews: what we ask, and how the answers move the tone match.
 *
 * THE QUESTIONS
 *
 * Three, in plain English, all optional, all scored so five is the good end.
 * The set they replace was five axes named voicing, gain character, dynamics,
 * noise floor and build quality - accurate vocabulary, and unanswerable for
 * someone who owns one overdrive and wants to say whether it was worth £30.
 * These three are each answerable from having used the thing.
 *
 * Ids match the column names in supabase/seed/10-reviews.sql.
 */

export interface Question {
  id: "sounds_like" | "build_quality" | "value";
  /** The question itself, as a question - it is asked, not labelled. */
  label: string;
  /** Anchors for 1 and 5, so the scale isn't left to interpretation. */
  low: string;
  high: string;
  /** Column heading for the summary panel, where a question would be long. */
  short: string;
}

export const QUESTIONS: Question[] = [
  {
    id: "sounds_like",
    label: "Does it sound like the original?",
    low: "Nothing like it",
    high: "Couldn't tell them apart",
    short: "Sounds like it",
  },
  {
    id: "build_quality",
    label: "How well made does it feel?",
    low: "Feels cheap",
    high: "Built to last",
    short: "Build",
  },
  {
    id: "value",
    label: "Worth the money?",
    low: "Not worth it",
    high: "A bargain",
    short: "Value",
  },
];

export type QuestionId = Question["id"];

export const QUESTION_IDS: QuestionId[] = QUESTIONS.map((question) => question.id);

export const MAX_COMMENT_LENGTH = 600;

/** One approved review, as the page reads it back. */
export interface CloneReview {
  id: string;
  /** Overall stars, 1-5. Always present. */
  rating: number;
  scores: Partial<Record<QuestionId, number>>;
  comment: string | null;
  createdAt: string;
}

/** Averages and per-question counts from `clone_review_summary`. */
export interface ReviewSummary {
  average: number | null;
  votes: number;
  questions: Partial<Record<QuestionId, { average: number; votes: number }>>;
}

/**
 * How much weight the community needs before it outvotes the editorial score.
 *
 * At this many answers the two count equally; below it the editorial number
 * leads, above it the community does. Six is chosen so that a single opinion
 * visibly moves the needle without being able to swing it - one 1/5 against an
 * editorial 85 lands at about 73, which reads as "someone disagrees", not as a
 * verdict.
 */
export const MATCH_BLEND_HALF_WEIGHT = 6;

/**
 * Maps a 1-5 answer onto the 0-100 match scale.
 *
 * Linear, with 1 at zero rather than at 20: "nothing like it" means no tonal
 * match, and starting the floor at 20 would make the worst possible review
 * still read as "in the ballpark" on the badge.
 */
function toPercent(score: number): number {
  return ((score - 1) / 4) * 100;
}

/**
 * The tone match actually shown, editorial judgement adjusted by reviews.
 *
 * Only the "does it sound like the original" answer feeds this - it is the one
 * question asking what the match number claims to answer. Build quality and
 * value belong to the review panel and are deliberately kept out: a clone that
 * nails the tone in a flimsy box has a high match and a low build score, and
 * averaging those together would hide both facts.
 *
 * Returns the editorial number untouched when nobody has answered, so an
 * unreviewed clone reads exactly as it did before reviews existed.
 */
export function effectiveMatch(
  editorial: number,
  summary?: ReviewSummary | null,
): number {
  const answered = summary?.questions.sounds_like;
  if (!answered || answered.votes < 1) return editorial;

  const weight = answered.votes / (answered.votes + MATCH_BLEND_HALF_WEIGHT);
  const blended =
    editorial * (1 - weight) + toPercent(answered.average) * weight;

  return Math.round(Math.min(100, Math.max(0, blended)));
}

/** True when reviews have moved the match far enough to be worth explaining. */
export function matchWasAdjusted(editorial: number, effective: number): boolean {
  return Math.abs(effective - editorial) >= 2;
}

/**
 * The match to render for a clone. Every badge on the site goes through here.
 *
 * Takes the shape rather than the two numbers so that call sites read
 * `displayMatch(alternative)` and cannot accidentally pass the editorial number
 * without its reviews - which would silently show the unadjusted score.
 */
export function displayMatch(alternative: {
  matchQuality: number;
  reviewSummary?: ReviewSummary;
}): number {
  return effectiveMatch(alternative.matchQuality, alternative.reviewSummary);
}
