import type { Metadata } from "next";
import Link from "next/link";

import { AdminLogin } from "@/components/admin/AdminLogin";
import { SuggestionCard } from "@/components/admin/SuggestionCard";
import { isAdminConfigured, isAuthed } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  isSuggestionKind,
  isSuggestionStatus,
  KIND_LABELS,
  SUGGESTION_KINDS,
  type Suggestion,
} from "@/lib/suggestions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suggestions",
  robots: { index: false, follow: false },
};

interface Row {
  id: string;
  created_at: string;
  kind: string;
  target_kind: string | null;
  target_slug: string | null;
  field: string;
  body: string;
  payload: Record<string, unknown> | null;
  contact: string | null;
  status: string;
  reviewed_at: string | null;
  review_note: string | null;
}

/**
 * The review queue.
 *
 * Read with the service-role client: the suggestions table's RLS lets anon
 * insert and nothing else, so the anon key cannot see this list at all - which
 * is the point.
 */
export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string }>;
}) {
  if (!(await isAuthed())) {
    return <AdminLogin configured={isAdminConfigured()} />;
  }

  const { kind, status } = await searchParams;
  const activeKind = kind && isSuggestionKind(kind) ? kind : null;
  const activeStatus = status && isSuggestionStatus(status) ? status : "pending";

  const supabase = getAdminSupabase();

  let suggestions: Suggestion[] = [];
  let error: string | null = null;

  if (!supabase) {
    error = "SUPABASE_SERVICE_ROLE_KEY isn't set, so the queue can't be read.";
  } else {
    let request = supabase
      .from("suggestions")
      .select("*")
      .eq("status", activeStatus)
      .order("created_at", { ascending: false })
      .limit(200);

    if (activeKind) request = request.eq("kind", activeKind);

    const { data, error: queryError } = await request;

    if (queryError) {
      // The most likely cause by far is that 07-suggestions.sql hasn't been run.
      error = `Couldn't read suggestions: ${queryError.message}`;
    } else {
      suggestions = ((data ?? []) as Row[]).map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        kind: row.kind as Suggestion["kind"],
        targetKind: row.target_kind as Suggestion["targetKind"],
        targetSlug: row.target_slug,
        field: row.field,
        body: row.body,
        payload: row.payload,
        contact: row.contact,
        status: row.status as Suggestion["status"],
        reviewedAt: row.reviewed_at,
        reviewNote: row.review_note,
      }));
    }
  }

  const query = (next: { kind?: string | null; status?: string }) => {
    const params = new URLSearchParams();
    const k = next.kind === undefined ? activeKind : next.kind;
    const s = next.status ?? activeStatus;
    if (k) params.set("kind", k);
    if (s !== "pending") params.set("status", s);
    const qs = params.toString();
    return qs ? `/admin/suggestions?${qs}` : "/admin/suggestions";
  };

  return (
    <div className="tz-page py-10">
      <header className="mb-6 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Admin</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900">Suggestions</h1>
        <p className="tz-body mt-2 text-sm text-stone-600">
          Approving marks it done - it doesn&apos;t edit the catalogue. Make the
          change on the pedal&apos;s own page.
        </p>
        <Link
          href="/admin"
          className="tz-eyebrow mt-3 inline-block text-stone-500 hover:text-amber-700"
        >
          ← Add gear
        </Link>
      </header>

      {/* Filters: kind across the top, status beside it. */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chip href={query({ kind: null })} active={activeKind === null}>
          All kinds
        </Chip>
        {SUGGESTION_KINDS.map((value) => (
          <Chip key={value} href={query({ kind: value })} active={activeKind === value}>
            {KIND_LABELS[value]}
          </Chip>
        ))}

        <span className="mx-2 hidden h-5 w-px bg-stone-200 sm:block" />

        {(["pending", "approved", "rejected"] as const).map((value) => (
          <Chip
            key={value}
            href={query({ status: value })}
            active={activeStatus === value}
          >
            {value}
          </Chip>
        ))}
      </div>

      {error ? (
        <p className="tz-chamfer border-l-2 border-amber-500 bg-amber-50 p-4 text-sm text-stone-700">
          {error} If this is the first run, apply{" "}
          <code>supabase/seed/07-suggestions.sql</code> in the Supabase SQL
          editor.
        </p>
      ) : suggestions.length === 0 ? (
        <p className="tz-chamfer bg-white/70 px-6 py-16 text-center text-sm text-stone-500 ring-1 ring-stone-200">
          Nothing {activeStatus} here.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-2 text-xs font-bold tracking-wide capitalize transition-colors ${
        active
          ? "bg-linear-to-b from-stone-800 to-stone-950 text-white shadow-sm"
          : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900"
      }`}
    >
      {children}
    </Link>
  );
}
