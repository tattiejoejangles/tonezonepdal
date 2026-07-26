/**
 * Turns the hand-authored catalogue in src/data into SQL for Supabase.
 *
 *   node scripts/generate-seed.mjs           # writes supabase/seed/*.sql
 *
 * The generated SQL upserts, and deliberately does NOT touch `image_url`:
 * that column is for URLs you paste in the Supabase dashboard, and re-seeding
 * must never wipe them. Script-fetched images go to `auto_image_url`.
 *
 * Re-run this after adding pedals to src/data/pedals.ts, then apply the SQL.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";

import { VERDICTS } from "../src/data/details.ts";
import { alternatives, originals } from "../src/data/pedals.ts";

const OUT_DIR = new URL("../supabase/seed/", import.meta.url);

const images = JSON.parse(
  await readFile(new URL("../src/data/images.generated.json", import.meta.url), "utf8"),
);
const details = JSON.parse(
  await readFile(new URL("../src/data/details.generated.json", import.meta.url), "utf8"),
);

/** Postgres string literal, or NULL. */
const s = (value) =>
  value === undefined || value === null || value === ""
    ? "NULL"
    : `'${String(value).replace(/'/g, "''")}'`;

/** Postgres text[] literal. */
const arr = (values = []) =>
  values.length === 0
    ? "'{}'"
    : `ARRAY[${values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",")}]::text[]`;

const autoImage = (slug) => s(images[slug]?.url);
const credit = (slug) => {
  const entry = images[slug];
  if (!entry) return "NULL";
  const parts = [entry.source, entry.licence].filter(Boolean);
  return s(parts.join(" — "));
};
const gallery = (slug) => arr(details[slug]?.images ?? []);

const originalRows = originals.map(
  (p) => `(${[
    s(p.id),
    s(p.slug),
    s(p.name),
    s(p.brand),
    s(p.category),
    p.priceGBP,
    s(p.blurb),
    s(p.description),
    autoImage(p.slug),
    credit(p.slug),
    arr(p.tags),
    arr(p.artists),
    arr(p.aliases),
    p.popularity,
    s(p.searchQuery),
  ].join(",")})`,
);

const alternativeRows = alternatives.map(
  (p) => `(${[
    s(p.id),
    s(p.slug),
    s(p.originalId),
    s(p.name),
    s(p.brand),
    p.priceGBP,
    s(p.blurb),
    autoImage(p.slug),
    credit(p.slug),
    arr(p.pros),
    arr(p.cons),
    arr(p.aliases),
    p.popularity,
    p.matchQuality,
    s(p.searchQuery),
    s(VERDICTS[p.slug]),
    gallery(p.slug),
  ].join(",")})`,
);

/** Splits rows into chunks so no single statement gets unwieldy. */
function chunk(rows, size) {
  const out = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

await mkdir(OUT_DIR, { recursive: true });

const files = [];

chunk(originalRows, 10).forEach((rows, i) => {
  files.push([
    `01-originals-${i + 1}.sql`,
    `insert into public.originals
  (id, slug, name, brand, category, price_gbp, blurb, description,
   auto_image_url, image_credit, tags, artists, aliases, popularity, search_query)
values
${rows.join(",\n")}
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  brand = excluded.brand,
  category = excluded.category,
  price_gbp = excluded.price_gbp,
  blurb = excluded.blurb,
  description = excluded.description,
  auto_image_url = excluded.auto_image_url,
  image_credit = excluded.image_credit,
  tags = excluded.tags,
  artists = excluded.artists,
  aliases = excluded.aliases,
  popularity = excluded.popularity,
  search_query = excluded.search_query;
`,
  ]);
});

chunk(alternativeRows, 12).forEach((rows, i) => {
  files.push([
    `02-alternatives-${i + 1}.sql`,
    `insert into public.alternatives
  (id, slug, original_id, name, brand, price_gbp, blurb,
   auto_image_url, image_credit, pros, cons, aliases, popularity,
   match_quality, search_query, verdict, gallery)
values
${rows.join(",\n")}
on conflict (id) do update set
  slug = excluded.slug,
  original_id = excluded.original_id,
  name = excluded.name,
  brand = excluded.brand,
  price_gbp = excluded.price_gbp,
  blurb = excluded.blurb,
  auto_image_url = excluded.auto_image_url,
  image_credit = excluded.image_credit,
  pros = excluded.pros,
  cons = excluded.cons,
  aliases = excluded.aliases,
  popularity = excluded.popularity,
  match_quality = excluded.match_quality,
  search_query = excluded.search_query,
  verdict = excluded.verdict,
  gallery = excluded.gallery;
`,
  ]);
});

for (const [name, sql] of files) {
  await writeFile(new URL(name, OUT_DIR), sql);
}

console.log(
  `Wrote ${files.length} file(s) to supabase/seed — ` +
    `${originals.length} originals, ${alternatives.length} alternatives.`,
);
files.forEach(([name, sql]) => console.log(`  ${name} (${(sql.length / 1024).toFixed(1)} KB)`));
