import type { Category, Control } from "@/lib/types";

/**
 * The "what does each knob actually do" data behind the pedal modal.
 *
 * Most pedals in a family share a control layout, so controls are resolved
 * from the effect category and only overridden where a specific pedal differs
 * — that's a handful of entries instead of 54 near-identical lists, and adding
 * a new pedal gets sensible controls for free.
 */

const BY_CATEGORY: Record<Category, Control[]> = {
  overdrive: [
    { name: "Drive", what: "How hard the clipping stage is pushed. Low settings act as a clean boost." },
    { name: "Tone", what: "Rolls off treble as you turn it down. Most of the character sits between 10 and 2 o'clock." },
    { name: "Level", what: "Output volume. Set it above unity to push the front end of a valve amp." },
  ],
  distortion: [
    { name: "Dist", what: "Amount of hard clipping. Unlike overdrive, this stays saturated even at low settings." },
    { name: "Tone", what: "Tilts between dark and cutting. Aggressive at the top of its range." },
    { name: "Level", what: "Output volume — usually needs backing off, as these run hot." },
  ],
  fuzz: [
    { name: "Volume", what: "Output level." },
    { name: "Treble", what: "Cuts or boosts the top end, separately from the bass control." },
    { name: "Bass", what: "Cuts or boosts the low end, letting you scoop or thicken the fuzz." },
    { name: "Gain switch", what: "Two fuzz modes — the second is the wilder, octave-flavoured setting." },
  ],
  delay: [
    { name: "Time", what: "Gap between repeats, from tight slapback to long trails." },
    { name: "Feedback", what: "How many repeats before the echo dies away. Past 3 o'clock it self-oscillates." },
    { name: "Level", what: "How loud the repeats sit against your dry signal." },
  ],
  modulation: [
    { name: "Rate", what: "Speed of the modulation sweep." },
    { name: "Depth", what: "How far the pitch is pushed either side of centre." },
  ],
  octave: [
    { name: "Direct", what: "Level of your unaffected dry signal." },
    { name: "Oct 1", what: "Level of the note one octave below what you play." },
    { name: "Oct 2", what: "Level of the note two octaves below — thick, synth-like bass." },
  ],
  eq: [
    { name: "7 frequency sliders", what: "Cut or boost each band by up to 15dB — 100Hz through 6.4kHz." },
    { name: "Level", what: "Overall output, so you can use the pedal as a clean solo boost." },
  ],
  reverb: [
    { name: "Level", what: "How much reverb is mixed in with the dry signal." },
    { name: "Tone", what: "Brightness of the reverb tail." },
    { name: "Time", what: "Length of the decay." },
  ],
};

/** Pedals whose layout genuinely differs from the family default. */
const OVERRIDES: Record<string, Control[]> = {
  "ibanez-tube-screamer": [
    { name: "Overdrive", what: "Drives the JRC4558 clipping stage. The famous mid-hump is there at every setting." },
    { name: "Tone", what: "Treble roll-off. Below noon it gets thick and dark quickly." },
    { name: "Level", what: "Output volume. Most players run this high and Overdrive low as a boost." },
  ],
  "digitech-bad-monkey": [
    { name: "Level", what: "Output volume." },
    { name: "Gain", what: "Amount of overdrive." },
    { name: "Low", what: "Dedicated bass control — the main thing the original Tube Screamer lacks." },
    { name: "High", what: "Dedicated treble control, so you can shape both ends independently." },
    { name: "Mixer out", what: "A second output with cab simulation, for going straight to a desk." },
  ],
  "mooer-green-mile": [
    { name: "Volume", what: "Output level." },
    { name: "Tone", what: "Treble roll-off." },
    { name: "Gain", what: "Drive amount." },
    { name: "Mode switch", what: "Warm for classic Tube Screamer, Hot for more gain than the original offers." },
  ],
  "boss-bf-2-flanger": [
    { name: "Manual", what: "Sets the centre point of the sweep — where the notch sits." },
    { name: "Depth", what: "How wide the sweep travels." },
    { name: "Rate", what: "Sweep speed." },
    { name: "Res", what: "Resonance. High settings ring metallically and eventually self-oscillate." },
  ],
  "boss-ce-2-chorus": [
    { name: "Rate", what: "Speed of the chorus wobble." },
    { name: "Depth", what: "Intensity. Low and slow is the classic 80s clean setting." },
  ],
  "mooer-ensemble-chorus": [
    { name: "Level", what: "Blend of the chorus against your dry signal — a control the CE-2 doesn't have." },
    { name: "Rate", what: "Modulation speed." },
    { name: "Depth", what: "Modulation intensity." },
  ],
  "boss-dd-2-dd-3-digital-delay": [
    { name: "E.Level", what: "Volume of the repeats." },
    { name: "F.Back", what: "Number of repeats." },
    { name: "D.Time", what: "Delay time, up to around 800ms." },
    { name: "Mode", what: "Selects the delay range, plus the Hold setting for infinite repeats." },
  ],
  "mooer-reecho": [
    { name: "Level", what: "Volume of the repeats." },
    { name: "F.Back", what: "Number of repeats." },
    { name: "Time", what: "Delay time." },
    { name: "Mode", what: "Analog, Real Echo and Tape voicings — more range than the single-voice DD-3." },
  ],
  "boss-ge-7-graphic-equalizer": [
    { name: "100Hz / 200Hz", what: "Low end — cut to tighten a boomy amp." },
    { name: "400Hz / 800Hz", what: "Low mids, where boxiness lives." },
    { name: "1.6kHz / 3.2kHz", what: "Presence and bite. Boost here for solos that cut through." },
    { name: "6.4kHz", what: "Air and fizz." },
    { name: "Level", what: "Overall output — push it for a clean volume boost." },
  ],
  "boss-fz-2-hyper-fuzz": [
    { name: "Volume", what: "Output level." },
    { name: "Treble", what: "Top-end cut and boost." },
    { name: "Bass", what: "Low-end cut and boost." },
    { name: "Gain 1 / Gain 2", what: "Two fuzz modes. Gain 2 is the saturated, octave-tinged roar it's famous for." },
  ],
  "behringer-sf300-super-fuzz": [
    { name: "Volume", what: "Output level." },
    { name: "Treble", what: "Top-end shaping." },
    { name: "Bass", what: "Low-end shaping." },
    { name: "Mode switch", what: "Boost, Fuzz 1 and Fuzz 2 — mirrors the FZ-2's gain modes." },
  ],
  "boss-hm-2-heavy-metal": [
    { name: "Dist", what: "Distortion amount. The famous setting is simply everything at maximum." },
    { name: "Level", what: "Output volume." },
    { name: "Colour Low", what: "Adds low-mid weight and the chest-thump in the buzzsaw tone." },
    { name: "Colour High", what: "Adds the razor edge on top. Both at max is the Swedish death metal sound." },
  ],
  "behringer-hm300-heavy-distortion": [
    { name: "Dist", what: "Distortion amount." },
    { name: "Level", what: "Output volume." },
    { name: "Low / High", what: "Two-band Colour EQ, same layout as the HM-2 it copies." },
  ],
  "boss-ds-1-distortion": [
    { name: "Dist", what: "Hard-clipping amount. Stays saturated even backed right off." },
    { name: "Tone", what: "Very wide range — harsh at the top, muffled at the bottom." },
    { name: "Level", what: "Output volume." },
  ],
  "danelectro-fish-n-chips": [
    { name: "7 sliders", what: "Cut or boost seven bands across the guitar range." },
    { name: "Level", what: "Output volume, usable as a boost." },
  ],
  "biyang-od-8": [
    { name: "Drive", what: "Overdrive amount." },
    { name: "Tone", what: "Treble roll-off." },
    { name: "Level", what: "Output volume." },
    { name: "Op-amp socket", what: "Swap the chip — JRC4558, TL072 or RC4558 — to retune the drive's character." },
  ],
};

export function controlsFor(slug: string, category: Category): Control[] {
  return OVERRIDES[slug] ?? BY_CATEGORY[category];
}

/**
 * Short editorial summaries of what players consistently report.
 *
 * Written by hand rather than scraped: retailer review text is copyrighted and
 * both Amazon and Reverb block automated access. See scripts/fetch-details.mjs.
 */
export const VERDICTS: Record<string, string> = {
  "behringer-to800-vintage-overdrive":
    "The consensus budget pick. Owners consistently say it sounds like a Tube Screamer and feels like a toy — the circuit is right, the box isn't. Most advise buying it, then rehousing it if you gig.",
  "joyo-jf-01-vintage-overdrive":
    "Widely recommended as the sensible upgrade over the Behringer: same idea, metal enclosure, true bypass. Noise at high gain is the recurring complaint.",
  "mooer-green-mile":
    "Praised almost universally for build quality and the board space it saves. The Hot mode is what wins people over — it goes further than a real TS9.",
  "digitech-bad-monkey":
    "Something of a legend. Players rate it above the pedal it clones because of the separate bass and treble controls. Prices have climbed steadily since it was discontinued.",
  "behringer-hm300-heavy-distortion":
    "The single most recommended budget clone in guitar forums. Owners agree it gets you most of the way to the HM-2 chainsaw for a twentieth of the price of a vintage unit.",
  "behringer-sf300-super-fuzz":
    "A genuine cult classic. Frequently described as the best-value fuzz ever made, and the reason most players never bother hunting an FZ-2.",
  "danelectro-fab-1-distortion":
    "Absurd value. Nobody claims it's built well, but plenty of players say it holds its own against a DS-1 in a mix.",
  "mooer-blues-mood":
    "Regarded as covering both stock and Keeley-modded BD-2 ground. The size is the main draw.",
  "behringer-eq700":
    "Does the GE-7's job for a quarter of the money. The plastic case is the only real complaint.",
};
