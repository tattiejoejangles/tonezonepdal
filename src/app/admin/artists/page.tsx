import type { Metadata } from "next";
import Link from "next/link";

import { AdminLogin } from "@/components/admin/AdminLogin";
import { ArtistRow } from "@/components/admin/ArtistRow";
import { isAdminConfigured, isAuthed } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artists",
  robots: { index: false, follow: false },
};

interface Row {
  match_key: string;
  name: string;
  aliases: string[] | null;
  image_url: string | null;
  image_credit: string | null;
  known_for: string | null;
}

/**
 * Artist photo editor.
 *
 * Exists so filling in 99 photos is a form rather than 99 UPDATE statements.
 * Sorted with the missing photos first, because that's the working queue - the
 * ones already done don't need looking at.
 */
export default async function AdminArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  if (!(await isAuthed())) {
    return <AdminLogin configured={isAdminConfigured()} />;
  }

  const { q, filter } = await searchParams;
  const supabase = getAdminSupabase();

  let artists: Row[] = [];
  let error: string | null = null;

  if (!supabase) {
    error = "SUPABASE_SERVICE_ROLE_KEY isn't set, so the list can't be read.";
  } else {
    let request = supabase
      .from("artists")
      .select("match_key, name, aliases, image_url, image_credit, known_for")
      .order("name")
      .limit(500);

    if (q?.trim()) request = request.ilike("name", `%${q.trim()}%`);
    if (filter === "missing") request = request.is("image_url", null);
    if (filter === "done") request = request.not("image_url", "is", null);

    const { data, error: failure } = await request;
    if (failure) {
      error = `Couldn't read artists: ${failure.message}`;
    } else {
      artists = (data ?? []) as Row[];
    }
  }

  const withPhoto = artists.filter((artist) => artist.image_url).length;

  return (
    <div className="tz-page py-10">
      <header className="mb-6 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Admin</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900">Artists</h1>
        <p className="tz-body mt-2 max-w-prose text-sm text-stone-600">
          Paste a photo URL against a name and it appears on every pedal that
          names that artist. Matching is on the normalised name, so casing and
          spacing don&apos;t matter - a genuine misspelling needs an alias.
        </p>
        <p className="tz-body mt-1 text-sm text-stone-500">
          {withPhoto} of {artists.length} shown have a photo.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/admin" className="tz-eyebrow text-stone-500 hover:text-amber-700">
            ← Add gear
          </Link>
          <Link
            href="/admin/suggestions"
            className="tz-eyebrow text-stone-500 hover:text-amber-700"
          >
            Suggestions
          </Link>
        </div>
      </header>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="tz-eyebrow mb-1.5 block text-stone-500">Search</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Gallagher"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-500"
          />
        </label>

        <label className="block">
          <span className="tz-eyebrow mb-1.5 block text-stone-500">Show</span>
          <select
            name="filter"
            defaultValue={filter ?? "all"}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-500"
          >
            <option value="all">Everyone</option>
            <option value="missing">Missing a photo</option>
            <option value="done">Has a photo</option>
          </select>
        </label>

        <button
          type="submit"
          className="tz-btn bg-stone-900 px-6 py-2.5 text-xs text-white"
        >
          Apply
        </button>
      </form>

      {error ? (
        <p className="tz-chamfer border-l-2 border-amber-500 bg-amber-50 p-4 text-sm text-stone-700">
          {error} If this is the first run, apply{" "}
          <code>supabase/seed/08-artists.sql</code> in the Supabase SQL editor.
        </p>
      ) : artists.length === 0 ? (
        <p className="tz-chamfer bg-white/70 px-6 py-16 text-center text-sm text-stone-500">
          Nobody matches that.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {artists.map((artist) => (
            <ArtistRow
              key={artist.match_key}
              artist={{
                matchKey: artist.match_key,
                name: artist.name,
                aliases: artist.aliases ?? [],
                imageUrl: artist.image_url,
                imageCredit: artist.image_credit,
                knownFor: artist.known_for,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
