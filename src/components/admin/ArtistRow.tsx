"use client";

import { useActionState, useId } from "react";

import { updateArtist, type ActionState } from "@/app/admin/actions";
import type { Artist } from "@/lib/artists";

const initial: ActionState = { ok: false, message: "" };

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-amber-500";

/**
 * One artist's editable row, with a live preview of the photo.
 *
 * The preview is the point: pasting a URL that turns out to be a hotlink-
 * blocked page rather than an image is the most likely mistake, and seeing it
 * fail here beats finding out on a pedal page.
 */
export function ArtistRow({ artist }: { artist: Artist }) {
  const [state, action, pending] = useActionState(updateArtist, initial);
  const urlId = useId();
  const nameId = useId();
  const creditId = useId();
  const knownForId = useId();
  const aliasId = useId();

  return (
    <form
      action={action}
      className="tz-chamfer bg-white p-4"
    >
      <input type="hidden" name="match_key" value={artist.matchKey} />

      <div className="flex gap-4">
        <div className="tz-chamfer relative aspect-square w-24 shrink-0 overflow-hidden bg-stone-900">
          {artist.imageUrl ? (
            /* Arbitrary pasted hosts can't pass next/image's allowlist. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-300/90">
              {artist.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("")}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <label htmlFor={nameId} className="tz-eyebrow mb-1 block text-stone-500">
              Name
            </label>
            <input
              id={nameId}
              name="name"
              defaultValue={artist.name}
              required
              className={inputClass}
            />
            <p className="mt-1 font-mono text-[11px] text-stone-400">
              key: {artist.matchKey}
            </p>
          </div>

          <div>
            <label htmlFor={urlId} className="tz-eyebrow mb-1 block text-stone-500">
              Photo URL
            </label>
            <input
              id={urlId}
              name="image_url"
              type="url"
              inputMode="url"
              defaultValue={artist.imageUrl ?? ""}
              placeholder="https://upload.wikimedia.org/…"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor={creditId} className="tz-eyebrow mb-1 block text-stone-500">
            Credit
          </label>
          <input
            id={creditId}
            name="image_credit"
            defaultValue={artist.imageCredit ?? ""}
            placeholder="wikimedia - CC BY-SA 4.0"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={knownForId} className="tz-eyebrow mb-1 block text-stone-500">
            Known for
          </label>
          <input
            id={knownForId}
            name="known_for"
            defaultValue={artist.knownFor ?? ""}
            placeholder="Radiohead"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={aliasId} className="tz-eyebrow mb-1 block text-stone-500">
            Aliases
          </label>
          <input
            id={aliasId}
            name="aliases"
            defaultValue={artist.aliases.join(", ")}
            placeholder="noel gallager, n gallagher"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="tz-btn bg-stone-900 px-5 py-2 text-xs text-white disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state.message && (
          <p
            aria-live="polite"
            className={`text-xs ${state.ok ? "text-emerald-700" : "text-rose-700"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
