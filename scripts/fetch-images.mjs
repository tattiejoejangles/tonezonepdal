/**
 * Resolves a product photo URL for every pedal in the catalogue and writes
 * them to src/data/images.generated.json.
 *
 * Sources, in order: Thomann (stocks nearly every budget brand and shoots
 * everything on white) then Amazon UK. Both give white-background product
 * shots, which is what keeps the catalogue visually consistent.
 *
 * Wikimedia Commons was a third source and has been removed: its photos are
 * pedals shot on desks and pedalboards, and a single in-situ snapshot among
 * clean product shots reads as a mistake. It's in the git history if the
 * design ever wants that look.
 *
 * Re-runnable: product URLs rot, so run this again when images start failing.
 *   node scripts/fetch-images.mjs           # only fills in missing entries
 *   node scripts/fetch-images.mjs --force   # re-resolves everything
 *   node scripts/fetch-images.mjs --limit 5 # first 5 pedals only, for testing
 */

import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

import { alternatives, originals } from "../src/data/pedals.ts";

const OUT = new URL("../src/data/images.generated.json", import.meta.url);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const THROTTLE_MS = 4000;
/** Waits between retries when a source rate-limits us. */
const BACKOFF_MS = [20_000, 45_000];

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = Number(args[args.indexOf("--limit") + 1]) || Infinity;
/** Comma-separated slugs, for re-checking specific pedals after a fix. */
const ONLY = args.includes("--only")
  ? new Set(args[args.indexOf("--only") + 1].split(","))
  : null;

/** Words that appear in half the pedal names and prove nothing about a match. */
const GENERIC = new Set([
  "the", "and", "pedal", "pedals", "guitar", "bass", "effect", "effects",
  "vintage", "analog", "analogue", "digital", "classic", "mini", "micro",
  "overdrive", "distortion", "delay", "chorus", "flanger", "fuzz", "boost",
  "equalizer", "equaliser", "graphic", "heavy", "metal", "blues", "drive",
  "super", "ultra", "hyper", "screamer", "tube", "stompbox",
]);

/** Filler that carries no identifying information in a product title. */
const NOISE = new Set([
  ...GENERIC,
  "pedal", "pedals", "guitar", "bass", "electric", "acoustic", "fx", "true",
  "bypass", "new", "original", "mk", "mkii", "mkiii", "ii", "iii", "series",
  "edition", "version", "stompbox", "for", "with", "and", "sound", "tone",
]);

const norm = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

/** Punctuation-free form, so "BF-2", "BF 2" and "bf2" all compare equal. */
const compact = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Words with internal punctuation stripped but spaces kept, so "DS-1" becomes
 * the single token "ds1" and can be compared exactly against "ds1x".
 */
const tokenize = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);

/**
 * Listings that mention our pedal but aren't it — the single biggest source
 * of wrong images. An Amazon search for "Ibanez TS9" returns power adapters
 * "compatible with TS9" long before it returns the pedal.
 */
const ACCESSORY =
  /\b(ac adapter|adapter|adaptor|power supply|power lead|psu|cable|cables|patch lead|gig bag|carry case|flight case|cover|strap|sticker|stickers|decal|knob|knobs|topper|toppers|replacement|spare|spares|bracket|velcro|battery|batteries|manual|poster|t-?shirt|mug|keyring|screws|pack of|set of|compatible with|designed for|fits your|pickguard|pedalboard|riser|bundle|b-?stock|ex-?demo|refurb\w*)\b|\+/i;

/** Tokens that actually identify this specific pedal. */
function keyTokens(pedal) {
  return norm(pedal.name)
    .split(" ")
    .filter((t) => t.length >= 2 && !GENERIC.has(t));
}

/**
 * Model designations like TS9, BF-2, TO800, JF-01, E20OD.
 * When a pedal has one, it is the only reliable way to tell a BF-2 from a
 * BF-3, so we insist on it rather than counting word overlap.
 */
/**
 * Rejects titles containing a distinctive word our pedal's name can't account
 * for — "Tone City Matcha Cream" is not the "Tone City Cream", and the only
 * clue is the unexplained word "matcha".
 *
 * Applied only to short, clean retailer titles. Amazon listings are long
 * marketing strings ("...Smooth Overdrive Tone with RC4558 Chip") where
 * unexplained words are the norm and this test would reject everything.
 */
function noUnexplainedWords(pedal, title) {
  if (title.length > 60) return true;

  const allowed = new Set([
    ...norm(pedal.name).split(" "),
    ...norm(pedal.brand).split(" "),
  ]);

  return !norm(title)
    .split(" ")
    .some((word) => word.length >= 2 && !NOISE.has(word) && !allowed.has(word));
}

/**
 * Requires the pedal's descriptive words to appear as a contiguous, whole-word
 * phrase in the title.
 *
 * Scattered word matching is far too loose: "vintage" + "overdrive" both
 * appear in "JOYO Blues Overdrive ... Vintage/Modern Voicing", which is a
 * different pedal, and substring matching let "bad monkey" match the DOD
 * "Badder Monkey". Demanding the actual phrase kills both.
 */
function hasPhrase(normalizedTitle, words, brand) {
  const brandWords = new Set(norm(brand).split(" "));
  const phrase = words.filter((word) => !brandWords.has(word)).join(" ");
  const target = phrase || words.join(" ");

  return ` ${normalizedTitle} `.includes(` ${target} `)
    || normalizedTitle.startsWith(`${target} `)
    || normalizedTitle.endsWith(` ${target}`)
    || normalizedTitle === target;
}

function modelCodes(name) {
  return (name.match(/\b[A-Za-z]{1,5}[-\s]?\d{1,4}[A-Za-z]{0,2}\b/g) ?? [])
    .map(compact)
    .filter((code) => /\d/.test(code) && code.length >= 2);
}

/**
 * Does a candidate product title refer to this exact pedal?
 * Returns 0 for no, or a confidence score for yes.
 *
 * Sets `lastBasis` to how the match was made: "model" when the model number
 * matched (high confidence), "name" when only the descriptive words did
 * (medium — budget pedals are often listed without their model number, e.g.
 * the Joyo JF-01 sells as plain "JOYO Vintage Overdrive Guitar Pedal").
 */
let lastBasis = null;

function matches(pedal, title) {
  lastBasis = null;
  if (!title) return 0;
  if (ACCESSORY.test(title)) return 0;

  const t = norm(title);
  const c = compact(title);

  // The whole brand must be present, not just its first word. Matching only
  // "Tone" of "Tone City" once accepted a skin cream titled "...for Uneven
  // Skin Tone" as the Tone City Cream.
  const brand = compact(pedal.brand);
  if (brand && !c.includes(brand)) return 0;

  const codes = modelCodes(pedal.name);
  if (codes.length > 0) {
    // A model number exists, so it has to be present. "BF-3" must not
    // satisfy a search for "BF-2". A trailing letter is fine (CE-2 → CE-2W
    // is the Waza reissue), but a trailing digit means a different pedal
    // entirely — "DD-2" must not match "DD-200".
    const titleTokens = tokenize(title);
    const tokenSet = new Set(titleTokens);

    // Prefer an exact model match, so a search for DS-1 doesn't settle for
    // the DS-1X when the actual DS-1 is further down the results.
    let hit = codes.find((code) => tokenSet.has(code));
    let exact = Boolean(hit);

    if (!hit) {
      // Accept a short letter suffix — CE-2 → CE-2W is the Waza reissue of
      // the same pedal. Reject a digit suffix — DD-2 → DD-200 is not.
      hit = codes.find((code) =>
        titleTokens.some((token) => {
          if (!token.startsWith(code)) return false;
          const suffix = token.slice(code.length);
          return suffix.length <= 2 && /^[a-z]*$/.test(suffix);
        }),
      );
    }
    if (hit) {
      // Bundle guard: if the title also names a product from a different
      // family, it's a multi-pedal listing and the photo shows both.
      const family = (code) => code.replace(/[0-9].*$/, "");
      const foreign = modelCodes(title).filter(
        (code) => family(code) !== family(hit),
      );
      if (foreign.length > 0) return 0;

      lastBasis = "model";
      // Shorter titles are more likely to be the bare product.
      return 2 + (exact ? 0.6 : 0.2) - Math.min(title.length, 200) / 1000;
    }

    // The model number is absent from the listing. Fall back to the
    // descriptive words, which is how most cheap clones are actually sold.
    const described = norm(
      codes.reduce(
        (name, code) =>
          name.replace(new RegExp(code.replace(/(.)(?=\d)/, "$1[-\\s]?"), "ig"), " "),
        pedal.name,
      ),
    )
      .split(" ")
      .filter((word) => word.length >= 2);

    // Two words minimum — "Caline CP-73" reduces to just "caline", which
    // would match any Caline pedal, so it stays unresolved instead.
    if (described.length < 2) return 0;
    if (!hasPhrase(t, described, pedal.brand)) return 0;
    if (!noUnexplainedWords(pedal, title)) return 0;

    // If the listing states a model number and it isn't ours, believe it.
    // "JOYO JF-319 ... Vintage Overdrive" is not the JF-01, however well the
    // descriptive words line up.
    const titleCodes = modelCodes(title);
    if (titleCodes.length > 0) return 0;

    lastBasis = "name";
    return 1 - Math.min(title.length, 200) / 1000;
  }

  // No model number (e.g. "Mooer Green Mile") — demand every naming word.
  const brandWords = new Set(norm(pedal.brand).split(" "));
  let tokens = keyTokens(pedal).filter((token) => !brandWords.has(token));

  if (tokens.length === 0) {
    // Everything distinctive was either the brand or a generic effect word
    // ("ENO Chorus", "Mooer Ultra Drive"). Matching on the brand alone would
    // accept any pedal that maker sells, so insist on the whole name instead.
    tokens = norm(pedal.name).split(" ").filter((token) => token.length >= 2);
  }

  if (tokens.length === 0) return 0;
  if (!hasPhrase(t, tokens, pedal.brand)) return 0;
  if (!noUnexplainedWords(pedal, title)) return 0;

  lastBasis = "name";
  return 1 - Math.min(title.length, 200) / 1000;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return m ? m[1] : "";
}

/**
 * Fetches HTML, backing off and retrying when a source rate-limits us.
 * Both Thomann and Amazon start returning 429 after a burst, so retrying
 * politely resolves far more pedals than hammering and giving up.
 */
async function getHtml(url) {
  for (let attempt = 0; ; attempt += 1) {
    let res;
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          "Accept-Language": "en-GB,en;q=0.9",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch (err) {
      // Transient connectivity blip rather than a refusal — worth retrying.
      if (attempt >= BACKOFF_MS.length) throw err;
      console.log(`      network error, retrying in ${BACKOFF_MS[attempt] / 1000}s`);
      await sleep(BACKOFF_MS[attempt]);
      continue;
    }

    if (res.ok) return res.text();

    const retryable = res.status === 429 || res.status === 503;
    if (!retryable || attempt >= BACKOFF_MS.length) {
      throw new Error(`HTTP ${res.status}`);
    }

    const retryAfter = Number(res.headers.get("retry-after")) * 1000;
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter
      : BACKOFF_MS[attempt];

    console.log(`      rate limited (${res.status}), waiting ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  }
}

// --- Sources ---------------------------------------------------------------

async function fromAmazon(pedal, query) {
  const html = await getHtml(
    `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}`,
  );

  const tags = html.match(/<img[^>]*class="[^"]*s-image[^"]*"[^>]*>/gi) ?? [];
  let best = null;

  for (const tag of tags) {
    const src = attr(tag, "src");
    const alt = decodeEntities(attr(tag, "alt"));
    if (!src.includes("media-amazon.com")) continue;

    const score = matches(pedal, alt);
    const basis = lastBasis;
    if (score > 0 && (!best || score > best.score)) {
      best = {
        score,
        basis,
        // Ask Amazon for a larger render than the search thumbnail.
        url: src.replace(/\._[A-Z0-9_,]+_\.(jpg|png|webp)/i, "._AC_SL600_.$1"),
        title: alt,
        source: "amazon",
      };
    }
  }

  return best;
}

async function fromThomann(pedal, query) {
  const html = await getHtml(
    `https://www.thomann.de/gb/search_dir.html?sw=${encodeURIComponent(query)}`,
  );

  // Product images are lazy-loaded, so the <img src> is a placeholder. Each
  // result tile does carry a numeric product id, and the CDN path is
  // predictable from it — more reliable than digging through data-srcset.
  const blocks = html.split('class="fx-product-list-entry"').slice(1);
  let best = null;

  for (const block of blocks) {
    const id = block.match(/data-product-id="(\d+)"/)?.[1];
    const alt = block.match(/<img[^>]*\balt="([^"]+)"/)?.[1];
    if (!id || !alt) continue;

    const title = decodeEntities(alt);
    const score = matches(pedal, title);
    const basis = lastBasis;
    if (score > 0 && (!best || score > best.score)) {
      best = {
        score,
        basis,
        url: `https://thumbs.static-thomann.de/thumb/thumb600x600/pics/prod/${id}.jpg`,
        title,
        source: "thomann",
      };
    }
  }

  return best;
}

/**
 * Wikimedia Commons — freely licensed, and the only source that carries the
 * discontinued classics no retailer sells any more. Its photos are pedals shot
 * on desks and boards rather than clean product shots, so it runs last, and
 * only on an exact model-number match: a general media repository will happily
 * return a photo of a man called Eno for a search for "ENO".
 */
async function fromCommons(pedal, query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search" +
    `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10` +
    "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800";

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  let best = null;

  for (const page of Object.values(json?.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl) continue;
    if (!/\.(jpg|jpeg|png)$/i.test(info.url ?? "")) continue;

    const title = String(page.title ?? "").replace(/^File:/, "");
    const score = matches(pedal, title);
    if (lastBasis !== "model") continue;

    if (score > 0 && (!best || score > best.score)) {
      best = {
        score,
        basis: "model",
        url: info.thumburl,
        title,
        source: "wikimedia",
        licence: info.extmetadata?.LicenseShortName?.value ?? "unknown",
      };
    }
  }

  return best;
}

// --- Driver ----------------------------------------------------------------

async function resolve(pedal) {
  // Retailers often list a pedal under a different name than its official one
  // ("Mooer AnaEcho" sells as "Mooer Ana Echo"). Each alias is tried as its
  // own identity, so both the search string and the match test use that name.
  const identities = [pedal, ...(pedal.aliases ?? []).map((name) => ({ ...pedal, name }))];

  for (const identity of identities) {
    const query = identity.searchQuery ?? `${identity.brand} ${identity.name}`;

    // Retailers first — they shoot on white, which keeps the grid consistent.
    // Wikimedia last, as a fallback for discontinued pedals no shop stocks:
    // its photos aren't on white, but a real photo beats no photo.
    for (const [name, fn] of [
      ["thomann", fromThomann],
      ["amazon", fromAmazon],
      ["wikimedia", fromCommons],
    ]) {
      try {
        const hit = await fn(identity, query);
        if (hit) return hit;
      } catch (err) {
        console.log(`      ${name} failed: ${err.message}`);
      }
      await sleep(THROTTLE_MS);
    }
  }

  return null;
}

async function main() {
  // Always merge with what's already there. --force means "re-resolve the
  // pedals I'm processing", never "discard the ones I'm not" — combining it
  // with --only used to wipe every other entry in the file.
  let existing = {};
  try {
    existing = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    // First run — nothing to merge.
  }

  const all = [...originals, ...alternatives]
    .filter((pedal) => !ONLY || ONLY.has(pedal.slug))
    .slice(0, LIMIT);
  const results = { ...existing };
  let found = 0;
  let missing = 0;

  for (const [i, pedal] of all.entries()) {
    if (!FORCE && results[pedal.slug]?.url) {
      found += 1;
      continue;
    }

    process.stdout.write(`[${i + 1}/${all.length}] ${pedal.brand} ${pedal.name}\n`);
    const hit = await resolve(pedal);

    if (hit) {
      results[pedal.slug] = {
        url: hit.url,
        source: hit.source,
        // "model" = the model number matched, so this is the right product.
        // "name" = only the descriptive words matched — worth eyeballing.
        confidence: hit.basis === "model" ? "high" : "medium",
        matchedTitle: hit.title,
        ...(hit.licence ? { licence: hit.licence } : {}),
      };
      found += 1;
      console.log(`      ✓ ${hit.source} [${hit.basis}] — ${hit.title}`);
      // Persist as we go: these runs take a long time and get interrupted.
      await writeFile(OUT, `${JSON.stringify(results, null, 2)}\n`);
    } else {
      // A forced re-resolve that finds nothing must clear the old value —
      // otherwise a match later proven wrong survives the re-run that
      // rejected it.
      if (results[pedal.slug]) {
        delete results[pedal.slug];
        await writeFile(OUT, `${JSON.stringify(results, null, 2)}\n`);
        console.log("      ✗ no confident match — cleared previous entry");
      } else {
        console.log("      ✗ no confident match");
      }
      missing += 1;
    }

    await sleep(THROTTLE_MS);
  }

  await writeFile(OUT, `${JSON.stringify(results, null, 2)}\n`);

  const bySource = {};
  for (const entry of Object.values(results)) {
    bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
  }

  console.log(`\nResolved ${found}, missing ${missing}`);
  console.log("By source:", bySource);
  console.log(`Written to ${OUT.pathname}`);
}

await main();
