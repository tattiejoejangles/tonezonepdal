"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { updateArtist, type ActionState } from "@/app/admin/actions";
import { artistKey } from "@/lib/artists";
import { useIsAdmin } from "@/lib/use-admin";

const initial: ActionState = { ok: false, message: "" };

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-amber-500";

/**
 * The pen on an artist's card, and the panel it opens.
 *
 * Renders nothing at all unless this browser is signed into admin, so visitors
 * see the artist grid exactly as before.
 *
 * Edits go to the `artists` table keyed on `match_key`, which is derived here
 * with the same `artistKey` the read path uses. That is what makes one edit
 * land everywhere: pedals store artist names as free text and every page
 * resolves them through that key at render, so a photo saved from the Tube
 * Screamer's page appears on every other pedal naming the same player without
 * anything else being touched.
 *
 * The artist need not already have a row - the action upserts - which matters
 * because the table was seeded from the names present when it was created and
 * anything added to a pedal since has no row yet.
 */
export function ArtistEditor({
  name,
  imageUrl,
  imageCredit,
  knownFor,
}: {
  name: string;
  imageUrl: string | null;
  imageCredit: string | null;
  /** The band, as stored. Shown under the name on the card. */
  knownFor: string | null;
}) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Edit ${name}`}
        title={`Edit ${name}`}
        className="absolute top-1 right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/85 text-white opacity-0 transition hover:bg-amber-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none group-hover:opacity-100 max-sm:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      {open && (
        <ArtistDialog
          name={name}
          imageUrl={imageUrl}
          imageCredit={imageCredit}
          knownFor={knownFor}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ArtistDialog({
  name,
  imageUrl,
  imageCredit,
  knownFor,
  onClose,
}: {
  name: string;
  imageUrl: string | null;
  imageCredit: string | null;
  knownFor: string | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(updateArtist, initial);
  // Mirrors the field so the preview updates as the URL is pasted - the most
  // likely mistake is a link to a page rather than an image, and seeing that
  // fail here beats finding out on the live card.
  const [url, setUrl] = useState(imageUrl ?? "");
  const titleId = useId();
  const urlId = useId();
  const bandId = useId();
  const creditId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Closes on a successful save so the card behind is seen updating. The
  // action revalidates the layout, so the new photo is already on its way.
  useEffect(() => {
    if (state.ok) {
      const timer = setTimeout(onClose, 700);
      return () => clearTimeout(timer);
    }
  }, [state.ok, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="tz-fade fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <form
        action={action}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="tz-pop relative max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain bg-white p-5 shadow-2xl sm:max-h-[88dvh] sm:rounded-2xl sm:p-6"
      >
        <input type="hidden" name="match_key" value={artistKey(name)} />
        <input type="hidden" name="name" value={name} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tz-eyebrow text-amber-700">Edit artist</p>
            <h2 id={titleId} className="tz-heading mt-1 text-xl text-stone-900">
              {name}
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-stone-400">
              key: {artistKey(name)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <p className="tz-body mt-3 border-l-2 border-amber-500 bg-amber-50/70 p-3 text-xs text-stone-600">
          Saved against the artist, not this pedal - the photo and band appear on
          every pedal and amp that names them.
        </p>

        <div className="mt-4 flex gap-4">
          <div className="tz-chamfer relative aspect-square w-24 shrink-0 overflow-hidden bg-stone-900 ring-1 ring-stone-200">
            {url ? (
              /* Arbitrary pasted hosts can't pass next/image's allowlist. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-300/90">
                {name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <label htmlFor={bandId} className="tz-eyebrow mb-1 block text-stone-500">
                Band
              </label>
              <input
                id={bandId}
                name="known_for"
                defaultValue={knownFor ?? ""}
                placeholder="Radiohead"
                className={inputClass}
              />
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
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://upload.wikimedia.org/…"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label htmlFor={creditId} className="tz-eyebrow mb-1 block text-stone-500">
            Credit
          </label>
          <input
            id={creditId}
            name="image_credit"
            defaultValue={imageCredit ?? ""}
            placeholder="wikimedia - CC BY-SA 4.0"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-stone-400">
            Mind the licensing - press shots are usually copyrighted. Wikimedia
            Commons is the safe source.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="tz-btn bg-linear-to-b from-stone-800 to-stone-950 px-6 py-2.5 text-xs tracking-wider text-white uppercase disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save artist"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold tracking-wider text-stone-500 uppercase hover:text-stone-900"
          >
            Cancel
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
    </div>,
    document.body,
  );
}
