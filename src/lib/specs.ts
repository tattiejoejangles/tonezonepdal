import type { Spec } from "./types";

/**
 * The canonical spec vocabulary.
 *
 * Specs are stored per pedal as free label/value pairs - that shape stays,
 * because it is what the admin form edits and what a spec sheet actually is:
 * what's worth stating varies by pedal, and inventing a column for every
 * possible field would give every row forty nulls.
 *
 * What this module adds on top is agreement about names and units. The
 * catalogue had arrived at "Current Draw" and "Current draw" as separate facts,
 * a label reading "Bypass: True Bypass" whose value was also "True Bypass", and
 * one row spelled "nput Impedance". Compared side by side those produce
 * duplicate rows, or worse, a row that looks like a difference when both pedals
 * say the same thing.
 *
 * So: every field has one canonical label, a set of aliases that resolve to it,
 * a group, a position, and - where the value is a quantity - a unit and a
 * direction. The direction is what lets the comparison say "180g lighter"
 * instead of printing two strings and leaving the reader to subtract.
 */

export type SpecGroup =
  | "size"
  | "power"
  | "signal"
  | "controls"
  | "build"
  | "amp";

export const SPEC_GROUPS: { id: SpecGroup; label: string }[] = [
  { id: "size", label: "Size & weight" },
  { id: "power", label: "Power" },
  { id: "signal", label: "Signal & sound" },
  { id: "controls", label: "Controls & connections" },
  { id: "build", label: "Build" },
  { id: "amp", label: "Amplifier" },
];

/**
 * Which way is better for a quantity.
 *
 * "lower" for the things you want less of - board space, weight, current draw,
 * output impedance. "higher" for headroom, delay time, presets. Fields with no
 * entry here are facts rather than merits: 9V DC is not better or worse than
 * 18V DC, it is different, and pretending otherwise would put a winner's tick
 * against half the table for no reason.
 */
export type Direction = "lower" | "higher";

export interface SpecField {
  id: string;
  /** The one spelling used everywhere it is displayed. */
  label: string;
  group: SpecGroup;
  /**
   * Alternate labels found in the data, normalised by `key()` before matching.
   * Add to this rather than editing rows when a new spelling turns up.
   */
  aliases?: string[];
  /** Present when the value is a quantity that can be compared numerically. */
  numeric?: { unit: string; direction?: Direction };
  /** Shown as help text against the row in the comparison. */
  hint?: string;
}

/**
 * Ordered: the comparison and the spec sheet both render in this sequence, so
 * the same fact is always in the same place on every pedal.
 */
export const SPEC_FIELDS: SpecField[] = [
  // Size & weight ----------------------------------------------------------
  {
    id: "width",
    label: "Width",
    group: "size",
    aliases: ["width mm"],
    numeric: { unit: "mm", direction: "lower" },
    hint: "Across the board. The number that decides what else fits.",
  },
  {
    id: "depth",
    label: "Depth",
    group: "size",
    aliases: ["length", "depth mm"],
    numeric: { unit: "mm", direction: "lower" },
  },
  {
    id: "height",
    label: "Height",
    group: "size",
    aliases: ["height mm"],
    numeric: { unit: "mm", direction: "lower" },
  },
  {
    id: "footprint",
    label: "Board space",
    group: "size",
    numeric: { unit: "cm²", direction: "lower" },
    hint: "Width × depth - derived, so two pedals quoted differently still compare.",
  },
  {
    id: "weight",
    label: "Weight",
    group: "size",
    aliases: ["mass"],
    numeric: { unit: "g", direction: "lower" },
  },

  // Power ------------------------------------------------------------------
  {
    id: "power",
    label: "Power",
    group: "power",
    aliases: [
      "power supply",
      "power parameters",
      "psu",
      "power requirements",
      "power needs",
    ],
  },
  {
    id: "current_draw",
    label: "Current draw",
    group: "power",
    aliases: ["current consumption", "power consumption", "draw"],
    numeric: { unit: "mA", direction: "lower" },
    hint: "How much of your power supply it uses.",
  },
  { id: "battery", label: "Battery", group: "power", aliases: ["batteries"] },

  // Signal & sound ---------------------------------------------------------
  {
    id: "bypass",
    label: "Bypass",
    group: "signal",
    aliases: ["bypass type", "bypass setup", "switching", "bypass: true bypass"],
  },
  {
    id: "circuit",
    label: "Circuit",
    group: "signal",
    aliases: [
      "circuit type",
      "circuitry",
      "signal line",
      "signal path",
      "analogue digital",
      "dsp processing",
    ],
    // No bare "type" alias: it turns up meaning enclosure type, amp type and
    // effect type, and binding it to one of those would quietly misfile the
    // other two.
  },
  {
    id: "clipping",
    label: "Clipping",
    group: "signal",
    aliases: ["clipping diodes", "diodes"],
  },
  {
    id: "input_impedance",
    label: "Input impedance",
    group: "signal",
    // The typo below is in the live data. Listing it here fixes the row without
    // a data migration, and harmlessly does nothing once the row is corrected.
    aliases: ["nput impedance", "input z"],
    numeric: { unit: "Ω", direction: "higher" },
  },
  {
    id: "output_impedance",
    label: "Output impedance",
    group: "signal",
    aliases: ["output z"],
    numeric: { unit: "Ω", direction: "lower" },
  },
  {
    id: "delay_time",
    label: "Max delay",
    group: "signal",
    aliases: ["delay time", "delay range", "max delay time"],
    numeric: { unit: "ms", direction: "higher" },
  },
  {
    id: "sample_rate",
    label: "Sample rate",
    group: "signal",
    aliases: ["sampling rate", "a d conversion"],
  },
  {
    id: "noise",
    label: "Noise floor",
    group: "signal",
    aliases: ["signal to noise", "signal to noise ratio", "residual noise"],
  },

  // Controls & connections -------------------------------------------------
  {
    id: "controls",
    label: "Controls",
    group: "controls",
    aliases: ["knobs", "control layout"],
  },
  {
    id: "connections",
    label: "Connections",
    group: "controls",
    aliases: ["input output", "i o", "jacks", "sockets", "audio paths"],
  },
  // Inputs and outputs get their own fields rather than both aliasing to
  // Connections. Several pedals list the two separately, and folding them
  // together meant the second one silently lost to the first.
  { id: "inputs", label: "Inputs", group: "controls" },
  { id: "outputs", label: "Outputs", group: "controls" },
  {
    id: "eq",
    label: "EQ",
    group: "controls",
    aliases: ["tone controls", "eq section"],
  },
  { id: "stereo", label: "Stereo", group: "controls", aliases: ["true stereo"] },
  {
    id: "extras",
    label: "Extra I/O",
    group: "controls",
    aliases: ["midi", "expression", "expression pedal", "tap tempo", "footswitch jack"],
  },
  {
    id: "presets",
    label: "Presets",
    group: "controls",
    aliases: ["memory", "patches"],
    numeric: { unit: "", direction: "higher" },
  },
  {
    id: "effects",
    label: "Effects",
    group: "controls",
    aliases: ["available engines", "modes", "voicings", "algorithms"],
  },

  // Build ------------------------------------------------------------------
  {
    id: "enclosure",
    label: "Enclosure",
    group: "build",
    aliases: ["enclosure material", "housing", "case", "chassis", "chassis layout"],
  },
  {
    id: "footswitch",
    label: "Footswitch",
    group: "build",
    aliases: ["switch", "switch type"],
  },
  { id: "made_in", label: "Made in", group: "build", aliases: ["country of origin", "origin"] },
  { id: "warranty", label: "Warranty", group: "build", aliases: ["guarantee"] },

  // Amplifier --------------------------------------------------------------
  {
    id: "power_output",
    label: "Power output",
    group: "amp",
    aliases: ["output wattage", "wattage", "rms power", "output power"],
    numeric: { unit: "W", direction: "higher" },
  },
  {
    id: "speaker",
    label: "Speaker",
    group: "amp",
    aliases: ["speakers", "speaker type", "driver", "speaker configuration"],
  },
  {
    id: "channels",
    label: "Channels",
    group: "amp",
    numeric: { unit: "", direction: "higher" },
  },
  {
    id: "valves",
    label: "Valves",
    group: "amp",
    aliases: ["tubes", "valve complement"],
  },
  { id: "preamp_valves", label: "Preamp valves", group: "amp", aliases: ["preamp tubes"] },
  { id: "power_valves", label: "Power valves", group: "amp", aliases: ["power tubes"] },
  { id: "amp_type", label: "Amp type", group: "amp", aliases: ["amplifier type"] },
  { id: "reverb", label: "Reverb", group: "amp" },
  { id: "cabinet", label: "Cabinet", group: "amp", aliases: ["cab", "cabinet type"] },
];

/**
 * Matching key for a label: lowercase, punctuation collapsed to single spaces.
 *
 * Exactly the same normalisation is applied to a stored label and to every
 * alias, which is what makes "Current Draw", "current draw" and "Current-Draw"
 * one field.
 */
function key(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const FIELD_BY_KEY = new Map<string, SpecField>();
for (const field of SPEC_FIELDS) {
  FIELD_BY_KEY.set(key(field.label), field);
  for (const alias of field.aliases ?? []) {
    // Canonical labels win: an alias may never shadow another field's own name.
    if (!FIELD_BY_KEY.has(key(alias))) FIELD_BY_KEY.set(key(alias), field);
  }
}

export const FIELD_BY_ID = new Map(SPEC_FIELDS.map((field) => [field.id, field]));

/** The canonical field a stored label belongs to, if any. */
export function fieldFor(label: string): SpecField | undefined {
  return FIELD_BY_KEY.get(key(label));
}

/* ------------------------------------------------------------------ */

/**
 * A spec resolved against the vocabulary.
 *
 * `value` stays the text as written - "9V DC centre-negative (2.1mm)" says more
 * than any structured decomposition of it would. `amount` is the same fact as a
 * number when there is one, and only exists so two of them can be subtracted.
 */
export interface ResolvedSpec {
  field: SpecField | null;
  label: string;
  value: string;
  amount: number | null;
}

/**
 * Pulls a quantity out of a spec value.
 *
 * Unit-aware because the catalogue mixes them: weight arrives as "400g" and as
 * "1.2 kg", impedance as "1M" and "1000000", delay as "600ms" and "1.2 s". All
 * are converted to the field's own unit so the numbers are commensurable.
 *
 * Returns null rather than guessing when the value is a range or a list -
 * "9V-18V" is genuinely two numbers, and picking one would silently misreport
 * it. The text still shows; only the arithmetic is skipped.
 */
export function parseAmount(field: SpecField, value: string): number | null {
  if (!field.numeric) return null;

  const text = value.toLowerCase().replace(/,/g, "");

  // A dash between two numbers means a range. Hyphens inside words ("centre-
  // negative") and negative signs are not ranges, hence the digit on both sides.
  if (/\d\s*(?:-|–|to)\s*\d/.test(text)) return null;

  const match = text.match(/(-?\d+(?:\.\d+)?)\s*([a-zµkmgω%"]*)/);
  if (!match) return null;

  const raw = Number.parseFloat(match[1]);
  if (!Number.isFinite(raw)) return null;

  const unit = match[2] ?? "";

  switch (field.numeric.unit) {
    case "mm":
      if (unit.startsWith("cm")) return raw * 10;
      if (unit.startsWith("m") && !unit.startsWith("mm")) return raw * 1000;
      if (unit.startsWith('"') || unit.startsWith("in")) return raw * 25.4;
      return raw;
    case "g":
      if (unit.startsWith("kg")) return raw * 1000;
      if (unit.startsWith("lb")) return raw * 453.592;
      if (unit.startsWith("oz")) return raw * 28.3495;
      return raw;
    case "mA":
      if (unit.startsWith("a") && !unit.startsWith("ma")) return raw * 1000;
      if (unit.startsWith("µa") || unit.startsWith("ua")) return raw / 1000;
      return raw;
    case "ms":
      if (unit.startsWith("s") && !unit.startsWith("sa")) return raw * 1000;
      return raw;
    case "Ω":
      if (unit.startsWith("m")) return raw * 1_000_000;
      if (unit.startsWith("k")) return raw * 1000;
      return raw;
    case "W":
      if (unit.startsWith("kw")) return raw * 1000;
      return raw;
    default:
      return raw;
  }
}

/**
 * Splits a combined dimensions row into width, depth and height.
 *
 * "73 x 129 x 59 mm" is one row in the data and three comparable numbers. The
 * unit is usually written once at the end, so it is applied to all three.
 * Returns null unless it finds exactly three numbers, because two could be
 * width × depth or depth × height and there is no way to tell.
 */
export function splitDimensions(value: string): Spec[] | null {
  const text = value.toLowerCase().replace(/,/g, "");
  const numbers = text.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length !== 3) return null;
  if (!/\d\s*(?:x|×|\*)\s*\d/.test(text)) return null;

  const unit = text.match(/(mm|cm|in|")\s*$/)?.[1] ?? "mm";

  // W × D × H is the order every retailer in the catalogue quotes.
  return [
    { label: "Width", value: `${numbers[0]}${unit}` },
    { label: "Depth", value: `${numbers[1]}${unit}` },
    { label: "Height", value: `${numbers[2]}${unit}` },
  ];
}

/**
 * Every spec for one item, canonicalised.
 *
 * Combined "Dimensions" rows are expanded first, so a pedal that quotes one row
 * and a pedal that quotes three end up with the same three fields. Board space
 * is then derived from width and depth - it is the number that actually answers
 * "will this fit", and no retailer publishes it.
 *
 * Anything with no canonical home is kept verbatim in `extras` rather than
 * dropped: an unrecognised label is a fact we haven't catalogued yet, not
 * noise, and losing it would make the spec sheet worse than the raw data.
 */
export function resolveSpecs(specs: readonly Spec[]): {
  byField: Map<string, ResolvedSpec>;
  extras: ResolvedSpec[];
} {
  const byField = new Map<string, ResolvedSpec>();
  const extras: ResolvedSpec[] = [];

  const expanded: Spec[] = [];
  for (const spec of specs) {
    if (!spec.label?.trim() || !spec.value?.trim()) continue;

    const isDimensions = key(spec.label) === "dimensions" || key(spec.label) === "size";
    const parts = isDimensions ? splitDimensions(spec.value) : null;

    if (parts) {
      expanded.push(...parts);
    } else {
      expanded.push(spec);
    }
  }

  for (const spec of expanded) {
    const field = fieldFor(spec.label);
    const value = spec.value.trim();

    if (!field) {
      extras.push({ field: null, label: spec.label.trim(), value, amount: null });
      continue;
    }

    // First one wins, so a canonical row beats a duplicate alias of it. The
    // loser is kept as an extra rather than dropped: two rows resolving to one
    // field usually means the vocabulary is too coarse for that pedal, and
    // silently deleting the second is how a real spec goes missing.
    if (byField.has(field.id)) {
      extras.push({ field: null, label: spec.label.trim(), value, amount: null });
      continue;
    }

    byField.set(field.id, {
      field,
      label: field.label,
      value,
      amount: parseAmount(field, value),
    });
  }

  const width = byField.get("width")?.amount;
  const depth = byField.get("depth")?.amount;
  if (width && depth && !byField.has("footprint")) {
    const cm2 = (width / 10) * (depth / 10);
    byField.set("footprint", {
      field: FIELD_BY_ID.get("footprint")!,
      label: "Board space",
      value: `${cm2.toFixed(0)} cm²`,
      amount: cm2,
    });
  }

  return { byField, extras };
}

/**
 * The spec sheet for one item, in canonical order, grouped for display.
 *
 * Used by the pedal and clone pages so an individual page and the comparison
 * present the same facts in the same sequence - the comparison reads the pedals'
 * own data rather than holding a second copy of it.
 */
export function groupedSpecs(
  specs: readonly Spec[],
): { group: SpecGroup; label: string; specs: ResolvedSpec[] }[] {
  const { byField, extras } = resolveSpecs(specs);

  const groups = SPEC_GROUPS.map(({ id, label }) => ({
    group: id,
    label,
    specs: SPEC_FIELDS.filter((field) => field.group === id)
      .map((field) => byField.get(field.id))
      .filter((spec): spec is ResolvedSpec => spec !== undefined),
  })).filter((group) => group.specs.length > 0);

  if (extras.length > 0) {
    groups.push({ group: "build", label: "Also listed", specs: extras });
  }

  return groups;
}

/** How many canonical fields an item has filled in - drives "how complete". */
export function specCompleteness(specs: readonly Spec[]): {
  filled: number;
  total: number;
} {
  const { byField } = resolveSpecs(specs);
  // Board space is derived, so counting it would flatter an item that only
  // listed width and depth.
  const filled = [...byField.keys()].filter((id) => id !== "footprint").length;
  return { filled, total: SPEC_FIELDS.length - 1 };
}
