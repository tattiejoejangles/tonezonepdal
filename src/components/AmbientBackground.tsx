/**
 * Slow colour wash behind every page.
 *
 * Pure markup — no client JS, no state. All the work is in the `.tz-ambient`
 * rules in globals.css, which animate transforms only so this stays on the
 * compositor. Sits at z-index -1 so it paints above the body background and
 * below every bit of content, and `pointer-events: none` keeps it out of the
 * way of clicks.
 */
export function AmbientBackground() {
  return (
    <div className="tz-ambient" aria-hidden>
      <span className="tz-ambient__a" />
      <span className="tz-ambient__b" />
      <span className="tz-ambient__c" />
    </div>
  );
}
