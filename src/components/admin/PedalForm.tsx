"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createPedal, type ActionState } from "@/app/admin/actions";
import { CATEGORIES } from "@/lib/types";

export interface OriginalOption {
  id: string;
  name: string;
  brand: string;
}

const initial: ActionState = { ok: false, message: "" };

/* All inputs use text-base (16px). Anything smaller makes iOS Safari zoom the
   viewport the moment a field takes focus, which on a long form like this is
   genuinely unusable. */
const inputClass =
  "w-full border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-500";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="tz-eyebrow mb-1.5 block text-stone-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function PedalForm({ originals }: { originals: OriginalOption[] }) {
  const [state, action, pending] = useActionState(createPedal, initial);
  const [kind, setKind] = useState<"original" | "alternative">("original");

  const isOriginal = kind === "original";

  return (
    <form action={action} className="space-y-8">
      {/* Kind ------------------------------------------------------------- */}
      <fieldset>
        <legend className="tz-eyebrow mb-2 text-stone-500">
          What are you adding?
        </legend>
        <div className="flex flex-wrap gap-2">
          {(["original", "alternative"] as const).map((value) => (
            <label
              key={value}
              className={`tz-btn cursor-pointer px-5 py-2.5 text-xs tracking-wider uppercase ${
                kind === value
                  ? "bg-linear-to-b from-stone-800 to-stone-950 text-white shadow-md"
                  : "bg-white text-stone-600 ring-1 ring-stone-200"
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
              {value === "original" ? "Original pedal" : "Alternative / clone"}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {isOriginal
            ? "The expensive pedal people want a cheaper version of."
            : "A budget pedal that gets close to an original — you'll link it below."}
        </p>
      </fieldset>

      {/* The link ---------------------------------------------------------- */}
      {!isOriginal && (
        <div className="border-l-2 border-amber-500 bg-amber-50/60 p-4">
          <Field
            label="This is a clone of *"
            hint="Pick the original it copies. This is what links the two together."
          >
            <select name="original_id" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Choose an original…
              </option>
              {originals.map((original) => (
                <option key={original.id} value={original.id}>
                  {original.name} ({original.brand})
                </option>
              ))}
            </select>
          </Field>
          {originals.length === 0 && (
            <p className="mt-2 text-xs text-rose-700">
              No originals exist yet — add one first.
            </p>
          )}
        </div>
      )}

      {/* Core -------------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *" hint="e.g. “Boss BD-2 Blues Driver”.">
          <input name="name" required className={inputClass} />
        </Field>

        <Field label="Brand *">
          <input name="brand" required className={inputClass} />
        </Field>

        <Field label="Price £ *" hint="Typical UK street price.">
          <input
            name="price_gbp"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            required
            className={inputClass}
          />
        </Field>

        {isOriginal ? (
          <Field label="Category *">
            <select name="category" defaultValue="overdrive" className={inputClass}>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field
            label="Tonal match %"
            hint="0–100. How close it gets to the original."
          >
            <input
              name="match_quality"
              type="number"
              min="0"
              max="100"
              defaultValue="70"
              inputMode="numeric"
              className={inputClass}
            />
          </Field>
        )}
      </div>

      <Field label="Blurb *" hint="One line. Shows on every card.">
        <input name="blurb" required className={inputClass} />
      </Field>

      {isOriginal && (
        <Field label="Description" hint="Longer copy for the pedal's own page.">
          <textarea name="description" rows={5} className={inputClass} />
        </Field>
      )}

      {/* Image ------------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Image URL" hint="Leave blank to show the “photo needed” plate.">
          <input name="image_url" type="url" className={inputClass} />
        </Field>

        <Field label="Image credit" hint="e.g. “wikimedia — CC BY 2.0”.">
          <input name="image_credit" className={inputClass} />
        </Field>
      </div>

      {!isOriginal && (
        <Field label="Gallery URLs" hint="One per line. Extra shots for the popup.">
          <textarea name="gallery" rows={3} className={inputClass} />
        </Field>
      )}

      {/* Alternative-only judgement ---------------------------------------- */}
      {!isOriginal && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pros" hint="One per line.">
            <textarea name="pros" rows={4} className={inputClass} />
          </Field>
          <Field label="Cons" hint="One per line. Honesty here is the whole point.">
            <textarea name="cons" rows={4} className={inputClass} />
          </Field>
        </div>
      )}

      {!isOriginal && (
        <Field label="Verdict" hint="What players report. Shows as “What players say”.">
          <textarea name="verdict" rows={3} className={inputClass} />
        </Field>
      )}

      {/* Search and metadata ------------------------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isOriginal && (
          <Field label="Tags" hint="Comma separated. What people actually type: ts9, klon.">
            <input name="tags" className={inputClass} />
          </Field>
        )}

        <Field label="Aliases" hint="Comma separated. Alternate retail names.">
          <input name="aliases" className={inputClass} />
        </Field>

        <Field
          label="Artists"
          hint="Comma separated. Players associated with this pedal."
        >
          <input name="artists" className={inputClass} />
        </Field>

        <Field label="Popularity" hint="0–100. Drives the “most popular” ordering.">
          <input
            name="popularity"
            type="number"
            min="0"
            max="100"
            defaultValue="50"
            inputMode="numeric"
            className={inputClass}
          />
        </Field>

        <Field
          label="Retailer search override"
          hint="Only if the display name searches badly on shops."
        >
          <input name="search_query" className={inputClass} />
        </Field>
      </div>

      <Field
        label="Controls"
        hint="One per line as: Name | what it does. Leave blank if unverified — the site says so rather than guessing."
      >
        <textarea
          name="controls"
          rows={4}
          placeholder={"Drive | How hard it clips.\nTone | Treble roll-off."}
          className={inputClass}
        />
      </Field>

      {/* Submit ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4 border-t border-stone-200 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="tz-btn bg-linear-to-b from-stone-800 to-stone-950 px-8 py-3 text-sm tracking-wider text-white uppercase disabled:opacity-40"
        >
          {pending ? "Saving…" : `Add ${isOriginal ? "original" : "alternative"}`}
        </button>

        {state.message && (
          <p
            aria-live="polite"
            className={`text-sm font-medium ${
              state.ok ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {state.message}{" "}
            {state.ok && state.href && (
              <Link href={state.href} className="underline hover:text-stone-900">
                View it
              </Link>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
