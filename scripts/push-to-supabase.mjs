/**
 * Pushes the hand-authored catalogue in src/data into Supabase.
 *
 *   npm run db:push
 *
 * Re-run this whenever you add pedals to src/data/pedals.ts. It upserts by id,
 * so existing rows are updated rather than duplicated.
 *
 * IMPORTANT: it never writes `image_url`. That column is yours — URLs you
 * paste into the Supabase dashboard survive every re-push. Script-fetched
 * images go to `auto_image_url`, and the site prefers image_url over it.
 *
 * Auth: uses SUPABASE_SERVICE_ROLE_KEY when present (get it from
 * Dashboard → Project Settings → API). Without it, falls back to the anon key,
 * which only works while a temporary write policy exists — so for normal use,
 * set the service role key in .env.local.
 */

import { readFile } from "node:fs/promises";

import { createClient } from "@supabase/supabase-js";

import { ALTERNATIVE_ARTISTS, CONTROLS, VERDICTS } from "../src/data/details.ts";
import { alternatives, originals } from "../src/data/pedals.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// `||` not `??`: an unset-but-present env var is an empty string, which `??`
// would happily accept as a key.
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing credentials. Set NEXT_PUBLIC_SUPABASE_URL and either\n" +
      "SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const images = JSON.parse(
  await readFile(new URL("../src/data/images.generated.json", import.meta.url), "utf8"),
);
const details = JSON.parse(
  await readFile(new URL("../src/data/details.generated.json", import.meta.url), "utf8"),
);

const credit = (slug) => {
  const entry = images[slug];
  if (!entry) return null;
  return [entry.source, entry.licence].filter(Boolean).join(" — ") || null;
};

const originalRows = originals.map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price_gbp: p.priceGBP,
  blurb: p.blurb,
  description: p.description ?? "",
  auto_image_url: images[p.slug]?.url ?? null,
  image_credit: credit(p.slug),
  tags: p.tags ?? [],
  artists: p.artists ?? [],
  aliases: p.aliases ?? [],
  popularity: p.popularity,
  search_query: p.searchQuery ?? null,
  controls: CONTROLS[p.slug] ?? [],
}));

const alternativeRows = alternatives.map((p) => ({
  id: p.id,
  slug: p.slug,
  original_id: p.originalId,
  name: p.name,
  brand: p.brand,
  price_gbp: p.priceGBP,
  blurb: p.blurb,
  auto_image_url: images[p.slug]?.url ?? null,
  image_credit: credit(p.slug),
  pros: p.pros ?? [],
  cons: p.cons ?? [],
  aliases: p.aliases ?? [],
  popularity: p.popularity,
  match_quality: p.matchQuality,
  search_query: p.searchQuery ?? null,
  verdict: VERDICTS[p.slug] ?? null,
  gallery: details[p.slug]?.images ?? [],
  controls: CONTROLS[p.slug] ?? [],
  artists: ALTERNATIVE_ARTISTS[p.slug] ?? [],
}));

async function push(table, rows) {
  // Chunked so a single oversized request can't fail the whole run.
  for (let i = 0; i < rows.length; i += 25) {
    const slice = rows.slice(i, i + 25);
    const { error } = await supabase.from(table).upsert(slice, { onConflict: "id" });
    if (error) {
      console.error(`${table} rows ${i}-${i + slice.length}: ${error.message}`);
      process.exit(1);
    }
  }
  console.log(`  ${table}: ${rows.length} rows upserted`);
}

console.log(`Pushing to ${url}`);
// Originals first — alternatives reference them by foreign key.
await push("originals", originalRows);
await push("alternatives", alternativeRows);

const { count: needing } = await supabase
  .from("pedals_needing_photos")
  .select("*", { count: "exact", head: true });

console.log(`\nDone. ${needing ?? "?"} pedals still have no photo.`);
console.log("Paste URLs into the image_url column in the Supabase dashboard to fix them.");
