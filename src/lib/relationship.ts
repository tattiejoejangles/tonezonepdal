/**
 * What a budget pedal actually is to the expensive one.
 *
 * Everything was called a "clone", which is wrong often enough to matter. A
 * Behringer TO800 really is a Tube Screamer circuit in a plastic box - same
 * op-amp, same clipping, same mid-hump. A Wampler Tumnus is a Klon circuit
 * reworked with a real EQ. A Boss BD-2 is not a Tube Screamer at all; it does
 * the same job by other means, and telling somebody it is a clone sets them up
 * to be disappointed by the thing it does differently.
 *
 * Three values, because two could not hold that middle case, and the middle
 * case is where most of the interesting pedals live.
 */
export const RELATIONSHIPS = ["clone", "inspired", "alternative"] as const;

export type Relationship = (typeof RELATIONSHIPS)[number];

export function isRelationship(value: string): value is Relationship {
  return (RELATIONSHIPS as readonly string[]).includes(value);
}

interface RelationshipCopy {
  /** On a ribbon or a chip. Two words at most. */
  label: string;
  /** For the admin form, and the tooltip. */
  hint: string;
  /** Fills the sentence "This is a ___ the Ibanez Tube Screamer." */
  phrase: string;
  /** Tailwind classes for the chip. */
  tone: string;
}

export const RELATIONSHIP_COPY: Record<Relationship, RelationshipCopy> = {
  clone: {
    label: "Clone",
    hint: "A copy of the same circuit - same topology, usually the same chips.",
    phrase: "a clone of",
    tone: "bg-emerald-600 text-white",
  },
  inspired: {
    label: "Based on",
    hint: "Built on that circuit but changed - extra controls, different clipping, a tweaked EQ.",
    phrase: "based on",
    tone: "bg-amber-500 text-stone-900",
  },
  alternative: {
    label: "Alternative",
    hint: "A different circuit that does the same job. Not a copy.",
    phrase: "an alternative to",
    tone: "bg-stone-700 text-white",
  },
};

/** "clone" / "based on" / "alternative", for a chip. */
export function relationshipLabel(relationship: Relationship): string {
  return RELATIONSHIP_COPY[relationship].label;
}

/**
 * The noun for a group of these, for headings and counts.
 *
 * "3 alternatives" is right whatever the mix, because an alternative is what
 * every one of them is *for* - the relationship says how it gets there.
 */
export function relationshipPhrase(relationship: Relationship): string {
  return RELATIONSHIP_COPY[relationship].phrase;
}
