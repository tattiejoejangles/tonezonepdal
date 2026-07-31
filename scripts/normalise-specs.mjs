/**
 * Rewrites every item's stored specs into the canonical vocabulary and order.
 *
 *   node --env-file=.env.local scripts/normalise-specs.mjs --dry
 *   node --env-file=.env.local scripts/normalise-specs.mjs
 *
 * The catalogue had drifted to around sixty distinct labels for what is really
 * eight or nine facts: "Current Draw" beside "Current draw", dimensions split
 * into Width/Depth/Height on some rows and a single "Dimensions" on others, a
 * label reading "Current Draw: 7mA" with an empty value next to it, and a long
 * tail of one-offs. Two pedals could not be read side by side because they were
 * not describing themselves in the same words.
 *
 * This resolves every row through `src/lib/specs.ts` - the same module the site
 * renders through, imported directly so there is one definition of the
 * vocabulary rather than a copy that can drift - and writes the result back in
 * canonical order.
 *
 * WHAT HAPPENS TO A ROW
 *   - a label that maps to a field, by name or alias  -> kept, renamed, ordered
 *   - Width + Depth + Height                          -> merged into Dimensions
 *   - two rows landing on one field                   -> joined with " · "
 *   - anything with no field and no alias             -> dropped
 *
 * The last case is the only lossy one, and it is what the tidy-up asked for.
 * Run with --dry first: it prints every value that would be dropped, so the
 * ones worth keeping can be added to `features`' alias list instead.
 */

import { createClient } from "@supabase/supabase-js";

import { fieldFor, resolveSpecs, SPEC_FIELDS } from "../src/lib/specs.ts";

const DRY = process.argv.includes("--dry");

/** Everything the resolver would silently discard, for the dry run's report. */
function droppedFrom(specs) {
  const dropped = [];
  for (const spec of specs ?? []) {
    let label = spec.label?.trim();
    let value = spec.value?.trim();
    if (!label) continue;

    // Mirrors the "Label: value in the label" split resolveSpecs does, so the
    // report doesn't claim to drop rows that are actually recovered.
    if (!value && label.includes(":")) {
      const [head, ...rest] = label.split(":");
      const tail = rest.join(":").trim();
      if (head.trim() && tail) {
        label = head.trim();
        value = tail;
      }
    }

    if (!value) {
      dropped.push(`${label} (empty value)`);
      continue;
    }

    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (key === "width" || key === "depth" || key === "height" || key === "length") {
      continue;
    }
    if (!fieldFor(label)) dropped.push(`${label} = ${value}`);
  }
  return dropped;
}

async function processTable(supabase, table) {
  const { data, error } = await supabase.from(table).select("id, name, specs");
  if (error) throw error;

  let changed = 0;
  const allDropped = new Map();

  for (const row of data ?? []) {
    const before = row.specs ?? [];
    const after = resolveSpecs(before).map((spec) => ({
      label: spec.label,
      value: spec.value,
    }));

    for (const item of droppedFrom(before)) {
      allDropped.set(item, (allDropped.get(item) ?? 0) + 1);
    }

    if (JSON.stringify(before) === JSON.stringify(after)) continue;
    changed += 1;

    if (DRY) {
      console.log(`  ${row.name}`);
      console.log(`    ${before.length} rows -> ${after.map((s) => s.label).join(", ")}`);
    } else {
      const { error: writeError } = await supabase
        .from(table)
        .update({ specs: after })
        .eq("id", row.id);
      if (writeError) console.warn(`  FAILED ${row.name}: ${writeError.message}`);
    }
  }

  console.log(`${table}: ${changed} of ${data.length} rewritten`);
  return allDropped;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.log(
    `Vocabulary: ${SPEC_FIELDS.map((field) => field.label).join(" → ")}\n`,
  );

  const supabase = createClient(url, serviceKey);
  const dropped = new Map();

  for (const table of ["originals", "alternatives"]) {
    for (const [item, count] of await processTable(supabase, table)) {
      dropped.set(item, (dropped.get(item) ?? 0) + count);
    }
  }

  if (dropped.size > 0) {
    console.log(`\nDropped (${dropped.size} distinct):`);
    for (const [item, count] of [...dropped].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count}x  ${item}`);
    }
  }

  if (DRY) console.log("\nDry run - nothing written.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
