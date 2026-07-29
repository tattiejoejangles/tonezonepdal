import { Directory } from "@/components/Directory";
import { HomeSections } from "@/components/HomeSections";
import { getCatalogue, getDetail } from "@/data/catalogue";
import { findOfTheDay, groupByGenre } from "@/lib/sections";

/**
 * Rendered per request.
 *
 * The directory reads `?q=` via useSearchParams so the header search can drive
 * it. On a statically rendered route that leaves the Suspense boundary
 * permanently postponed - the page ships with its whole body stranded in an
 * unresolved <template> - so this route has to be dynamic. It also means the
 * Find of the Day rolls over exactly at midnight rather than on a revalidate
 * window.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalogue = await getCatalogue();
  const find = findOfTheDay(catalogue);
  const groups = groupByGenre(catalogue);

  // The whole Find of the Day card opens the detail dialog, so its detail is
  // resolved here rather than fetched when the card is clicked. Artists fall
  // back to the original's, same rule the pedal pages use.
  const findDetail = find
    ? getDetail(find.alternative, find.original.artists ?? [])
    : undefined;

  return (
    // No max-width here: the hero is full-bleed and Directory applies the
    // content column to everything below it.
    <Directory
      catalogue={catalogue}
      idleContent={
        <HomeSections find={find} findDetail={findDetail} groups={groups} />
      }
    />
  );
}
