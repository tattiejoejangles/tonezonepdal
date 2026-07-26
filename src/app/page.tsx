import { Directory } from "@/components/Directory";
import { HomeSections } from "@/components/HomeSections";
import { getCatalogue } from "@/data/catalogue";
import { findOfTheDay, groupByGenre } from "@/lib/sections";

/**
 * Rendered per request.
 *
 * The directory reads `?q=` via useSearchParams so the header search can drive
 * it. On a statically rendered route that leaves the Suspense boundary
 * permanently postponed — the page ships with its whole body stranded in an
 * unresolved <template> — so this route has to be dynamic. It also means the
 * Find of the Day rolls over exactly at midnight rather than on a revalidate
 * window.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalogue = await getCatalogue();
  const find = findOfTheDay(catalogue);
  const groups = groupByGenre(catalogue);

  return (
    // No max-width here: the hero is full-bleed and Directory applies the
    // content column to everything below it.
    <Directory
      catalogue={catalogue}
      idleContent={<HomeSections find={find} groups={groups} />}
    />
  );
}
