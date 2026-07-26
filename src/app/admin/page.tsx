import type { Metadata } from "next";

import { AdminLogin } from "@/components/admin/AdminLogin";
import { PedalForm, type OriginalOption } from "@/components/admin/PedalForm";
import { getCatalogue } from "@/data/catalogue";
import { isAdminConfigured, isAuthed } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { logout } from "./actions";

/** Reads a cookie, so it can never be prerendered. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAuthed())) {
    return <AdminLogin configured={isAdminConfigured()} />;
  }

  // The linking dropdown reads through the public catalogue rather than the
  // service-role client, so it still lists every original when the write key
  // is missing — and falls back to the bundled copy if Supabase is down.
  const catalogue = await getCatalogue();
  const originals: OriginalOption[] = catalogue
    .map(({ id, name, brand }) => ({ id, name, brand }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Only writes need the service role key; the page still renders without it.
  const canWrite = getAdminSupabase() !== null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-stone-900/10 pb-5">
        <div>
          <p className="tz-eyebrow text-amber-700">The Tone Zone</p>
          <h1 className="tz-heading mt-1.5 text-3xl text-stone-900">Add a pedal</h1>
          <p className="tz-body mt-2 text-sm text-stone-600">
            Writes straight to Supabase. Pages pick it up within five minutes,
            or immediately on the next visit.
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="tz-eyebrow text-stone-500 transition-colors hover:text-amber-700"
          >
            Sign out
          </button>
        </form>
      </div>

      {!canWrite && (
        <p className="mb-6 border-l-2 border-rose-500 bg-rose-50 p-4 text-sm text-stone-700">
          <strong>Saving is disabled.</strong> <code>SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          is empty in this environment, so nothing can be written. Copy it from
          Supabase → Project Settings → API, put it in <code>.env.local</code>{" "}
          (and in the Vercel project&apos;s environment variables), then restart.
          Everything else on this page works meanwhile.
        </p>
      )}

      <PedalForm originals={originals} />
    </div>
  );
}
