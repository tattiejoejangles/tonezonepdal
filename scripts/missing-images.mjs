/**
 * Lists every pedal with no resolved product photo, along with ready-made
 * search links for filling the gap by hand.
 *
 *   node scripts/missing-images.mjs
 *   node scripts/missing-images.mjs --md    # markdown table, easy to paste
 *
 * Why this exists: roughly half the budget clones in the catalogue simply
 * aren't stocked by any retailer that permits automated access. Daphon, ENO
 * and Biyang barely reach UK retail at all, and the DigiTech and Danelectro
 * models here are long discontinued — searches for them return power adapters
 * and unrelated pedals, which the matcher correctly rejects.
 *
 * To fill one in: find an image URL, then set `imageUrl` directly on that
 * pedal's record in src/data/pedals.ts. A hand-set URL always beats the
 * generated map and survives re-running the fetch scripts. Remember to add the
 * image's hostname to `remotePatterns` in next.config.ts, otherwise the Next
 * image optimiser rejects it and the pedal falls back to generated artwork.
 */

import { readFile } from "node:fs/promises";

import { alternatives, originals } from "../src/data/pedals.ts";

const IMAGES = new URL("../src/data/images.generated.json", import.meta.url);
const asMarkdown = process.argv.includes("--md");

const resolved = JSON.parse(await readFile(IMAGES, "utf8"));
const all = [...originals, ...alternatives];
const missing = all.filter((pedal) => !resolved[pedal.slug]?.url);

const link = (base, query) => `${base}${encodeURIComponent(query)}`;

if (asMarkdown) {
  console.log("| Pedal | Slug | Reverb | eBay UK | Images |");
  console.log("| --- | --- | --- | --- | --- |");
}

for (const pedal of missing) {
  // Most names already lead with the brand ("Daphon E20GE"), so only prefix it
  // when it's actually absent — otherwise searches read "Daphon Daphon E20GE".
  const query = pedal.name.toLowerCase().startsWith(pedal.brand.toLowerCase())
    ? pedal.name
    : `${pedal.brand} ${pedal.name}`;
  const reverb = link("https://reverb.com/marketplace?query=", query);
  const ebay = link("https://www.ebay.co.uk/sch/i.html?_nkw=", query);
  const images = link("https://www.google.com/search?tbm=isch&q=", query);

  if (asMarkdown) {
    console.log(
      `| ${query} | \`${pedal.slug}\` | [Reverb](${reverb}) | [eBay](${ebay}) | [Images](${images}) |`,
    );
  } else {
    console.log(`\n${query}`);
    console.log(`  slug:   ${pedal.slug}`);
    console.log(`  reverb: ${reverb}`);
    console.log(`  ebay:   ${ebay}`);
    console.log(`  images: ${images}`);
  }
}

console.error(
  `\n${missing.length} of ${all.length} pedals still need a photo ` +
    `(${all.length - missing.length} resolved).`,
);
