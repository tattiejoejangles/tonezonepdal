"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createPedal, updatePedal, type ActionState } from "@/app/admin/actions";
import { categoriesFor, gearTypeOf, type GearType } from "@/lib/gear";
import { fieldsFor, resolveSpecs, SPEC_FIELDS } from "@/lib/specs";
import { CATEGORIES, type Category, type Spec } from "@/lib/types";

export interface OriginalOption {
  id: string;
  name: string;
  brand: string;
  /** So picking "amp" can narrow the list of originals a clone may link to. */
  category: Category;
}

/** An existing record, for the edit form. */
export interface PedalDraft {
  id: string;
  slug: string;
  kind: "original" | "alternative";
  name: string;
  brand: string;
  priceGBP: number;
  blurb: string;
  popularity: number;
  imageUrl: string | null;
  imageCredit: string;
  aliases: string[];
  artists: string[];
  searchQuery: string;
  specs: Spec[];
  /** Originals only. */
  category?: string;
  description?: string;
  tags?: string[];
  /** Alternatives only. */
  originalId?: string;
  matchQuality?: number;
  pros?: string[];
  cons?: string[];
  verdict?: string;
  gallery?: string[];
}

const initialState: ActionState = { ok: false, message: "" };

/* All inputs use text-base (16px). Anything smaller makes iOS Safari zoom the
   viewport the moment a field takes focus, which on a long form like this is
   genuinely unusable. */
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-500";

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

const listText = (values?: string[]) => (values ?? []).join("\n");
const csvText = (values?: string[]) => (values ?? []).join(", ");

/**
 * The stored value for one spec field.
 *
 * Resolved through the vocabulary rather than matched on the label directly, so
 * a record still holding an old spelling - "Current Draw", or Width/Depth/Height
 * instead of one Dimensions - prefills the right box instead of appearing empty
 * and being silently wiped on the next save.
 */
const specValue = (values: Spec[] | undefined, label: string) =>
  resolveSpecs(values ?? []).find((spec) => spec.label === label)?.value ?? "";

/**
 * Amp or pedal, for an existing record.
 *
 * A clone has no category of its own - it is whatever it copies - so its gear
 * type has to come from the original it is linked to. Without that step an amp
 * clone opened as "pedal", which now matters: the spec fields on offer depend
 * on the gear type, so it would have been shown the pedal set and saving would
 * have dropped its Speaker, Valves and Channels.
 */
function initialGear(
  draft: PedalDraft | undefined,
  originals: OriginalOption[],
): GearType {
  if (!draft) return "pedal";
  if (draft.category) return gearTypeOf(draft.category as Category);

  const parent = originals.find((original) => original.id === draft.originalId);
  return parent ? gearTypeOf(parent.category) : "pedal";
}

/**
 * One form for both adding and editing.
 *
 * Passing `draft` switches it to edit: the action becomes an update, every
 * field is prefilled, and the kind is fixed — an original cannot be turned
 * into an alternative, because its id is what the clones point at.
 */
export function PedalForm({
  originals,
  draft,
}: {
  originals: OriginalOption[];
  draft?: PedalDraft;
}) {
  const editing = draft !== undefined;
  const [state, action, pending] = useActionState(
    editing ? updatePedal : createPedal,
    initialState,
  );
  const [kind, setKind] = useState<"original" | "alternative">(
    draft?.kind ?? "original",
  );

  /**
   * Amp or pedal, asked first.
   *
   * It used to be implied by whichever of the nine categories you happened to
   * pick, which meant "amp" sat in a list of effect types it has nothing in
   * common with and was easy to miss entirely. Answering it up front narrows
   * everything below: the category list for an original, and which originals a
   * clone may be linked to.
   */
  const [gear, setGear] = useState<GearType>(() => initialGear(draft, originals));

  const isOriginal = kind === "original";
  const categories = categoriesFor(gear, CATEGORIES);
  const linkable = originals.filter(
    (original) => gearTypeOf(original.category) === gear,
  );

  return (
    <form action={action} className="space-y-8">
      {editing && (
        <>
          <input type="hidden" name="id" value={draft.id} />
          <input type="hidden" name="slug" value={draft.slug} />
          <input type="hidden" name="kind" value={draft.kind} />
        </>
      )}

      {/* Gear type - the first question ------------------------------------ */}
      {!editing && (
        <fieldset>
          <legend className="tz-eyebrow mb-2 text-stone-500">
            Is it an amp or a pedal?
          </legend>
          <div className="flex flex-wrap gap-2">
            {(["pedal", "amp"] as const).map((value) => (
              <label
                key={value}
                className={`tz-btn cursor-pointer px-5 py-2.5 text-xs tracking-wider uppercase ${
                  gear === value
                    ? "bg-linear-to-b from-amber-500 to-orange-600 text-white shadow-md"
                    : "bg-white text-stone-600 ring-1 ring-stone-200"
                }`}
              >
                <input
                  type="radio"
                  name="gear_type"
                  value={value}
                  checked={gear === value}
                  onChange={() => setGear(value)}
                  className="sr-only"
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Kind ------------------------------------------------------------- */}
      {!editing && (
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
                {value === "original" ? `Original ${gear}` : "Alternative"}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {isOriginal
              ? `The expensive ${gear} people want a cheaper version of.`
              : `A budget ${gear} that gets close to an original - you'll link it below.`}
          </p>
        </fieldset>
      )}

      {/* The link ---------------------------------------------------------- */}
      {!isOriginal && (
        <div className="rounded-xl border-l-2 border-amber-500 bg-amber-50/60 p-4">
          <Field
            label="This is an alternative to *"
            hint="Pick the original it copies. This is what links the two together."
          >
            <select
              name="original_id"
              required
              defaultValue={draft?.originalId ?? ""}
              className={inputClass}
            >
              <option value="" disabled>
                Choose an original...
              </option>
              {/* Narrowed to the chosen gear type, so an amp clone can't be
                  hung off a fuzz pedal by a mis-click. */}
              {linkable.map((original) => (
                <option key={original.id} value={original.id}>
                  {original.name} ({original.brand})
                </option>
              ))}
            </select>
          </Field>

          {linkable.length === 0 && (
            <p className="mt-2 text-xs text-rose-700">
              No {gear}s in the catalogue yet - add the original {gear} first.
            </p>
          )}
        </div>
      )}

      {/* Core -------------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *" hint="e.g. “Boss BD-2 Blues Driver”.">
          <input name="name" required defaultValue={draft?.name} className={inputClass} />
        </Field>

        <Field label="Brand *">
          <input name="brand" required defaultValue={draft?.brand} className={inputClass} />
        </Field>

        <Field label="Price £ *" hint="Typical UK street price.">
          <input
            name="price_gbp"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            required
            defaultValue={draft?.priceGBP}
            className={inputClass}
          />
        </Field>

        {isOriginal ? (
          <Field label="Category *">
            {/* Keyed on `gear` so switching amp/pedal re-mounts the select and
                its default lands inside the newly narrowed list, instead of
                keeping a now-invalid value from the other type. */}
            <select
              key={gear}
              name="category"
              defaultValue={
                draft?.category && categories.includes(draft.category as Category)
                  ? draft.category
                  : categories[0]
              }
              className={inputClass}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Tonal match %" hint="0-100. How close it gets to the original.">
            <input
              name="match_quality"
              type="number"
              min="0"
              max="100"
              inputMode="numeric"
              defaultValue={draft?.matchQuality ?? 70}
              className={inputClass}
            />
          </Field>
        )}
      </div>

      <Field label="Blurb *" hint="One line. Shows on every card.">
        <input name="blurb" required defaultValue={draft?.blurb} className={inputClass} />
      </Field>

      {isOriginal && (
        <Field label="Description" hint="Longer copy for the pedal's own page.">
          <textarea
            name="description"
            rows={5}
            defaultValue={draft?.description}
            className={inputClass}
          />
        </Field>
      )}

      {/* Image ------------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Image URL" hint="Leave blank to show the “photo needed” plate.">
          <input
            name="image_url"
            type="url"
            defaultValue={draft?.imageUrl ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="Image credit" hint="e.g. “wikimedia - CC BY 2.0”.">
          <input
            name="image_credit"
            defaultValue={draft?.imageCredit}
            className={inputClass}
          />
        </Field>
      </div>

      {!isOriginal && (
        <Field label="Gallery URLs" hint="One per line. Extra shots for the popup.">
          <textarea
            name="gallery"
            rows={3}
            defaultValue={listText(draft?.gallery)}
            className={inputClass}
          />
        </Field>
      )}

      {/* Alternative-only judgement ---------------------------------------- */}
      {!isOriginal && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pros" hint="One per line.">
              <textarea
                name="pros"
                rows={4}
                defaultValue={listText(draft?.pros)}
                className={inputClass}
              />
            </Field>
            <Field label="Cons" hint="One per line. Honesty here is the whole point.">
              <textarea
                name="cons"
                rows={4}
                defaultValue={listText(draft?.cons)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Verdict" hint="What players report. Shows as “What players say”.">
            <textarea
              name="verdict"
              rows={3}
              defaultValue={draft?.verdict}
              className={inputClass}
            />
          </Field>
        </>
      )}

      {/* Search and metadata ------------------------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isOriginal && (
          <Field label="Tags" hint="Comma separated. What people actually type: ts9, klon.">
            <input name="tags" defaultValue={csvText(draft?.tags)} className={inputClass} />
          </Field>
        )}

        <Field label="Aliases" hint="Comma separated. Alternate retail names.">
          <input
            name="aliases"
            defaultValue={csvText(draft?.aliases)}
            className={inputClass}
          />
        </Field>

        <Field label="Artists" hint="Comma separated. Players associated with this pedal.">
          <input
            name="artists"
            defaultValue={csvText(draft?.artists)}
            className={inputClass}
          />
        </Field>

        <Field label="Popularity" hint="0-100. Drives the “most popular” ordering.">
          <input
            name="popularity"
            type="number"
            min="0"
            max="100"
            inputMode="numeric"
            defaultValue={draft?.popularity ?? 50}
            className={inputClass}
          />
        </Field>

        <Field
          label="Retailer search override"
          hint="Only if the display name searches badly on shops."
        >
          <input
            name="search_query"
            defaultValue={draft?.searchQuery}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Specs: one input per vocabulary field, in the order they display.
          This was a free textarea of "Label | value" lines, which is how the
          catalogue reached ~60 labels for a dozen facts - "Current Draw" beside
          "Current draw", dimensions split three ways, values typed into the
          label. Offering the fields themselves means every pedal describes
          itself in the same words, which is what makes two of them comparable
          line for line. */}
      <fieldset className="border-t border-stone-200 pt-6">
        <legend className="tz-heading text-lg text-stone-900">Specs</legend>
        <p className="tz-body mt-1 mb-4 text-sm text-stone-500">
          Leave a field blank if it isn&apos;t confirmed - the site says
          &ldquo;not listed&rdquo; rather than guessing, and the comparison
          counts how many are filled in.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {fieldsFor(gear).map((field) => (
            <Field key={field.id} label={field.label} hint={field.hint}>
              <input
                name={`specs_${field.id}`}
                defaultValue={specValue(draft?.specs, field.label)}
                placeholder={field.placeholder}
                className={inputClass}
              />
            </Field>
          ))}
        </div>

        {/* Values belonging to the other gear type are carried through hidden
            rather than left out of the form. A field with no input submits as
            blank and the action treats blank as "clear it", so without this an
            amp opened as a pedal - or a gear type toggled by accident - would
            silently drop its Speaker, Valves and Channels on save. */}
        {SPEC_FIELDS.filter(
          (field) =>
            !fieldsFor(gear).some((shown) => shown.id === field.id) &&
            specValue(draft?.specs, field.label),
        ).map((field) => (
          <input
            key={field.id}
            type="hidden"
            name={`specs_${field.id}`}
            value={specValue(draft?.specs, field.label)}
          />
        ))}
      </fieldset>

      {/* Submit ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4 border-t border-stone-200 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="tz-btn bg-linear-to-b from-stone-800 to-stone-950 px-8 py-3 text-sm tracking-wider text-white uppercase disabled:opacity-40"
        >
          {pending
            ? "Saving..."
            : editing
              ? "Save changes"
              : `Add ${isOriginal ? "original" : "alternative"}`}
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
