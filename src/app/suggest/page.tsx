import type { Metadata } from "next";

import { SuggestForm } from "@/components/SuggestForm";
import { getAlternativeBySlug, getOriginalBySlug } from "@/data/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Make a suggestion",
  description:
    "Spotted something wrong, or something missing? Tell us and we'll take a look.",
  robots: { index: false, follow: true },
};

/**
 * Suggest a change.
 *
 * Reached from the site footer, or from a pedal page with `?kind=` and
 * `?slug=` prefilled so the person doesn't have to describe which pedal they
 * were just looking at.
 */
export default async function SuggestPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; slug?: string }>;
}) {
  const { kind, slug } = await searchParams;

  let target: { kind: "original" | "alternative"; slug: string; name: string } | undefined;

  if (slug && kind === "original") {
    const pedal = await getOriginalBySlug(slug);
    if (pedal) target = { kind: "original", slug: pedal.slug, name: pedal.name };
  } else if (slug && kind === "alternative") {
    const found = await getAlternativeBySlug(slug);
    if (found) {
      target = {
        kind: "alternative",
        slug: found.alternative.slug,
        name: found.alternative.name,
      };
    }
  }

  return (
    <div className="tz-page tz-page--narrow py-10">
      <header className="mb-8 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">Help out</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
          Make a suggestion
        </h1>
        <p className="tz-body mt-2 text-base text-stone-600">
          Prices move, clones appear, and we get things wrong. Tell us what to
          change.
        </p>
      </header>

      <SuggestForm target={target} />
    </div>
  );
}
