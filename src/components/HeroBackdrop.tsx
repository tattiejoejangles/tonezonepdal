/**
 * The dark hero panel with isometric pedals drifting diagonally behind it.
 *
 * Two tile layers at different scales and speeds keep the repeat from reading
 * as an obvious grid. A gradient scrim sits between the pattern and the text
 * so the copy always clears contrast regardless of which pedals drift under it.
 */
export function HeroBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[#0b1020]">
      <div className="tz-pedal-drift" aria-hidden />

      {/* Contrast scrim: darkens hardest behind the copy, lightest at the
          edges, so the pedals stay visible across the full width. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-radial-[at_50%_50%] from-[#0b1020]/94 via-[#0b1020]/70 to-[#0b1020]/35"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-[#0b1020]"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
        {children}
      </div>
    </section>
  );
}
