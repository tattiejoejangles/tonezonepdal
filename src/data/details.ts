import type { Control } from "@/lib/types";

/**
 * Verified control layouts, keyed by slug.
 *
 * This used to fall back to a generic set per effect category, which produced
 * confidently wrong output - the Biyang AD-10 was being shown "Time / Feedback
 * / Level" when its knobs are actually Time / Repeat / Mix. A guess presented
 * as fact is worse than no data, so there is no fallback now: a pedal missing
 * from this map simply shows no control list, and the UI says so.
 *
 * Add entries as you confirm them. These seed the `controls` column in
 * Supabase via `npm run db:push`, and can also be edited there directly.
 */
export const CONTROLS: Record<string, Control[]> = {
  // --- Originals ---------------------------------------------------------
  "ibanez-tube-screamer": [
    { name: "Overdrive", what: "Drives the JRC4558 clipping stage. The mid-hump is there at every setting." },
    { name: "Tone", what: "Treble roll-off. Below noon it gets thick and dark quickly." },
    { name: "Level", what: "Output volume. Most players run this high and Overdrive low, as a boost." },
  ],
  "boss-bd-2-blues-driver": [
    { name: "Gain", what: "Amount of breakup. Stays touch-sensitive across the whole range." },
    { name: "Tone", what: "Bright and open at the top; it can get glassy and thin past 2 o'clock." },
    { name: "Level", what: "Output volume." },
  ],
  "boss-bf-2-flanger": [
    { name: "Manual", what: "Sets the centre point of the sweep - where the notch sits." },
    { name: "Depth", what: "How wide the sweep travels." },
    { name: "Rate", what: "Sweep speed." },
    { name: "Res", what: "Resonance. High settings ring metallically and eventually self-oscillate." },
  ],
  "boss-ce-2-chorus": [
    { name: "Rate", what: "Speed of the chorus wobble." },
    { name: "Depth", what: "Intensity. Low and slow is the classic 80s clean setting." },
  ],
  "boss-dd-2-dd-3-digital-delay": [
    { name: "E.Level", what: "Volume of the repeats against your dry signal." },
    { name: "F.Back", what: "Number of repeats." },
    { name: "D.Time", what: "Delay time within the selected range." },
    { name: "Mode", what: "Selects the delay range, plus Hold for infinite repeats." },
  ],
  "boss-dm-2-dm-3-analog-delay": [
    { name: "Repeat Rate", what: "Delay time, roughly 20-300ms." },
    { name: "Intensity", what: "Number of repeats before the echo dies away." },
    { name: "Echo", what: "Volume of the repeats." },
  ],
  "boss-ds-1-distortion": [
    { name: "Dist", what: "Hard-clipping amount. Stays saturated even backed right off." },
    { name: "Tone", what: "Very wide range - harsh at the top, muffled at the bottom." },
    { name: "Level", what: "Output volume." },
  ],
  "boss-ge-7-graphic-equalizer": [
    { name: "100Hz / 200Hz", what: "Low end - cut to tighten a boomy amp." },
    { name: "400Hz / 800Hz", what: "Low mids, where boxiness lives." },
    { name: "1.6kHz / 3.2kHz", what: "Presence and bite. Boost here for solos that cut." },
    { name: "6.4kHz", what: "Air and fizz." },
    { name: "Level", what: "Overall output - push it for a clean volume boost." },
  ],
  "boss-fz-2-hyper-fuzz": [
    { name: "Volume", what: "Output level." },
    { name: "Treble", what: "Top-end cut and boost." },
    { name: "Bass", what: "Low-end cut and boost." },
    { name: "Gain 1 / Gain 2", what: "Two fuzz modes. Gain 2 is the saturated, octave-tinged roar." },
  ],
  "boss-hm-2-heavy-metal": [
    { name: "Dist", what: "Distortion amount. The famous setting is simply everything at maximum." },
    { name: "Level", what: "Output volume." },
    { name: "Colour Low", what: "Adds low-mid weight and the chest-thump in the buzzsaw tone." },
    { name: "Colour High", what: "Adds the razor edge on top." },
  ],
  "boss-oc-2-oc-3-octave": [
    { name: "Direct Level", what: "Level of your unaffected dry signal." },
    { name: "OCT 1", what: "Level of the note one octave below." },
    { name: "OCT 2", what: "Level of the note two octaves below - thick synth bass." },
  ],
  "boss-vb-2-vibrato": [
    { name: "Rate", what: "Speed of the pitch wobble." },
    { name: "Depth", what: "How far the pitch bends either side of centre." },
    { name: "Rise Time", what: "How gradually the vibrato eases in after you engage it." },
  ],
  "carl-martin-plexitone": [
    { name: "Level", what: "Output volume for each channel." },
    { name: "Gain", what: "Drive amount." },
    { name: "Tone", what: "Overall brightness." },
    { name: "Two footswitches", what: "Low-gain crunch and high-gain lead, switchable independently." },
  ],
  "demeter-tremulator": [
    { name: "Speed", what: "Rate of the volume pulse." },
    { name: "Depth", what: "How far the volume drops on each pulse." },
  ],
  "dod-boneshaker": [
    { name: "Level / Gain", what: "Output volume and distortion amount." },
    { name: "Low / High", what: "Shelving bass and treble." },
    { name: "Mid + Freq", what: "Sweepable midrange - pick the frequency, then cut or boost it." },
  ],
  "dod-carcosa-fuzz": [
    { name: "Volume / Fuzz", what: "Output level and fuzz amount." },
    { name: "Tone", what: "Brightness." },
    { name: "Bias", what: "Starves the circuit for gated, dying-battery splutter." },
    { name: "Hali / Demhe", what: "Two voicings - scooped and aggressive, or thicker in the mids." },
  ],
  "dunlop-fuzz-face": [
    { name: "Volume", what: "Output level." },
    { name: "Fuzz", what: "Fuzz amount. Most of the magic is near maximum, cleaned up from the guitar." },
  ],
  "electro-harmonix-big-muff-pi": [
    { name: "Volume", what: "Output level." },
    { name: "Tone", what: "Sweeps between scooped-dark and thin-bright, with a mid dip in the middle." },
    { name: "Sustain", what: "Fuzz and compression amount - this is what gives the endless sustain." },
  ],
  "electro-harmonix-black-russian-big-muff": [
    { name: "Volume", what: "Output level." },
    { name: "Tone", what: "Darker overall range than the NYC version." },
    { name: "Sustain", what: "Fuzz amount." },
  ],
  "electro-harmonix-green-russian-big-muff": [
    { name: "Volume", what: "Output level." },
    { name: "Tone", what: "Less severe mid scoop than a standard Muff." },
    { name: "Sustain", what: "Fuzz amount." },
  ],

  // --- Alternatives, where the layout genuinely differs ------------------
  "biyang-ad10-delay": [
    { name: "Time", what: "Delay time. The AD-10 is a true bucket-brigade circuit, so it's short." },
    { name: "Repeat", what: "Number of repeats - the AD-10 labels this Repeat, not Feedback." },
    { name: "Mix", what: "Blend of delayed signal against dry - labelled Mix, not Level." },
  ],
  "digitech-bad-monkey": [
    { name: "Level", what: "Output volume." },
    { name: "Gain", what: "Amount of overdrive." },
    { name: "Low", what: "Dedicated bass control - the thing a Tube Screamer lacks." },
    { name: "High", what: "Dedicated treble control." },
    { name: "Mixer out", what: "Second output with cab simulation, for going to a desk." },
  ],
  "mooer-green-mile": [
    { name: "Volume", what: "Output level." },
    { name: "Tone", what: "Treble roll-off." },
    { name: "Gain", what: "Drive amount." },
    { name: "Mode switch", what: "Warm for classic Tube Screamer, Hot for more gain than the original." },
  ],
  "mooer-ensemble-chorus": [
    { name: "Level", what: "Blend of chorus against dry - a control the CE-2 doesn't have." },
    { name: "Rate", what: "Modulation speed." },
    { name: "Depth", what: "Modulation intensity." },
  ],
  "mooer-reecho": [
    { name: "Level", what: "Volume of the repeats." },
    { name: "F.Back", what: "Number of repeats." },
    { name: "Time", what: "Delay time." },
    { name: "Mode", what: "Analog, Real Echo and Tape voicings." },
  ],
  "behringer-sf300-super-fuzz": [
    { name: "Volume", what: "Output level." },
    { name: "Treble", what: "Top-end shaping." },
    { name: "Bass", what: "Low-end shaping." },
    { name: "Mode switch", what: "Boost, Fuzz 1 and Fuzz 2 - mirrors the FZ-2's gain modes." },
  ],
  "behringer-hm300-heavy-distortion": [
    { name: "Dist", what: "Distortion amount." },
    { name: "Level", what: "Output volume." },
    { name: "Low / High", what: "Two-band Colour EQ, same layout as the HM-2." },
  ],
  "danelectro-fish-n-chips": [
    { name: "7 sliders", what: "Cut or boost seven bands across the guitar range." },
    { name: "Level", what: "Output volume, usable as a boost." },
  ],
  "biyang-od-8": [
    { name: "Drive", what: "Overdrive amount." },
    { name: "Tone", what: "Treble roll-off." },
    { name: "Level", what: "Output volume." },
    { name: "Op-amp socket", what: "Swap the chip to retune the drive's character." },
  ],
  "mosky-big-fuzz": [
    { name: "Volume / Tone / Sustain", what: "Standard Muff layout." },
    { name: "Mode selector", what: "Switches between several Muff variants in one box." },
  ],
};

/**
 * Players documented as using a specific budget clone.
 *
 * Deliberately sparse. Budget clones almost never have verifiable famous
 * users, and inventing them would be worse than showing nothing - so a pedal
 * missing here falls back to the original's players, clearly labelled as such
 * in the UI rather than implied to be users of the clone.
 */
export const ALTERNATIVE_ARTISTS: Record<string, string[]> = {
  // Behringer's HM-2 clone is widely used in the Swedish death metal revival,
  // where the vintage original is scarce and expensive.
  "behringer-hm300-heavy-distortion": ["Bands in the HM-2 death metal revival"],
  // The SF300 is a long-running favourite in doom and stoner circles.
  "behringer-sf300-super-fuzz": ["Widely used across doom and stoner rock"],
};

export function controlsFor(slug: string): Control[] {
  return CONTROLS[slug] ?? [];
}

/**
 * Short editorial summaries of what players consistently report.
 *
 * Written by hand rather than scraped: retailer review text is copyrighted and
 * both Amazon and Reverb block automated access. See scripts/fetch-details.mjs.
 */
export const VERDICTS: Record<string, string> = {
  "behringer-to800-vintage-overdrive":
    "The consensus budget pick. Owners consistently say it sounds like a Tube Screamer and feels like a toy - the circuit is right, the box isn't. Most advise buying it, then rehousing it if you gig.",
  "joyo-jf-01-vintage-overdrive":
    "Widely recommended as the sensible upgrade over the Behringer: same idea, metal enclosure, true bypass. Noise at high gain is the recurring complaint.",
  "mooer-green-mile":
    "Praised almost universally for build quality and the board space it saves. The Hot mode is what wins people over - it goes further than a real TS9.",
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
