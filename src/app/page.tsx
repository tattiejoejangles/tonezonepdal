import { Directory } from "@/components/Directory";
import { HomeSections } from "@/components/HomeSections";
import { getArtistIndex } from "@/data/artists";
import { getCatalogue, getDetail } from "@/data/catalogue";
import { findOfTheDay, groupByGenre } from "@/lib/sections";

/**
 * Statically rendered, revalidated every 5 minutes.
 *
 * This used to be `force-dynamic`, because the directory read `?q=` through
 * useSearchParams and a static route left that Suspense boundary permanently
 * postponed - the page shipped with its whole body stranded in an unresolved
 * <template>. The home page no longer filters, so nothing here reads search
 * params and the route can be static again. Find of the Day now turns over
 * within 5 minutes of midnight rather than exactly on it, which is a fair
 * trade for a cacheable home page.
 */
export const revalidate = 300;

export default async function HomePage() {
  const catalogue = await getCatalogue();
  const find = findOfTheDay(catalogue);
  const groups = groupByGenre(catalogue);

  // The whole Find of the Day card opens the detail dialog, so its detail is
  // resolved here rather than fetched when the card is clicked. Artists fall
  // back to the original's, same rule the pedal pages use.
  const findDetail = find
    ? getDetail(find.alternative, find.original.artists ?? [], await getArtistIndex())
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
