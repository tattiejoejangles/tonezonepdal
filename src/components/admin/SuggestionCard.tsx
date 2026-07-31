"use client";

import Link from "next/link";
import { useActionState } from "react";

import { reviewSuggestion, type ActionState } from "@/app/admin/actions";
import { fieldLabel, KIND_LABELS, type Suggestion } from "@/lib/suggestions";

const initial: ActionState = { ok: false, message: "" };

const KIND_TONE: Record<string, string> = {
  addition: "bg-emerald-100 text-emerald-800",
  amendment: "bg-amber-100 text-amber-800",
  removal: "bg-rose-100 text-rose-800",
};

/**
 * One suggestion in the review queue, with its decision buttons.
 *
 * Approve and reject are the same server action with a different `decision`,
 * and an already-reviewed card offers "move back to pending" so a misclick
 * isn't final.
 */
export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const [state, action, pending] = useActionState(reviewSuggestion, initial);

  const href =
    suggestion.targetSlug && suggestion.targetKind
      ? `/${suggestion.targetKind === "original" ? "pedal" : "clone"}/${suggestion.targetSlug}`
      : null;

  return (
    <article className="tz-chamfer bg-white p-5 tz-card ring-1 ring-stone-200/60">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`tz-eyebrow rounded px-2.5 py-1 ${
            KIND_TONE[suggestion.kind] ?? "bg-stone-100 text-stone-700"
          }`}
        >
          {KIND_LABELS[suggestion.kind]}
        </span>
        <span className="text-xs font-bold text-stone-500">
          {fieldLabel(suggestion.field)}
        </span>

        {href ? (
          <Link
            href={href}
            className="text-xs font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900"
          >
            {suggestion.targetSlug}
          </Link>
        ) : (
          <span className="text-xs text-stone-400">Not about an existing entry</span>
        )}

        <time
          dateTime={suggestion.createdAt}
          className="ml-auto text-xs text-stone-400 tabular-nums"
        >
          {new Date(suggestion.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>

      <p className="tz-body mt-3 text-sm whitespace-pre-wrap text-stone-700">
        {suggestion.body}
      </p>

      {suggestion.payload && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
          {JSON.stringify(suggestion.payload, null, 2)}
        </pre>
      )}

      {suggestion.contact && (
        <p className="mt-3 text-xs text-stone-500">
          Contact: <span className="font-bold">{suggestion.contact}</span>
        </p>
      )}

      <form action={action} className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
        <input type="hidden" name="id" value={suggestion.id} />

        {suggestion.status === "pending" ? (
          <>
            <button
              type="submit"
              name="decision"
              value="approved"
              disabled={pending}
              className="tz-btn bg-emerald-600 px-5 py-2 text-xs tracking-wider text-white uppercase disabled:opacity-40"
            >
              Approve
            </button>
            <button
              type="submit"
              name="decision"
              value="rejected"
              disabled={pending}
              className="tz-btn bg-white px-5 py-2 text-xs tracking-wider text-stone-700 uppercase ring-1 ring-stone-200 disabled:opacity-40"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <span
              className={`tz-eyebrow rounded px-2.5 py-1 ${
                suggestion.status === "approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {suggestion.status}
            </span>
            <button
              type="submit"
              name="decision"
              value="pending"
              disabled={pending}
              className="text-xs font-bold tracking-wider text-stone-500 uppercase hover:text-stone-900 disabled:opacity-40"
            >
              Move back to pending
            </button>
          </>
        )}

        {state.message && (
          <p
            aria-live="polite"
            className={`w-full text-xs ${state.ok ? "text-emerald-700" : "text-rose-700"}`}
          >
            {state.message}
          </p>
        )}
      </form>
    </article>
  );
}
