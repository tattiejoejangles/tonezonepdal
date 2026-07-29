import { FindOfDayCard } from "./FindOfDayCard";
import { GenreSection } from "./GenreSection";
import type { DailyFind, GenreGroup } from "@/lib/sections";
import type { PedalDetail } from "@/lib/types";

/**
 * The curated home page body: today's bargain, then the genre bands.
 *
 * This exists as its own component so the home page can hand a *single*
 * element to the client-side Directory. React validates every child of a prop
 * that crosses the server/client boundary as if it were a dynamic list, so
 * two adjacent children there warn about missing keys even when they're
 * static. One element, one child - no warning.
 */
export function HomeSections({
  find,
  findDetail,
  groups,
}: {
  find: DailyFind | undefined;
  /** Resolved on the server so the card's dialog opens without a round trip. */
  findDetail: PedalDetail | undefined;
  groups: GenreGroup[];
}) {
  return (
    <div className="space-y-12">
      {find && findDetail ? (
        <FindOfDayCard find={find} detail={findDetail} />
      ) : null}
      {groups.map((group) => (
        <GenreSection key={group.genre.id} group={group} />
      ))}
    </div>
  );
}
