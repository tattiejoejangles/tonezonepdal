import { cache } from "react";

import {
  QUESTION_IDS,
  type CloneReview,
  type QuestionId,
  type ReviewSummary,
} from "@/lib/reviews";
import { getSupabase } from "@/lib/supabase";

/**
 * Approved review data, read on the server.
 *
 * Server-side rather than in the browser, unlike the version this replaces.
 * Reviews are moderated now, so they only change when someone approves one in
 * /admin/reviews - a rare, deliberate act rather than a live vote counter. That
 * makes them cacheable, and caching them is what lets the adjusted tone match
 * appear on listing cards and the compare table instead of only on the one page
 * that fetched its own score after mount. Pages carry `revalidate = 300`, so an
 * approval shows up within five minutes.
 *
 * Every function here degrades to "no reviews" rather than throwing: an
 * unreachable database should cost the review panel, not the page.
 */

interface SummaryRow {
  alternative_id: string;
  average: string | number | null;
  votes: number | string | null;
  [key: string]: unknown;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  [key: string]: unknown;
}

const SUMMARY_COLUMNS =
  "alternative_id, average, votes, sounds_like_avg, sounds_like_votes, build_quality_avg, build_quality_votes, value_avg, value_votes";

const REVIEW_COLUMNS =
  "id, rating, comment, created_at, sounds_like, build_quality, value";

function toSummary(row: SummaryRow): ReviewSummary {
  const questions: ReviewSummary["questions"] = {};

  for (const id of QUESTION_IDS) {
    const average = row[`${id}_avg`];
    const votes = Number(row[`${id}_votes`] ?? 0);
    if (average !== null && average !== undefined && votes > 0) {
      questions[id] = { average: Number(average), votes };
    }
  }

  return {
    average: row.average === null ? null : Number(row.average),
    votes: Number(row.votes ?? 0),
    questions,
  };
}

/**
 * Every clone's aggregate, keyed by alternative id.
 *
 * One query for the whole catalogue rather than one per clone: the home page
 * renders a hundred-odd cards and each one wants its adjusted match.
 */
export const getReviewSummaries = cache(
  async function getReviewSummaries(): Promise<Map<string, ReviewSummary>> {
    const supabase = getSupabase();
    if (!supabase) return new Map();

    try {
      const { data, error } = await supabase
        .from("clone_review_summary")
        .select(SUMMARY_COLUMNS);

      if (error) {
        // Most likely 10-reviews.sql hasn't been applied. Logged once per
        // render; visitors just see the editorial match, as before.
        console.error("[reviews] summary unavailable:", error.message);
        return new Map();
      }

      const summaries = new Map<string, ReviewSummary>();
      for (const row of (data ?? []) as SummaryRow[]) {
        summaries.set(row.alternative_id, toSummary(row));
      }
      return summaries;
    } catch (error) {
      console.error("[reviews] summary errored:", error);
      return new Map();
    }
  },
);

/** The approved reviews for one clone, newest first. */
export async function getApprovedReviews(
  alternativeId: string,
  limit = 30,
): Promise<CloneReview[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("clone_reviews")
      .select(REVIEW_COLUMNS)
      .eq("alternative_id", alternativeId)
      // Redundant against the RLS policy, which already hides everything else.
      // Stated anyway so the query says what it means without the reader having
      // to know the policy exists.
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[reviews] list unavailable:", error.message);
      return [];
    }

    return ((data ?? []) as ReviewRow[]).map((row) => {
      const scores: Partial<Record<QuestionId, number>> = {};
      for (const id of QUESTION_IDS) {
        const value = row[id];
        if (typeof value === "number") scores[id] = value;
      }
      return {
        id: row.id,
        rating: Number(row.rating),
        scores,
        comment: row.comment,
        createdAt: row.created_at,
      };
    });
  } catch (error) {
    console.error("[reviews] list errored:", error);
    return [];
  }
}
