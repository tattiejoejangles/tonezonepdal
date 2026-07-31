"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { submitSuggestion, type SuggestState } from "@/app/suggest/actions";
import {
  KIND_BLURBS,
  KIND_LABELS,
  SUGGESTION_FIELDS,
  SUGGESTION_KINDS,
  type SuggestionKind,
} from "@/lib/suggestions";

const initial: SuggestState = { ok: false, message: "" };

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-500";

/**
 * The public "make a suggestion" form.
 *
 * Three questions, in the order someone actually thinks about them: what sort
 * of change, what part of the record, then the change itself in their own
 * words. The free-text box is the important one - a fixed set of fields would
 * only ever cover the corrections we thought of in advance, and the whole
 * point is that people spot things we didn't.
 *
 * When it's opened from a pedal page, `target` is prefilled and shown rather
 * than asked for.
 */
export function SuggestForm({
  target,
}: {
  /** Prefilled when reached from a pedal or clone page. */
  target?: { kind: "original" | "alternative"; slug: string; name: string };
}) {
  const [state, action, pending] = useActionState(submitSuggestion, initial);
  const [kind, setKind] = useState<SuggestionKind>("amendment");
  const bodyId = useId();
  const contactId = useId();
  const fieldId = useId();

  if (state.ok) {
    return (
      <div className="tz-chamfer bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-6 w-6 text-emerald-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <p className="tz-heading mt-4 text-xl text-stone-900">Sent</p>
        <p className="tz-body mx-auto mt-2 max-w-sm text-sm text-stone-600">
          {state.message}
        </p>
        <Link
          href={target ? `/${target.kind === "original" ? "pedal" : "clone"}/${target.slug}` : "/pedals"}
          className="tz-btn mt-6 inline-flex bg-stone-900 px-6 py-3 text-xs text-white"
        >
          {target ? `Back to the ${target.name}` : "Browse pedals"}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-7">
      {target && (
        <>
          <input type="hidden" name="target_kind" value={target.kind} />
          <input type="hidden" name="target_slug" value={target.slug} />
          <p className="tz-chamfer border-l-2 border-amber-500 bg-amber-50/70 p-4 text-sm text-stone-700">
            About <span className="font-bold">{target.name}</span>.
          </p>
        </>
      )}

      <fieldset>
        <legend className="tz-eyebrow mb-2 text-stone-500">
          What kind of change?
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {SUGGESTION_KINDS.map((value) => (
            <label
              key={value}
              className={`tz-chamfer cursor-pointer border p-3 transition-colors ${
                kind === value
                  ? "border-amber-500 bg-amber-50"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              <span className="block text-sm font-bold text-stone-900">
                {KIND_LABELS[value]}
              </span>
              <span className="tz-body mt-0.5 block text-xs text-stone-500">
                {KIND_BLURBS[value]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={fieldId} className="tz-eyebrow mb-1.5 block text-stone-500">
          What&apos;s it about?
        </label>
        <select id={fieldId} name="field" defaultValue="price" className={inputClass}>
          {SUGGESTION_FIELDS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={bodyId} className="tz-eyebrow mb-1.5 block text-stone-500">
          The change
        </label>
        <textarea
          id={bodyId}
          name="body"
          rows={6}
          required
          minLength={10}
          maxLength={4000}
          placeholder="What's wrong, or what should be added? Links to back it up are welcome."
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">
          Be as specific as you like - prices, model numbers, sources.
        </p>
      </div>

      <div>
        <label htmlFor={contactId} className="tz-eyebrow mb-1.5 block text-stone-500">
          Email <span className="font-normal normal-case">(optional)</span>
        </label>
        <input
          id={contactId}
          name="contact"
          type="email"
          autoComplete="email"
          maxLength={200}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">
          Only used to follow up on this suggestion.
        </p>
      </div>

      {/* Honeypot: off-screen and hidden from assistive tech, so only a bot
          filling every field will touch it. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="tz-btn bg-stone-900 px-8 py-3 text-xs text-white disabled:opacity-40"
        >
          {pending ? "Sending…" : "Send suggestion"}
        </button>

        {state.message && !state.ok && (
          <p aria-live="polite" className="text-sm text-rose-700">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
