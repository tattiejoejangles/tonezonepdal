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
      <div className="tz-pedal-drift tz-pedal-drift--back" aria-hidden />
      <div className="tz-pedal-drift tz-pedal-drift--front" aria-hidden />

      {/*
        Contrast scrim. The pattern runs at a much higher opacity now, so the
        centre is darkened harder than the edges — the pedals stay clearly
        visible across the full width while the copy keeps its contrast.
      */}
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
