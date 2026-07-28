import Link from "next/link";

/**
 * "The Tone Zone" lockup.
 *
 * The mark is a stompbox footswitch - concentric rings with a lit LED - which
 * gives the header something recognisably guitar-related instead of initials
 * in a box. The three words are stacked in weight rather than size so the
 * lockup stays one clean horizontal block at any width.
 */
export function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="The Tone Zone - home">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-stone-800 via-stone-900 to-black transition-transform duration-300 group-hover:scale-105">
        <span
          aria-hidden
          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.7)] transition-all duration-300 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_3px_rgba(52,211,153,0.8)]"
        />
        <svg viewBox="0 0 32 32" aria-hidden className="h-6 w-6">
          <circle cx="16" cy="16" r="11" fill="none" stroke="#57534e" strokeWidth="2.5" />
          <circle cx="16" cy="16" r="6.5" fill="#d6d3d1" />
          <circle cx="16" cy="16" r="3" fill="#78716c" />
        </svg>
      </span>

      <span className="leading-none">
        <span className="block text-[10px] font-medium tracking-[0.34em] text-stone-400 uppercase">
          The
        </span>
        <span className="block text-xl font-bold tracking-tight text-stone-900">
          Tone
          <span className="bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Zone
          </span>
        </span>
      </span>
    </Link>
  );
}
