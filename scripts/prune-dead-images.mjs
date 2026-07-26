/**
 * Removes image URLs that no longer resolve.
 *
 *   node scripts/prune-dead-images.mjs
 *
 * Retailer CDNs drop images when a product is delisted, and not every Thomann
 * product has a 600x600 render. A dead URL isn't fatal — PedalImage falls back
 * to generated artwork — but a fallback tile sitting in a gallery of real
 * photos looks like a bug, so it's better to drop them. Worth running
 * occasionally, and after any fetch.
 */

import { readFile, writeFile } from "node:fs/promises";

const IMAGES = new URL("../src/data/images.generated.json", import.meta.url);
const DETAILS = new URL("../src/data/details.generated.json", import.meta.url);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const cache = new Map();

async function alive(url) {
  if (cache.has(url)) return cache.get(url);

  let ok = false;
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
    // Some CDNs reject HEAD but serve GET, so double-check before discarding.
    ok = res.ok
      ? true
      : (await fetch(url, { headers: { "User-Agent": UA } })).ok;
  } catch {
    ok = false;
  }

  cache.set(url, ok);
  return ok;
}

const images = JSON.parse(await readFile(IMAGES, "utf8"));
const details = JSON.parse(await readFile(DETAILS, "utf8"));

let removedMain = 0;
for (const [slug, entry] of Object.entries(images)) {
  if (entry?.url && !(await alive(entry.url))) {
    console.log(`dead main image: ${slug}`);
    delete images[slug];
    removedMain += 1;
  }
}

let removedGallery = 0;
for (const [slug, entry] of Object.entries(details)) {
  const keep = [];
  for (const url of entry.images ?? []) {
    if (await alive(url)) keep.push(url);
    else {
      console.log(`dead gallery image: ${slug}`);
      removedGallery += 1;
    }
  }
  details[slug] = { images: keep };
}

await writeFile(IMAGES, `${JSON.stringify(images, null, 2)}\n`);
await writeFile(DETAILS, `${JSON.stringify(details, null, 2)}\n`);

console.log(
  `\nChecked ${cache.size} URLs. Removed ${removedMain} main and ${removedGallery} gallery images.`,
);
