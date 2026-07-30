import type { Metadata } from "next";
import Link from "next/link";

import { AdminLogin } from "@/components/admin/AdminLogin";
import { ReviewCard } from "@/components/admin/ReviewCard";
import { getAllAlternatives } from "@/data/catalogue";
import { isAdminConfigured, isAuthed } from "@/lib/admin-auth";
import {
  isReviewStatus,
  REVIEW_STATUSES,
  type PendingReview,
} from "@/lib/moderation";
import { QUESTION_IDS, type QuestionId } from "@/lib/reviews";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

interface Row {
  id: string;
  alternative_id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  review_note: string | null;
  [key: string]: unknown;
}

/**
 * The review moderation queue.
 *
 * Read with the service-role client. The public RLS policy on `clone_reviews`
 * only exposes approved rows, so the anon key cannot see a pending review at
 * all - which is the entire point of moderating them, and means this page has to
 * use the service role rather than being a nicer view of something visitors
 * could already fetch.
 */
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await isAuthed())) {
    return <AdminLogin configured={isAdminConfigured()} />;
  }

  const { status } = await searchParams;
  const activeStatus = status && isReviewStatus(status) ? status : "pending";

  const supabase = getAdminSupabase();

  let reviews: PendingReview[] = [];
  let error: string | null = null;

  if (!supabase) {
    error = "SUPABASE_SERVICE_ROLE_KEY isn't set, so the queue can't be read.";
  } else {
    const [{ data, error: queryError }, alternatives] = await Promise.all([
      supabase
        .from("clone_reviews")
        .select("*")
        .eq("status", activeStatus)
        .order("created_at", { ascending: false })
        .limit(200),
      // Resolves ids to names, so a card reads as a pedal rather than a uuid.
      getAllAlternatives(),
    ]);

    if (queryError) {
      // The most likely cause by far is that 10-reviews.sql hasn't been run.
      error = `Couldn't read reviews: ${queryError.message}`;
    } else {
      const byId = new Map(
        alternatives.map(({ alternative }) => [alternative.id, alternative]),
      );

      reviews = ((data ?? []) as Row[]).map((row) => {
        const scores: Partial<Record<QuestionId, number>> = {};
        for (const id of QUESTION_IDS) {
          const value = row[id];
          if (typeof value === "number") scores[id] = value;
        }

        const clone = byId.get(row.alternative_id);

        return {
          id: row.id,
          alternativeId: row.alternative_id,
          cloneName: clone?.name ?? null,
          cloneSlug: clone?.slug ?? null,
          rating: Number(row.rating),
          scores,
          comment: row.comment,
          status: row.status as PendingReview["status"],
          createdAt: row.created_at,
          reviewNote: row.review_note,
        };
      });
    }
  }

  return (
    <div className="tz-page py-10">
      <header className="mb-6 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Admin</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900">Reviews</h1>
        <p className="tz-body mt-2 max-w-2xl text-sm text-stone-600">
          Nothing a visitor writes appears on the site until it is approved here.
          Approving also counts the review towards the star average and the tonal
          match percentage shown on that clone everywhere it appears.{" "}
          <span className="font-bold">Scores only</span> keeps the ratings and
          deletes the comment.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link
            href="/admin"
            className="tz-eyebrow text-stone-500 hover:text-amber-700"
          >
            ← Add gear
          </Link>
          <Link
            href="/admin/suggestions"
            className="tz-eyebrow text-stone-500 hover:text-amber-700"
          >
            Suggestions
          </Link>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {REVIEW_STATUSES.map((value) => (
          <Link
            key={value}
            href={
              value === "pending"
                ? "/admin/reviews"
                : `/admin/reviews?status=${value}`
            }
            className={`rounded-full px-3.5 py-2 text-xs font-bold tracking-wide capitalize transition-colors ${
              activeStatus === value
                ? "bg-linear-to-b from-stone-800 to-stone-950 text-white shadow-sm"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900"
            }`}
          >
            {value}
          </Link>
        ))}
      </div>

      {error ? (
        <p className="tz-chamfer border-l-2 border-amber-500 bg-amber-50 p-4 text-sm text-stone-700">
          {error} If this is the first run, apply{" "}
          <code>supabase/seed/10-reviews.sql</code> in the Supabase SQL editor.
        </p>
      ) : reviews.length === 0 ? (
        <p className="tz-chamfer bg-white/70 px-6 py-16 text-center text-sm text-stone-500 ring-1 ring-stone-200">
          Nothing {activeStatus} here.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
