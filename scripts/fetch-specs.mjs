/**
 * Pulls published specifications from BOSS product pages and writes them
 * straight into Supabase.
 *
 *   node --env-file=.env.local scripts/fetch-specs.mjs --dry
 *   node --env-file=.env.local scripts/fetch-specs.mjs --only boss-ds-1-distortion
 *   node --env-file=.env.local scripts/fetch-specs.mjs
 *
 * ---------------------------------------------------------------------------
 * WHY ONLY BOSS
 *
 * Filling in dimensions and weight across the catalogue means finding a source
 * that publishes them and can actually be read. Of everything tried:
 *
 *   boss.info          - full specs per model, plain HTML, readable.      YES
 *   strymon.net        - dimensions in the copy, no weight.               PARTLY
 *   sweetwater.com     - full specs, but 403s every automated request.    NO
 *   thomann            - no dimensions or weight on most pedal pages.     NO
 *   ehx.com            - 403.                                            NO
 *   fender / orange    - 403.                                            NO
 *   behringer.com      - product URLs are opaque model codes.            NO
 *
 * So this script covers BOSS, which is the largest single-brand group in the
 * catalogue and the one with the best data. Everything else is entered by hand
 * through /admin - see docs/specs.md.
 *
 * THE RULE THIS SCRIPT EXISTS TO ENFORCE: a figure is either read from the
 * manufacturer's own page or it is left blank. Never inferred from a similar
 * model, never estimated. The comparison prints "Not listed" for a blank, which
 * is true; a plausible wrong weight is not.
 * ---------------------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";
import { setTimeout as sleep } from "node:timers/promises";

const DRY = process.argv.includes("--dry");
const ONLY = (() => {
  const index = process.argv.indexOf("--only");
  return index === -1 ? null : new Set(process.argv[index + 1]?.split(",") ?? []);
})();

/**
 * Catalogue slug -> BOSS model path.
 *
 * Only exact model matches belong here. The catalogue's combined entries
 * ("DD-2 / DD-3") cover two units whose weight and current draw differ, so
 * mapping them to whichever model still has a live page would attribute one
 * unit's figures to both.
 */
const BOSS_MODELS = {
  "boss-ds-1-distortion": "ds-1",
  "boss-bd-2-blues-driver": "bd-2",
  "boss-ch-1-super-chorus": "ch-1",
  "boss-mt-2-metal-zone": "mt-2",
  "boss-ge-7-graphic-equalizer": "ge-7",
  "boss-rv-6-reverb": "rv-6",
};

const LABELS = [
  [/width\D+(\d+)\s*mm/i, "Width", (m) => `${m[1]}mm`],
  [/depth\D+(\d+)\s*mm/i, "Depth", (m) => `${m[1]}mm`],
  [/height\D+(\d+)\s*mm/i, "Height", (m) => `${m[1]}mm`],
  [/weight\D+([\d.]+)\s*(g|kg)/i, "Weight", (m) => `${m[1]}${m[2].toLowerCase()}`],
  [/current draw\D+([\d.]+)\s*mA/i, "Current draw", (m) => `${m[1]}mA`],
  [/input impedance\D+([\d.]+)\s*(k|M)?\s*ohm/i, "Input impedance", (m) => `${m[1]}${m[2] ?? ""}Ω`],
  [/output impedance\D+([\d.]+)\s*(k|M)?\s*ohm/i, "Output impedance", (m) => `${m[1]}${m[2] ?? ""}Ω`],
];

/** Strips tags so the label/value pairs sit next to each other in plain text. */
function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

async function fetchSpecs(model) {
  const url = `https://www.boss.info/global/products/${model}/specifications/`;
  const response = await fetch(url, {
    headers: { "user-agent": "thetonezone-specs/1.0 (+https://thetonezone.co.uk)" },
  });

  if (!response.ok) {
    console.warn(`  ${model}: HTTP ${response.status}`);
    return null;
  }

  const text = toText(await response.text());
  const specs = [];

  for (const [pattern, label, format] of LABELS) {
    const match = text.match(pattern);
    if (match) specs.push({ label, value: format(match) });
  }

  return specs.length > 0 ? specs : null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!DRY && (!url || !serviceKey)) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = DRY ? null : createClient(url, serviceKey);
  const entries = Object.entries(BOSS_MODELS).filter(
    ([slug]) => !ONLY || ONLY.has(slug),
  );

  for (const [slug, model] of entries) {
    console.log(`${slug} (${model})`);
    const specs = await fetchSpecs(model);

    if (!specs) {
      console.log("  nothing readable - skipped");
      continue;
    }

    console.log(`  ${specs.map((s) => `${s.label}=${s.value}`).join(", ")}`);

    if (!DRY) {
      // Read-modify-write rather than a merge in SQL, so the script stays
      // usable against any Supabase project without installing merge_specs.
      const { data, error: readError } = await supabase
        .from("originals")
        .select("specs")
        .eq("slug", slug)
        .maybeSingle();

      if (readError || !data) {
        console.warn(`  couldn't read existing specs: ${readError?.message ?? "no row"}`);
        continue;
      }

      const incoming = new Set(specs.map((s) => s.label.toLowerCase()));
      const merged = [
        ...(data.specs ?? []).filter((s) => !incoming.has(String(s.label).toLowerCase())),
        ...specs,
      ];

      const { error } = await supabase
        .from("originals")
        .update({ specs: merged })
        .eq("slug", slug);

      console.log(error ? `  FAILED: ${error.message}` : `  saved ${merged.length} rows`);
    }

    // Courtesy delay - this is somebody else's server.
    await sleep(1200);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
