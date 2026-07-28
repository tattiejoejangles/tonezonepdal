"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  ADMIN_COOKIE,
  isAdminConfigured,
  isAuthed,
  passwordMatches,
  sessionToken,
} from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { CATEGORIES, type Category } from "@/lib/types";

export interface ActionState {
  ok: boolean;
  message: string;
  /** Set on success so the form can link straight to what it just created. */
  href?: string;
}

/* -------------------------------------------------------------------------
   Parsing helpers. Everything arrives as a string from a form.
   ------------------------------------------------------------------------- */

const text = (form: FormData, key: string) =>
  (form.get(key) ?? "").toString().trim();

/** "a, b, c" → ["a","b","c"] */
const csv = (form: FormData, key: string) =>
  text(form, key)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

/** One item per line. Used for pros, cons and gallery URLs. */
const lines = (form: FormData, key: string) =>
  text(form, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Specs, one per line as "Label | value".
 * Lines without a pipe are kept with an empty value rather than dropped, so a
 * half-filled entry is visible and fixable instead of silently vanishing.
 */
function specs(form: FormData, key: string) {
  return lines(form, key).map((line) => {
    const [label, ...rest] = line.split("|");
    return { label: label.trim(), value: rest.join("|").trim() };
  });
}

function number(form: FormData, key: string, fallback: number): number {
  const raw = text(form, key);
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Lowercase, punctuation stripped, spaces to hyphens.
 * Not exported: a "use server" module may only export async functions.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slug for a pedal.
 *
 * Most names already lead with the brand ("Boss BD-2 Blues Driver"), which is
 * why the seed slugs read `boss-bd-2-blues-driver`. Prefixing the brand again
 * would give `boss-boss-bd-2...`, so it's only added when missing.
 */
function pedalSlug(brand: string, name: string): string {
  const nameSlug = slugify(name);
  const brandSlug = slugify(brand);
  return nameSlug.startsWith(brandSlug) ? nameSlug : `${brandSlug}-${nameSlug}`;
}

/** Appends -2, -3… until nothing in `taken` collides. */
function unique(candidate: string, taken: Set<string>): string {
  if (!taken.has(candidate)) return candidate;
  let n = 2;
  while (taken.has(`${candidate}-${n}`)) n += 1;
  return `${candidate}-${n}`;
}

const fail = (message: string): ActionState => ({ ok: false, message });

/* -------------------------------------------------------------------------
   Auth
   ------------------------------------------------------------------------- */

export async function login(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isAdminConfigured()) {
    return fail(
      "ADMIN_PASSWORD isn't set on this deployment, so the admin is locked. Add it in the Vercel project settings and redeploy.",
    );
  }

  const password = text(form, "password");
  if (!password) return fail("Enter the password.");
  if (!passwordMatches(password)) return fail("That password isn't right.");

  const token = sessionToken();
  if (!token) return fail("Admin isn't configured.");

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  revalidatePath("/admin");
  return { ok: true, message: "Signed in." };
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  revalidatePath("/admin");
}

/* -------------------------------------------------------------------------
   Writes
   ------------------------------------------------------------------------- */

/**
 * Creates an original or an alternative from the admin form.
 *
 * Generates the id and slug rather than asking for them - they have to be
 * unique and URL-safe, which is a rule to enforce, not a question to ask. An
 * alternative carries `original_id`, which is what links the two together.
 */
export async function createPedal(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!(await isAuthed())) return fail("Session expired - sign in again.");

  const supabase = getAdminSupabase();
  if (!supabase) {
    return fail(
      "SUPABASE_SERVICE_ROLE_KEY isn't set on this deployment, so nothing can be written.",
    );
  }

  const kind = text(form, "kind");
  if (kind !== "original" && kind !== "alternative") {
    return fail("Pick whether this is an original or an alternative.");
  }

  const name = text(form, "name");
  const brand = text(form, "brand");
  const blurb = text(form, "blurb");

  if (!name) return fail("Name is required.");
  if (!brand) return fail("Brand is required.");
  if (!blurb) return fail("Blurb is required - it's the line on every card.");

  const price = number(form, "price_gbp", -1);
  if (price < 0) return fail("Price must be a number, 0 or more.");

  const popularity = Math.min(100, Math.max(0, number(form, "popularity", 50)));

  // Existing ids and slugs, so generated ones can't collide.
  const [originalsResult, alternativesResult] = await Promise.all([
    supabase.from("originals").select("id, slug"),
    supabase.from("alternatives").select("id, slug"),
  ]);

  if (originalsResult.error || alternativesResult.error) {
    return fail(
      `Couldn't read the catalogue: ${(originalsResult.error ?? alternativesResult.error)?.message}`,
    );
  }

  const rows = [...(originalsResult.data ?? []), ...(alternativesResult.data ?? [])];
  const takenIds = new Set(rows.map((row) => row.id as string));
  const takenSlugs = new Set(rows.map((row) => row.slug as string));

  const slug = unique(pedalSlug(brand, name), takenSlugs);
  const id = unique(`${kind === "original" ? "org" : "alt"}-${slug}`, takenIds);

  const imageUrl = text(form, "image_url") || null;

  if (kind === "original") {
    const category = text(form, "category") as Category;
    if (!CATEGORIES.includes(category)) return fail("Pick a category.");

    const { error } = await supabase.from("originals").insert({
      id,
      slug,
      name,
      brand,
      category,
      price_gbp: price,
      blurb,
      description: text(form, "description"),
      image_url: imageUrl,
      image_credit: text(form, "image_credit") || null,
      tags: csv(form, "tags"),
      artists: csv(form, "artists"),
      aliases: csv(form, "aliases"),
      popularity,
      search_query: text(form, "search_query") || null,
      specs: specs(form, "specs"),
    });

    if (error) return fail(`Supabase refused it: ${error.message}`);

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Added “${name}” as an original.`,
      href: `/pedal/${slug}`,
    };
  }

  const originalId = text(form, "original_id");
  if (!originalId) {
    return fail("Choose which original this is a clone of.");
  }

  const { error } = await supabase.from("alternatives").insert({
    id,
    slug,
    original_id: originalId,
    name,
    brand,
    price_gbp: price,
    blurb,
    image_url: imageUrl,
    image_credit: text(form, "image_credit") || null,
    pros: lines(form, "pros"),
    cons: lines(form, "cons"),
    aliases: csv(form, "aliases"),
    artists: csv(form, "artists"),
    popularity,
    match_quality: Math.min(100, Math.max(0, number(form, "match_quality", 50))),
    search_query: text(form, "search_query") || null,
    verdict: text(form, "verdict") || null,
    gallery: lines(form, "gallery"),
    specs: specs(form, "specs"),
  });

  if (error) return fail(`Supabase refused it: ${error.message}`);

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Added “${name}” as an alternative.`,
    href: `/clone/${slug}`,
  };
}

/* -------------------------------------------------------------------------
   Edit and delete
   ------------------------------------------------------------------------- */

/**
 * Updates an existing pedal.
 *
 * The id and slug are deliberately not editable: the slug is the page's URL
 * and the id is what every alternative points at, so changing either from a
 * form would silently break links and orphan clones. Everything else is fair
 * game.
 */
export async function updatePedal(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!(await isAuthed())) return fail("Session expired - sign in again.");

  const supabase = getAdminSupabase();
  if (!supabase) return fail("SUPABASE_SERVICE_ROLE_KEY isn't set, so nothing can be saved.");

  const kind = text(form, "kind");
  const id = text(form, "id");
  const slug = text(form, "slug");
  if (!id || !slug) return fail("Missing the record to update.");
  if (kind !== "original" && kind !== "alternative") return fail("Unknown record type.");

  const name = text(form, "name");
  const brand = text(form, "brand");
  const blurb = text(form, "blurb");
  if (!name) return fail("Name is required.");
  if (!brand) return fail("Brand is required.");
  if (!blurb) return fail("Blurb is required.");

  const price = number(form, "price_gbp", -1);
  if (price < 0) return fail("Price must be a number, 0 or more.");

  const popularity = Math.min(100, Math.max(0, number(form, "popularity", 50)));
  const imageUrl = text(form, "image_url") || null;

  if (kind === "original") {
    const category = text(form, "category") as Category;
    if (!CATEGORIES.includes(category)) return fail("Pick a category.");

    const { error } = await supabase
      .from("originals")
      .update({
        name,
        brand,
        category,
        price_gbp: price,
        blurb,
        description: text(form, "description"),
        image_url: imageUrl,
        image_credit: text(form, "image_credit") || null,
        tags: csv(form, "tags"),
        artists: csv(form, "artists"),
        aliases: csv(form, "aliases"),
        popularity,
        search_query: text(form, "search_query") || null,
        specs: specs(form, "specs"),
      })
      .eq("id", id);

    if (error) return fail(`Supabase refused it: ${error.message}`);

    revalidatePath("/", "layout");
    return { ok: true, message: `Saved “${name}”.`, href: `/pedal/${slug}` };
  }

  const originalId = text(form, "original_id");
  if (!originalId) return fail("Choose which original this is a clone of.");

  const { error } = await supabase
    .from("alternatives")
    .update({
      original_id: originalId,
      name,
      brand,
      price_gbp: price,
      blurb,
      image_url: imageUrl,
      image_credit: text(form, "image_credit") || null,
      pros: lines(form, "pros"),
      cons: lines(form, "cons"),
      aliases: csv(form, "aliases"),
      artists: csv(form, "artists"),
      popularity,
      match_quality: Math.min(100, Math.max(0, number(form, "match_quality", 50))),
      search_query: text(form, "search_query") || null,
      verdict: text(form, "verdict") || null,
      gallery: lines(form, "gallery"),
      specs: specs(form, "specs"),
    })
    .eq("id", id);

  if (error) return fail(`Supabase refused it: ${error.message}`);

  revalidatePath("/", "layout");
  return { ok: true, message: `Saved “${name}”.`, href: `/clone/${slug}` };
}

/**
 * Deletes a pedal.
 *
 * Deleting an original takes its alternatives with it - the foreign key is
 * ON DELETE CASCADE - so the count is reported back rather than left as a
 * surprise. There is no undo, which is why the button asks first.
 */
export async function deletePedal(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!(await isAuthed())) return fail("Session expired - sign in again.");

  const supabase = getAdminSupabase();
  if (!supabase) return fail("SUPABASE_SERVICE_ROLE_KEY isn't set, so nothing can be deleted.");

  const kind = text(form, "kind");
  const id = text(form, "id");
  if (!id) return fail("Missing the record to delete.");
  if (kind !== "original" && kind !== "alternative") return fail("Unknown record type.");

  const table = kind === "original" ? "originals" : "alternatives";

  let alsoRemoved = 0;
  if (kind === "original") {
    const { count } = await supabase
      .from("alternatives")
      .select("id", { count: "exact", head: true })
      .eq("original_id", id);
    alsoRemoved = count ?? 0;
  }

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return fail(`Supabase refused it: ${error.message}`);

  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      alsoRemoved > 0
        ? `Deleted, along with ${alsoRemoved} linked ${alsoRemoved === 1 ? "alternative" : "alternatives"}.`
        : "Deleted.",
    href: "/",
  };
}
