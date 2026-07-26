import { FindOfDayCard } from "./FindOfDayCard";
import { GenreSection } from "./GenreSection";
import type { DailyFind, GenreGroup } from "@/lib/sections";

/**
 * The curated home page body: today's bargain, then the genre bands.
 *
 * This exists as its own component so the home page can hand a *single*
 * element to the client-side Directory. React validates every child of a prop
 * that crosses the server/client boundary as if it were a dynamic list, so
 * two adjacent children there warn about missing keys even when they're
 * static. One element, one child — no warning.
 */
export function HomeSections({
  find,
  groups,
}: {
  find: DailyFind | undefined;
  groups: GenreGroup[];
}) {
  return (
    <div className="space-y-12">
      {find ? <FindOfDayCard find={find} /> : null}
      {groups.map((group) => (
        <GenreSection key={group.genre.id} group={group} />
      ))}
    </div>
  );
}
