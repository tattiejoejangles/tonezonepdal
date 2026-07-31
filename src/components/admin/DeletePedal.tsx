"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { deletePedal, type ActionState } from "@/app/admin/actions";

const initialState: ActionState = { ok: false, message: "" };

/**
 * Delete, behind a confirm step.
 *
 * Two clicks rather than a browser `confirm()`: the dialog is easy to dismiss
 * by reflex, and this way the warning about cascading deletes sits next to the
 * button that does it.
 */
export function DeletePedal({
  id,
  kind,
  name,
}: {
  id: string;
  kind: "original" | "alternative";
  name: string;
}) {
  const [state, action, pending] = useActionState(deletePedal, initialState);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  // The record is gone, so this page 404s if left open.
  useEffect(() => {
    if (state.ok) router.push("/admin");
  }, [state.ok, router]);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="tz-btn bg-white px-5 py-2.5 text-xs text-rose-700  ring-1 ring-rose-300 hover:bg-rose-100"
      >
        Delete
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />

      <span className="text-sm font-bold text-rose-900">
        Delete “{name}” for good?
      </span>

      <button
        type="submit"
        disabled={pending}
        className="tz-btn bg-rose-700 px-5 py-2.5 text-xs text-white disabled:opacity-40"
      >
        {pending ? "Deleting..." : "Yes, delete"}
      </button>

      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs font-bold tracking-wider text-stone-500 uppercase hover:text-stone-900"
      >
        Cancel
      </button>

      {state.message && !state.ok && (
        <p aria-live="polite" className="text-sm text-rose-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
