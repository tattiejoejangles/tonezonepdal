import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeletePedal } from "@/components/admin/DeletePedal";
import { PedalForm, type OriginalOption, type PedalDraft } from "@/components/admin/PedalForm";
import { getAlternativeBySlug, getCatalogue, getOriginalBySlug } from "@/data/catalogue";
import { isAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // "entry", not "pedal": the same form edits amps and cabs.
  title: "Edit entry",
  robots: { index: false, follow: false },
};

export default async function EditPedalPage({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  const { kind, slug } = await params;

  // Not signed in: bounce to the admin door rather than 404, so the pen icon
  // still leads somewhere useful after a session expires.
  if (!(await isAuthed())) redirect("/admin");
  if (kind !== "original" && kind !== "alternative") notFound();

  const catalogue = await getCatalogue();
  const originals: OriginalOption[] = catalogue
    .map(({ id, name, brand, category }) => ({ id, name, brand, category }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let draft: PedalDraft;

  if (kind === "original") {
    const pedal = await getOriginalBySlug(slug);
    if (!pedal) notFound();

    draft = {
      id: pedal.id,
      slug: pedal.slug,
      kind: "original",
      name: pedal.name,
      brand: pedal.brand,
      priceGBP: pedal.priceGBP,
      blurb: pedal.blurb,
      popularity: pedal.popularity,
      imageUrl: pedal.imageUrl,
      imageCredit: pedal.imageCredit ?? "",
      aliases: pedal.aliases ?? [],
      artists: pedal.artists ?? [],
      searchQuery: pedal.searchQuery ?? "",
      specs: pedal.specs ?? [],
      category: pedal.category,
      description: pedal.description,
      tags: pedal.tags,
    };
  } else {
    const found = await getAlternativeBySlug(slug);
    if (!found) notFound();

    const { alternative } = found;
    draft = {
      id: alternative.id,
      slug: alternative.slug,
      kind: "alternative",
      name: alternative.name,
      brand: alternative.brand,
      priceGBP: alternative.priceGBP,
      blurb: alternative.blurb,
      popularity: alternative.popularity,
      imageUrl: alternative.imageUrl,
      imageCredit: "",
      aliases: alternative.aliases ?? [],
      artists: alternative.artists ?? [],
      searchQuery: alternative.searchQuery ?? "",
      specs: alternative.specs ?? [],
      originalId: alternative.originalId,
      // The extra pairings, so re-saving doesn't quietly drop them: the form
      // submits the complete set and the action replaces what's stored.
      alsoOriginalIds: (alternative.clonesOf ?? [])
        .filter((entry) => !entry.primary)
        .map((entry) => entry.id),
      relationship:
        (alternative.clonesOf ?? []).find((entry) => entry.primary)?.relationship ??
        alternative.relationship ??
        "alternative",
      matchQuality: alternative.matchQuality,
      pros: alternative.pros,
      cons: alternative.cons,
      verdict: alternative.verdict ?? "",
      gallery: alternative.gallery ?? [],
    };
  }

  const viewHref = kind === "original" ? `/pedal/${slug}` : `/clone/${slug}`;

  return (
    <div className="tz-page tz-page--narrow py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-xs">
        <Link href="/admin" className="tz-eyebrow text-stone-500 hover:text-amber-700">
          Admin
        </Link>
        <span className="text-stone-300">/</span>
        <Link href={viewHref} className="tz-eyebrow text-stone-500 hover:text-amber-700">
          {draft.name}
        </Link>
      </nav>

      <header className="mb-8 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-brand text-amber-700">{draft.brand}</p>
        <h1 className="tz-heading mt-1 text-3xl text-stone-900">Edit {draft.name}</h1>
        <p className="tz-body mt-2 text-sm text-stone-600">
          The web address and internal id stay fixed - everything else can change.
        </p>
      </header>

      <PedalForm originals={originals} draft={draft} />

      <div className="mt-10 rounded-xl border border-rose-200 bg-rose-50/60 p-5">
        <h2 className="tz-heading text-lg text-rose-900">Delete this entry</h2>
        <p className="tz-body mt-1 mb-4 text-sm text-rose-950/80">
          {kind === "original"
            ? "This also deletes every alternative linked to it. There is no undo."
            : "There is no undo."}
        </p>
        <DeletePedal id={draft.id} kind={draft.kind} name={draft.name} />
      </div>
    </div>
  );
}
