/**
 * The Tone Zone mark: a soundwave running into a currency symbol.
 *
 * Two ideas doing one job - "tone" is the waveform, "zone" is where the money
 * stops leaving your wallet - which is the whole premise of the site in one
 * glyph. It replaced a generic stompbox footswitch, which said "guitar" but
 * said nothing about price.
 *
 * The currency symbol is a POUND, not a dollar. Every price on the site is
 * formatted en-GB/GBP and the copy talks about UK street prices, so a dollar
 * in the logo would be the one thing on the page quoting a different currency.
 * Swapping back is a one-line change: see `GLYPH` below.
 *
 * Both marks are drawn rather than typeset. A <text> element would depend on
 * whichever font happened to load, which is exactly the wrong dependency for a
 * favicon and an OG image.
 *
 * Two sizes, because a logo that only works at one size isn't a logo:
 *
 *   TzMark     40x40 square, one wave crest either side. Survives 16px, so it
 *              works as the favicon and in the sticky header.
 *   TzLockup   340x96 wide, the full swell-and-decay waveform from the
 *              original sketch. Wants at least ~180px of width.
 *
 * The detail that ties it together: the crossbar of the £ sits at y=48, which
 * is exactly the waveform's rest line. The bar reads as the flat part of the
 * wave continuing straight through the glyph rather than as a separate stroke.
 */

/**
 * The pound bowl+stem+foot, then the crossbar. Swap for a $ here if wanted.
 *
 * Positioned so the glyph's inked extent (136.5-203.5 once the 11-unit stroke
 * is counted) centres on x=170, leaving an equal 7.75 units of air between it
 * and each waveform. Optical centring, not box centring - the crossbar
 * overhangs left and the foot overhangs right, so the path coordinates alone
 * sit off-centre.
 */
const GLYPH = {
  /** Bowl over the top, down the left as the stem, right along the foot. */
  body: "M192 35C192 24 183.2 15 172 15C160.8 15 152 24 152 35V78H198",
  /** Crossbar, deliberately level with the waveform's rest line at y=48. */
  bar: "M142 48H184",
} as const;

const WAVE = {
  left:
    "M8 48C11 48 22.9 49.5 28 48C33.1 46.5 37.8 36.5 42 38C46.2 39.5 51.5 60.4 56 58C60.5 55.6 67.2 19.6 72 22C76.8 24.4 83.2 74.6 88 74C92.8 73.4 99.5 19.5 104 18C108.5 16.5 114.7 59.5 118 64C121.3 68.5 124.8 50.4 126 48",
  right:
    "M214 48C215.2 50.4 218.7 68.5 222 64C225.3 59.5 231.5 16.5 236 18C240.5 19.5 247.2 73.4 252 74C256.8 74.6 263.2 24.4 268 22C272.8 19.6 279.5 55.6 284 58C288.5 60.4 293.8 39.5 298 38C302.2 36.5 306.9 46.5 312 48C317.1 49.5 329 48 332 48",
} as const;

const MARK_WAVE = {
  left: "M2 20C2.3 20 3.4 21.2 4 20C4.6 18.8 5.4 10.8 6 12C6.6 13.2 7.6 26.8 8.2 28C8.8 29.2 10 21.2 10.3 20",
  right:
    "M29.7 20C30 21.2 31.2 29.2 31.8 28C32.4 26.8 33.4 13.2 34 12C34.6 10.8 35.4 18.8 36 20C36.6 21.2 37.7 20 38 20",
} as const;

/** Same construction as GLYPH, redrawn for the 40x40 box and centred on 20,20. */
const MARK_GLYPH = {
  body: "M25.5 14.5C25.5 11.7 23.3 9.5 20.5 9.5C17.7 9.5 15.5 11.7 15.5 14.5V30.5H26.5",
  bar: "M13.5 20H23.5",
} as const;

/**
 * Square mark, for the header tile and the favicon.
 *
 * The glyph is heavier here relative to the wave than in the wide lockup. At
 * 16px a hairline £ turns to mush, whereas the wave only has to read as
 * "something oscillating" to do its job.
 */
export function TzMark({
  className = "h-6 w-6",
  waveClassName = "text-amber-400",
}: {
  className?: string;
  /** The wave's colour. The glyph inherits `currentColor` from the parent. */
  waveClassName?: string;
}) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <g
        className={waveClassName}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d={MARK_WAVE.left} />
        <path d={MARK_WAVE.right} />
      </g>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={MARK_GLYPH.body} />
        <path d={MARK_GLYPH.bar} />
      </g>
    </svg>
  );
}

/**
 * The full lockup - the waveform swelling into the glyph and decaying out the
 * other side, as sketched.
 *
 * `title` renders an accessible name when the logo stands alone; pass
 * `title={undefined}` where a neighbouring text label already names it.
 */
export function TzLockup({
  className = "h-12 w-auto",
  waveClassName = "text-amber-500",
  title,
}: {
  className?: string;
  waveClassName?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 340 96"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <g
        className={waveClassName}
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
      >
        <path d={WAVE.left} />
        <path d={WAVE.right} />
      </g>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={GLYPH.body} />
        <path d={GLYPH.bar} />
      </g>
    </svg>
  );
}
