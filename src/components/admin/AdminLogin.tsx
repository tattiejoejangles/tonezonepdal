"use client";

import { useActionState } from "react";

import { login, type ActionState } from "@/app/admin/actions";

const initial: ActionState = { ok: false, message: "" };

export function AdminLogin({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="tz-heading text-3xl text-stone-900">Admin</h1>
      <p className="tz-body mt-2 text-sm text-stone-600">
        Add gear to the catalogue.
      </p>

      {!configured && (
        <p className="mt-6 border-l-2 border-amber-500 bg-amber-50 p-4 text-sm text-stone-700">
          <strong>Not configured.</strong> Set <code>ADMIN_PASSWORD</code> in the
          environment and redeploy - until then this page can&apos;t let anyone in.
        </p>
      )}

      <form action={action} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="password"
            className="tz-eyebrow mb-2 block text-stone-500"
          >
            Password
          </label>
          {/* text-base, not text-sm: iOS Safari zooms the viewport when a
              focused input's font-size is under 16px. */}
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={pending || !configured}
          className="tz-btn w-full bg-linear-to-b from-stone-800 to-stone-950 px-6 py-3 text-sm tracking-wider text-white uppercase disabled:opacity-40"
        >
          {pending ? "Checking…" : "Sign in"}
        </button>

        {state.message && (
          <p
            aria-live="polite"
            className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
