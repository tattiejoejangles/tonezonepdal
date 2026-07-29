import type { Metadata } from "next";

import { SavedList } from "@/components/SavedList";
import { getSearchIndex } from "@/data/catalogue";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Saved gear",
  description: "The gear you've saved for later on The Tone Zone.",
  robots: { index: false, follow: true },
};

export default async function SavedPage() {
  // The list itself is client-side (bookmarks live in the browser), but the
  // catalogue it resolves against is the same server-built index the header
  // search already uses.
  const index = await getSearchIndex();

  return (
    <div className="tz-page tz-page--narrow py-10">
      <header className="mb-8 border-b-2 border-stone-900/10 pb-5">
        <p className="tz-eyebrow text-amber-700">The Tone Zone</p>
        <h1 className="tz-heading mt-1.5 text-3xl text-stone-900 sm:text-4xl">
          Saved gear
        </h1>
      </header>

      <SavedList index={index} />
    </div>
  );
}
