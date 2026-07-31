import type { Spec } from "./types";

/**
 * The spec vocabulary: a short, fixed, ordered list of fields.
 *
 * Specs are stored per item as free label/value pairs - that shape stays,
 * because it is what the database column holds. What this module does is fix
 * WHICH labels are allowed, what order they appear in, and how the old
 * spellings map onto them.
 *
 * It is deliberately short. The catalogue had drifted to ~60 distinct labels:
 * "Current Draw" and "Current draw" as separate facts, dimensions split three
 * ways as Width/Depth/Height on some pedals and one "Dimensions" row on others,
 * a label reading "Current Draw: 7mA" with an empty value beside it, and a long
 * tail of one-offs like "DSP Processing" and "Chassis Layout". Two pedals could
 * not be compared line for line because they were not describing themselves in
 * the same words.
 *
 * Now there are eight fields for a pedal and nine for an amp, always in the
 * same order, and the admin form offers exactly those and nothing else. Old
 * labels keep resolving through `aliases`, so nothing had to be re-typed.
 *
 * DIMENSIONS IS ONE FIELD. It reads as one fact - "112 × 68 × 40 mm" - and is
 * entered as one. The numbers are still pulled apart internally so the
 * comparison can work out board space and say which is smaller, but that is a
 * derivation, not three things to fill in.
 */

/** Whether a field belongs on a pedal, an amp, or both. */
export type AppliesTo = "all" | "pedal" | "amp";

export type Direction = "lower" | "higher";

export interface SpecField {
  id: string;
  /** The one spelling used everywhere - display, admin form, comparison. */
  label: string;
  appliesTo: AppliesTo;
  /**
   * Old labels that resolve here, normalised by `key()` before matching. Add to
   * this rather than re-typing rows when a new spelling turns up.
   */
  aliases?: string[];
  /** Present when the value is a quantity that can be compared numerically. */
  numeric?: { unit: string; direction: Direction };
  /** Shown under the field in the admin form and against the comparison row. */
  hint?: string;
  placeholder?: string;
}

/**
 * Ordered. Filtering by gear type preserves the order, so a pedal reads
 * Power → Current draw → Bypass → Connections → Dimensions → Weight →
 * Enclosure → Features, and an amp reads Power → Power output → Valves →
 * Speaker → Channels → Connections → Dimensions → Weight → Enclosure →
 * Features.
 */
export const SPEC_FIELDS: SpecField[] = [
  {
    id: "power",
    label: "Power",
    appliesTo: "all",
    aliases: [
      "power supply",
      "power parameters",
      "power needs",
      "power requirement",
      "power requirements",
      "power consumption",
      "psu",
      "battery",
      "internal operating voltage",
      "9v dc centre negative",
    ],
    placeholder: "9V DC centre-negative (2.1mm)",
    hint: "Voltage and polarity, and whether it takes a battery.",
  },
  {
    id: "current_draw",
    label: "Current draw",
    appliesTo: "pedal",
    aliases: ["current consumption", "draw", "current draw 7ma"],
    numeric: { unit: "mA", direction: "lower" },
    placeholder: "30mA",
    hint: "How much of your power supply it uses.",
  },
  {
    id: "bypass",
    label: "Bypass",
    appliesTo: "pedal",
    aliases: [
      "bypass type",
      "bypass setup",
      "bypass modes",
      "switching",
      "bypass true bypass",
    ],
    placeholder: "True bypass",
  },
  {
    id: "power_output",
    label: "Power output",
    appliesTo: "amp",
    aliases: ["output wattage", "wattage", "rms power", "output power"],
    numeric: { unit: "W", direction: "higher" },
    placeholder: "15W RMS",
  },
  {
    id: "valves",
    label: "Valves",
    appliesTo: "amp",
    aliases: [
      "tubes",
      "valve complement",
      "preamp tubes",
      "power tubes",
      "amplifier type",
    ],
    placeholder: "12AX7 preamp, EL84 power",
  },
  {
    id: "speaker",
    label: "Speaker",
    appliesTo: "amp",
    aliases: ["speakers", "speaker type", "speaker configuration", "driver"],
    placeholder: "1 x 12\" Celestion",
  },
  {
    id: "channels",
    label: "Channels",
    appliesTo: "amp",
    numeric: { unit: "", direction: "higher" },
    placeholder: "2",
  },
  {
    id: "connections",
    label: "Connections",
    appliesTo: "all",
    aliases: [
      "inputs",
      "outputs",
      "connectors",
      "connectivity",
      "audio paths",
      "input output",
      "i o",
      "jacks",
      "sockets",
    ],
    placeholder: "1/4\" mono in / out",
  },
  {
    id: "dimensions",
    label: "Dimensions",
    appliesTo: "all",
    // Width, depth and height are aliases so the rows that were stored split
    // still resolve; `resolveSpecs` recombines them into one value.
    aliases: ["size", "width", "depth", "height", "length"],
    placeholder: "73 × 129 × 59 mm",
    hint: "Width × depth × height. One line.",
  },
  {
    id: "weight",
    label: "Weight",
    appliesTo: "all",
    aliases: ["mass"],
    numeric: { unit: "g", direction: "lower" },
    placeholder: "360g",
  },
  {
    id: "enclosure",
    label: "Enclosure",
    appliesTo: "all",
    aliases: [
      "enclosure material",
      "housing",
      "housing material",
      "chassis",
      "chassis layout",
      "case",
    ],
    placeholder: "Die-cast metal",
  },
  {
    id: "features",
    label: "Features",
    appliesTo: "all",
    // The catch-all, and the reason nothing had to be deleted to get from ~60
    // labels to this list. For a delay or a modeller "9 modes, 200 presets" is
    // the most useful line on the sheet and there is nowhere else for it.
    aliases: [
      "effects",
      "engines",
      "available engines",
      "number of modes",
      "modes",
      "onboard presets",
      "presets",
      "memory",
      "patches",
      "eq",
      "delay time",
      "max delay",
      "reverb",
      "extras",
      "circuit type",
      "circuitry",
      "signal line",
      "signal path",
      "dsp processing",
      "clipping diodes",
      "controls",
    ],
    placeholder: "8 modes, tap tempo",
    hint: "Anything else worth stating - modes, presets, tap tempo.",
  },
];

export const FIELD_BY_ID = new Map(SPEC_FIELDS.map((field) => [field.id, field]));

/** The fields offered for one kind of gear, in order. */
export function fieldsFor(type: "pedal" | "amp"): SpecField[] {
  return SPEC_FIELDS.filter(
    (field) => field.appliesTo === "all" || field.appliesTo === type,
  );
}

/**
 * Matching key for a label: lowercase, punctuation collapsed to single spaces.
 *
 * Applied identically to a stored label and to every alias, which is what makes
 * "Current Draw", "current draw" and "Current-Draw" one field. It also flattens
 * the labels that had a value baked into them - "Current Draw: 7mA" keys as
 * "current draw 7ma", which is listed as an alias.
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

/** The canonical field a stored label belongs to, if any. */
export function fieldFor(label: string): SpecField | undefined {
  return FIELD_BY_KEY.get(key(label));
}

/* ------------------------------------------------------------------ */

/** A spec resolved against the vocabulary. */
export interface ResolvedSpec {
  field: SpecField;
  label: string;
  value: string;
  /** The value as a number in the field's own unit, where there is one. */
  amount: number | null;
}

/**
 * Pulls a quantity out of a spec value.
 *
 * Unit-aware because the catalogue mixes them: weight arrives as "400g" and as
 * "0.16 kg", current as "10 mA" and "1A". All are converted to the field's own
 * unit so two of them can be subtracted.
 *
 * Returns null rather than guessing when the value is a range - "60mA to 100mA"
 * is genuinely two numbers and picking one would misreport it. The text still
 * displays; only the arithmetic is skipped.
 */
export function parseAmount(field: SpecField, value: string): number | null {
  if (!field.numeric) return null;

  const text = value.toLowerCase().replace(/,/g, "");
  if (/\d\s*(?:-|–|to)\s*\d/.test(text)) return null;

  const match = text.match(/(-?\d+(?:\.\d+)?)\s*([a-zµω]*)/);
  if (!match) return null;

  const raw = Number.parseFloat(match[1]);
  if (!Number.isFinite(raw)) return null;

  const unit = match[2] ?? "";

  switch (field.numeric.unit) {
    case "g":
      if (unit.startsWith("kg")) return raw * 1000;
      if (unit.startsWith("lb")) return raw * 453.592;
      if (unit.startsWith("oz")) return raw * 28.3495;
      return raw;
    case "mA":
      if (unit.startsWith("a") && !unit.startsWith("ma")) return raw * 1000;
      return raw;
    case "W":
      if (unit.startsWith("kw")) return raw * 1000;
      return raw;
    default:
      return raw;
  }
}

/**
 * The three numbers inside a dimensions value.
 *
 * Returns null unless it finds exactly three separated by × or x - two could be
 * width × depth or depth × height and there is no way to tell which. Units are
 * usually written once at the end, so one unit applies to all three.
 */
export function parseDimensions(
  value: string,
): { width: number; depth: number; height: number } | null {
  const text = value.toLowerCase().replace(/,/g, "");
  if (!/\d\s*(?:x|×|\*)\s*\d/.test(text)) return null;

  const numbers = text.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 3) return null;

  const scale = /\bcm\b/.test(text) ? 10 : /\bin\b|"/.test(text) ? 25.4 : 1;
  const [width, depth, height] = numbers.slice(0, 3).map(Number);

  return { width: width * scale, depth: depth * scale, height: height * scale };
}

/** Board space in cm², the number that answers "will this fit". */
export function footprintOf(dimensions: string): number | null {
  const parsed = parseDimensions(dimensions);
  if (!parsed) return null;
  return (parsed.width / 10) * (parsed.depth / 10);
}

/**
 * Every spec for one item, resolved to the vocabulary and put in order.
 *
 * Rows stored as separate Width / Depth / Height are recombined into one
 * Dimensions value here, so an item saved before this change reads the same as
 * one saved after it without the stored data having to be migrated first.
 *
 * Anything resolving to a field that is already filled is appended to that
 * field's value rather than dropped - two rows landing on one field usually
 * means both said something true, and silently deleting the second is how a
 * real spec goes missing.
 */
export function resolveSpecs(specs: readonly Spec[]): ResolvedSpec[] {
  const values = new Map<string, string>();
  const dimensionParts = new Map<string, string>();

  for (const spec of specs) {
    let label = spec.label?.trim();
    let value = spec.value?.trim();
    if (!label) continue;

    // Rows entered as "Current Draw: 7mA" in the label with nothing in the
    // value. The fact is real and only the data entry was wrong, so it is
    // split here rather than thrown away for being shaped oddly.
    if (!value && label.includes(":")) {
      const [head, ...rest] = label.split(":");
      const tail = rest.join(":").trim();
      if (head.trim() && tail) {
        label = head.trim();
        value = tail;
      }
    }

    if (!value) continue;

    const k = key(label);

    // Held aside and recombined below, in width/depth/height order rather than
    // whatever order they happened to be stored in.
    if (k === "width" || k === "depth" || k === "height" || k === "length") {
      dimensionParts.set(k === "length" ? "depth" : k, value);
      continue;
    }

    const field = fieldFor(label);
    if (!field) continue;

    const existing = values.get(field.id);
    values.set(field.id, existing ? `${existing} · ${value}` : value);
  }

  if (!values.has("dimensions") && dimensionParts.size >= 3) {
    const strip = (part?: string) => (part ?? "").replace(/[^\d.]/g, "");
    values.set(
      "dimensions",
      `${strip(dimensionParts.get("width"))} × ${strip(dimensionParts.get("depth"))} × ${strip(dimensionParts.get("height"))} mm`,
    );
  }

  return SPEC_FIELDS.filter((field) => values.has(field.id)).map((field) => {
    const value = values.get(field.id)!;
    return {
      field,
      label: field.label,
      value,
      amount: parseAmount(field, value),
    };
  });
}

/** Resolved specs keyed by field id, for the comparison's row lookups. */
export function specsByField(
  specs: readonly Spec[],
): Map<string, ResolvedSpec> {
  return new Map(resolveSpecs(specs).map((spec) => [spec.field.id, spec]));
}

/** How many of the fields that apply to this item are filled in. */
export function specCompleteness(
  specs: readonly Spec[],
  type: "pedal" | "amp" = "pedal",
): { filled: number; total: number } {
  const present = new Set(resolveSpecs(specs).map((spec) => spec.field.id));
  const applicable = fieldsFor(type);
  return {
    filled: applicable.filter((field) => present.has(field.id)).length,
    total: applicable.length,
  };
}
