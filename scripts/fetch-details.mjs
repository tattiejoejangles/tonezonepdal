/**
 * Builds the extra content behind the pedal modal and writes it to
 * src/data/details.generated.json.
 *
 *   node scripts/fetch-details.mjs            # only pedals with no entry yet
 *   node scripts/fetch-details.mjs --force    # re-resolve everything
 *   node scripts/fetch-details.mjs --only slug-a,slug-b
 *
 * Run it after adding pedals to src/data/pedals.ts and new entries pick up a
 * gallery automatically — `npm run images && npm run details`.
 *
 * ---------------------------------------------------------------------------
 * ON REVIEWS
 *
 * This script deliberately does NOT scrape review text. Two reasons, both
 * hard blockers rather than preferences:
 *
 *   1. Review text is the copyright of whoever wrote it. Republishing it
 *      wholesale on a commercial affiliate site is infringement, and it is
 *      the kind of thing that gets an Amazon Associates account terminated.
 *   2. Amazon and Reverb both block automated access to review pages
 *      (Reverb returns 403, Gear4music sits behind a Cloudflare challenge).
 *
 * The supported ways to get review content are:
 *   - Amazon Product Advertising API (needs an approved Associates account;
 *     returns ratings, not full review text)
 *   - Reverb's official API (needs a partner key)
 * Both give you structured ratings you can display legitimately.
 *
 * In the meantime the modal shows a hand-written `verdict` per pedal from
 * src/data/details.ts, which summarises what players report without copying
 * anyone's words. Add entries there as you research pedals.
 * ---------------------------------------------------------------------------
 */

import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

import { alternatives, originals } from "../src/data/pedals.ts";

const OUT = new URL("../src/data/details.generated.json", import.meta.url);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const THROTTLE_MS = 4000;
const MAX_IMAGES = 4;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY = args.includes("--only")
  ? new Set(args[args.indexOf("--only") + 1].split(","))
  : null;

const norm = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const compact = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const ACCESSORY =
  /\b(adapter|adaptor|power supply|psu|cable|gig bag|case|cover|strap|sticker|knob|topper|replacement|bracket|velcro|battery|manual|poster|pack of|set of|compatible with|pedalboard)\b|\+/i;

/**
 * A looser match than the image script's, on purpose: this only ever adds
 * extra shots to a gallery whose first image is already the verified one, so
 * a near-miss costs far less than it would as the pedal's only photo.
 */
function plausible(pedal, title) {
  if (!title || ACCESSORY.test(title)) return false;

  const c = compact(title);
  if (!c.includes(compact(pedal.brand))) return false;

  const codes =
    (pedal.name.match(/\b[A-Za-z]{1,5}[-\s]?\d{1,4}[A-Za-z]{0,2}\b/g) ?? []).map(compact);

  if (codes.length > 0) {
    return codes.some((code) => new RegExp(`${code}(?![0-9])`).test(c));
  }

  const brandWords = new Set(norm(pedal.brand).split(" "));
  const words = norm(pedal.name)
    .split(" ")
    .filter((w) => w.length >= 3 && !brandWords.has(w));

  return words.length > 0 && words.every((w) => norm(title).includes(w));
}

async function getHtml(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en-GB,en;q=0.9" },
      });
      if (res.ok) return res.text();
      if (res.status !== 429 && res.status !== 503) return "";
    } catch {
      // fall through to the backoff
    }
    await sleep(15_000 * (attempt + 1));
  }
  return "";
}

async function thomannImages(pedal, query) {
  const html = await getHtml(
    `https://www.thomann.de/gb/search_dir.html?sw=${encodeURIComponent(query)}`,
  );
  const found = [];

  for (const block of html.split('class="fx-product-list-entry"').slice(1)) {
    const id = block.match(/data-product-id="(\d+)"/)?.[1];
    const alt = block.match(/<img[^>]*\balt="([^"]+)"/)?.[1];
    if (id && alt && plausible(pedal, alt)) {
      found.push(`https://thumbs.static-thomann.de/thumb/thumb600x600/pics/prod/${id}.jpg`);
    }
  }

  return found;
}

async function amazonImages(pedal, query) {
  const html = await getHtml(`https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}`);
  const found = [];

  for (const tag of html.match(/<img[^>]*class="[^"]*s-image[^"]*"[^>]*>/gi) ?? []) {
    const src = tag.match(/src="([^"]+)"/)?.[1] ?? "";
    const alt = (tag.match(/alt="([^"]*)"/)?.[1] ?? "").replace(/&amp;/g, "&");
    if (src.includes("media-amazon.com") && plausible(pedal, alt)) {
      found.push(src.replace(/\._[A-Z0-9_,]+_\.(jpg|png|webp)/i, "._AC_SL600_.$1"));
    }
  }

  return found;
}

async function main() {
  let results = {};
  try {
    results = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    // First run.
  }

  const all = [...originals, ...alternatives].filter(
    (pedal) => !ONLY || ONLY.has(pedal.slug),
  );

  let updated = 0;

  for (const [i, pedal] of all.entries()) {
    if (!FORCE && results[pedal.slug]) continue;

    console.log(`[${i + 1}/${all.length}] ${pedal.brand} ${pedal.name}`);

    const identities = [pedal, ...(pedal.aliases ?? []).map((n) => ({ ...pedal, name: n }))];
    const images = new Set();

    for (const identity of identities) {
      if (images.size >= MAX_IMAGES) break;
      const query = identity.searchQuery ?? `${identity.brand} ${identity.name}`;

      for (const fetcher of [thomannImages, amazonImages]) {
        try {
          for (const url of await fetcher(identity, query)) {
            images.add(url);
            if (images.size >= MAX_IMAGES) break;
          }
        } catch (err) {
          console.log(`      ${err.message}`);
        }
        await sleep(THROTTLE_MS);
        if (images.size >= MAX_IMAGES) break;
      }
    }

    results[pedal.slug] = { images: [...images] };
    updated += 1;
    console.log(`      ${images.size} gallery image(s)`);
    await writeFile(OUT, `${JSON.stringify(results, null, 2)}\n`);
  }

  await writeFile(OUT, `${JSON.stringify(results, null, 2)}\n`);
  const withImages = Object.values(results).filter((r) => r.images.length > 0).length;
  console.log(`\nProcessed ${updated}. ${withImages} pedals have gallery images.`);
}

await main();
