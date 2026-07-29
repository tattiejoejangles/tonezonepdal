/**
 * Shared vocabulary for user suggestions.
 *
 * Lives outside both the form and the admin so the two agree on what a
 * "kind" is - the values here must match the CHECK constraints in
 * supabase/seed/07-suggestions.sql exactly.
 */

export const SUGGESTION_KINDS = ["addition", "amendment", "removal"] as const;
export type SuggestionKind = (typeof SUGGESTION_KINDS)[number];

export const KIND_LABELS: Record<SuggestionKind, string> = {
  addition: "Add something",
  amendment: "Correct something",
  removal: "Remove something",
};

export const KIND_BLURBS: Record<SuggestionKind, string> = {
  addition: "A missing pedal, a clone we don't list, an artist who used it.",
  amendment: "A wrong price, a bad description, a spec that isn't right.",
  removal: "Something that shouldn't be here, or a link that's wrong.",
};

export const SUGGESTION_STATUSES = ["pending", "approved", "rejected"] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

/**
 * What part of a record a suggestion is about.
 *
 * Free text in the database so this list can grow without a migration, but
 * offered as a fixed set in the form because "price" and "Price" and "cost"
 * are the same field and shouldn't become three.
 */
export const SUGGESTION_FIELDS = [
  { id: "new-original", label: "A pedal or amp you don't list" },
  { id: "new-clone", label: "A budget alternative you don't list" },
  { id: "price", label: "Price" },
  { id: "artists", label: "Artists who used it" },
  { id: "specs", label: "Specs" },
  { id: "description", label: "Description or blurb" },
  { id: "pros-cons", label: "Pros and cons" },
  { id: "match", label: "How close the match is" },
  { id: "image", label: "Photo" },
  { id: "link", label: "A retailer link" },
  { id: "other", label: "Something else" },
] as const;

export interface Suggestion {
  id: string;
  createdAt: string;
  kind: SuggestionKind;
  targetKind: "original" | "alternative" | null;
  targetSlug: string | null;
  field: string;
  body: string;
  payload: Record<string, unknown> | null;
  contact: string | null;
  status: SuggestionStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
}

/** Human label for a field id, falling back to the raw value. */
export function fieldLabel(id: string): string {
  return SUGGESTION_FIELDS.find((field) => field.id === id)?.label ?? id;
}

export function isSuggestionKind(value: string): value is SuggestionKind {
  return (SUGGESTION_KINDS as readonly string[]).includes(value);
}

export function isSuggestionStatus(value: string): value is SuggestionStatus {
  return (SUGGESTION_STATUSES as readonly string[]).includes(value);
}
