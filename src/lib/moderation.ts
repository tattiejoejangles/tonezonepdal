import type { QuestionId } from "./reviews";

/**
 * A review as the moderation queue sees it.
 *
 * Separate from `CloneReview` in lib/reviews.ts on purpose. That type is what
 * the public page reads back and deliberately carries no status, no note and no
 * voter id, because none of those should be reachable from a component that
 * renders to visitors. This one adds the moderation fields plus the clone's
 * name, which the queue resolves so a row reads as "Mooer Green Mile" instead
 * of an opaque id.
 */
export interface PendingReview {
  id: string;
  alternativeId: string;
  /** Resolved from the catalogue; null if the clone has since been removed. */
  cloneName: string | null;
  cloneSlug: string | null;
  rating: number;
  scores: Partial<Record<QuestionId, number>>;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewNote: string | null;
}

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}
