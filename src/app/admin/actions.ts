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
import { isRelationship } from "@/lib/relationship";
import { SPEC_FIELDS } from "@/lib/specs";
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
 * Specs, read from one input per vocabulary field.
 *
 * Was a textarea of "Label | value" lines, which is how the catalogue ended up
 * with around sixty labels for what is really a dozen facts - "Current Draw"
 * beside "Current draw", dimensions split three ways, and values typed into the
 * label. The form now offers the fields themselves, named `spec_<id>`, so the
 * vocabulary is enforced at the point of entry rather than repaired afterwards.
 *
 * Blanks are dropped: an empty field means "not confirmed", and the site says so
 * rather than printing an empty row. Order follows SPEC_FIELDS, so every item
 * is stored in the same sequence it is displayed in.
 */
function specs(form: FormData, key: string) {
  return SPEC_FIELDS.map((field) => ({
    label: field.label,
    value: text(form, `${key}_${field.id}`),
  })).filter((spec) => spec.value.length > 0);
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
  if (!passwordMatches(password)) {
    // The hint is here because the two ways this fails on a deploy but not
    // locally are both invisible from the browser: a stray newline pasted onto
    // the end of the value, and a value that was changed without redeploying
    // (Vercel bakes environment variables in at build time).
    return fail(
      "That password isn't right. If it works locally but not here, check ADMIN_PASSWORD in the Vercel project settings for a stray space or newline, and redeploy after changing it.",
    );
  }

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

  await savePairings(supabase, id, originalId, form);

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Added “${name}” as an alternative.`,
    href: `/clone/${slug}`,
  };
}

/**
 * Writes which originals a clone is an alternative to.
 *
 * The primary always gets position 0 and is written whether or not it was
 * ticked - it is chosen by the select above, not the checkboxes, and a clone
 * with no primary pairing would vanish from the page it belongs to.
 *
 * Replaces the whole set rather than diffing it: the form submits the complete
 * list every time, so anything absent was deliberately unticked. Deleting
 * first and inserting second is safe here because a failed insert leaves the
 * clone reachable through its `original_id` column, which the catalogue falls
 * back to.
 *
 * Failures are logged and swallowed. The pedal itself has already saved by the
 * time this runs, and reporting "couldn't save" for a pairing would suggest the
 * whole edit was lost.
 */
async function savePairings(
  supabase: NonNullable<ReturnType<typeof getAdminSupabase>>,
  alternativeId: string,
  primaryId: string,
  form: FormData,
) {
  const also = form
    .getAll("also_original_ids")
    .map((value) => String(value))
    .filter((value) => value && value !== primaryId);

  // Only the primary carries the relationship: the form asks the question once,
  // about the pedal this one leads with. Extra pairings default to the safest
  // reading and are corrected in Supabase if they need to differ.
  const chosen = text(form, "relationship");
  const relationship = isRelationship(chosen) ? chosen : "alternative";

  const rows = [
    { alternative_id: alternativeId, original_id: primaryId, position: 0, relationship },
    ...[...new Set(also)].map((originalId, index) => ({
      alternative_id: alternativeId,
      original_id: originalId,
      position: index + 1,
    })),
  ];

  const { error: clearError } = await supabase
    .from("alternative_originals")
    .delete()
    .eq("alternative_id", alternativeId);

  if (clearError) {
    console.error("[pairings] couldn't clear:", clearError.message);
    return;
  }

  const { error } = await supabase.from("alternative_originals").insert(rows);
  if (error) console.error("[pairings] couldn't save:", error.message);
}

/* -------------------------------------------------------------------------
   Suggestions
   ------------------------------------------------------------------------- */

/**
 * Approve or reject a user suggestion.
 *
 * Approving marks the suggestion reviewed. It does NOT write to the catalogue:
 * a suggestion is prose plus an optional payload, and turning "the price is
 * about twenty quid too high" into a column update is a judgement call, not a
 * transformation. Approving means "yes, I'll do this" - you then make the edit
 * with the normal edit form, which already has validation and an audit trail
 * in the shape of the page itself.
 */
export async function reviewSuggestion(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!(await isAuthed())) return fail("Session expired - sign in again.");

  const supabase = getAdminSupabase();
  if (!supabase) {
    return fail("SUPABASE_SERVICE_ROLE_KEY isn't set, so nothing can be saved.");
  }

  const id = text(form, "id");
  const decision = text(form, "decision");
  if (!id) return fail("Missing the suggestion.");
  if (decision !== "approved" && decision !== "rejected" && decision !== "pending") {
    return fail("Unknown decision.");
  }

  const { error } = await supabase
    .from("suggestions")
    .update({
      status: decision,
      reviewed_at: decision === "pending" ? null : new Date().toISOString(),
      review_note: text(form, "review_note") || null,
    })
    .eq("id", id);

  if (error) return fail(`Supabase refused it: ${error.message}`);

  revalidatePath("/admin/suggestions");
  return {
    ok: true,
    message:
      decision === "approved"
        ? "Approved. Make the edit on the entry's own page."
        : decision === "rejected"
          ? "Rejected."
          : "Moved back to pending.",
  };
}

/**
 * Approve, reject or re-queue one community review.
 *
 * Unlike `reviewSuggestion`, approving here DOES change the site: the public
 * `clone_review_summary` view counts approved rows only, so this is the switch
 * that puts a review's stars into the average and its answers into the tonal
 * match percentage. Hence the two revalidations - the review queue, and the
 * layout, because listing cards and the compare table carry the same adjusted
 * number as the clone's own page.
 *
 * Rejecting leaves the row in place rather than deleting it. It still occupies
 * that browser's one-review-per-clone slot, which is what stops a rejected
 * review being resubmitted unchanged.
 */
export async function reviewCloneReview(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!(await isAuthed())) return fail("Session expired - sign in again.");

  const supabase = getAdminSupabase();
  if (!supabase) {
    return fail("SUPABASE_SERVICE_ROLE_KEY isn't set, so nothing can be saved.");
  }

  const id = text(form, "id");
  const decision = text(form, "decision");
  if (!id) return fail("Missing the review.");
  if (decision !== "approved" && decision !== "rejected" && decision !== "pending") {
    return fail("Unknown decision.");
  }

  const { error } = await supabase
    .from("clone_reviews")
    .update({
      status: decision,
      reviewed_at: decision === "pending" ? null : new Date().toISOString(),
      review_note: text(form, "review_note") || null,
    })
    .eq("id", id);

  if (error) return fail(`Supabase refused it: ${error.message}`);

  revalidatePath("/admin/reviews");
  // Every surface that shows a tonal match reads the approved aggregate.
  revalidatePath("/", "layout");

  return {
    ok: true,
    message:
      decision === "approved"
        ? "Approved - it's live and counts towards the match."
        : decision === "rejected"
          ? "Rejected. It stays hidden."
          : "Moved back to pending.",
  };
}

/**
 * Hide a comment but keep the scores.
 *
 * The middle option between approving and rejecting, and the one most often
 * wanted: the ratings are honest and useful, and the prose is not - abuse, a
 * link, someone's phone number. Blanking `comment` and approving keeps the
 * numbers in the average with nothing to read.
 */
export async function approveReviewScoresOnly(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!(await isAuthed())) return fail("Session expired - sign in again.");

  const supabase = getAdminSupabase();
  if (!supabase) {
    return fail("SUPABASE_SERVICE_ROLE_KEY isn't set, so nothing can be saved.");
  }

  const id = text(form, "id");
  if (!id) return fail("Missing the review.");

  const { error } = await supabase
    .from("clone_reviews")
    .update({
      comment: null,
      status: "approved",
      reviewed_at: new Date().toISOString(),
      review_note: text(form, "review_note") || "comment removed in moderation",
    })
    .eq("id", id);

  if (error) return fail(`Supabase refused it: ${error.message}`);

  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");

  return { ok: true, message: "Scores approved, comment dropped." };
}

/* -------------------------------------------------------------------------
   Artists
   ------------------------------------------------------------------------- */

/**
 * Saves one artist's photo and details.
 *
 * `match_key` is the primary key and is never editable here: it is what every
 * pedal's artist list joins against, so changing it would silently orphan the
 * photo from the pedals that reference the name. Retitling a display name is
 * fine; re-keying is a migration.
 *
 * An UPSERT rather than an update, because this is now reachable from a pedal
 * page as well as from /admin/artists. Pedals store artists as free text and
 * the artists table was seeded from the names present at the time, so a name
 * added to a pedal since then has no row - and an `update` against a missing
 * row succeeds while changing nothing, which looks exactly like a save that
 * worked and then lost the photo.
 *
 * `aliases` is only written when the form actually carried the field. The
 * inline editor on a pedal page does not show it, and defaulting a missing
 * field to `[]` would wipe aliases set on the full admin screen.
 */
export async function updateArtist(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!(await isAuthed())) return fail("Session expired - sign in again.");

  const supabase = getAdminSupabase();
  if (!supabase) {
    return fail("SUPABASE_SERVICE_ROLE_KEY isn't set, so nothing can be saved.");
  }

  const matchKey = text(form, "match_key");
  if (!matchKey) return fail("Missing the artist.");

  const name = text(form, "name");
  if (!name) return fail("Name is required.");

  const imageUrl = text(form, "image_url");
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) {
    // https only: an http image on an https page is blocked as mixed content
    // and would silently show nothing.
    return fail("The photo URL must start with https://");
  }

  const row: Record<string, unknown> = {
    match_key: matchKey,
    name,
    image_url: imageUrl || null,
    image_credit: text(form, "image_credit") || null,
    known_for: text(form, "known_for") || null,
  };

  if (form.has("aliases")) {
    // Normalised here as well as in the app, so an alias typed with capitals
    // still matches at read time.
    row.aliases = csv(form, "aliases").map((alias) =>
      alias
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }

  const { error } = await supabase
    .from("artists")
    .upsert(row, { onConflict: "match_key" });

  if (error) return fail(`Supabase refused it: ${error.message}`);

  revalidatePath("/admin/artists");
  // Artist photos appear on every pedal and clone page that names them, and
  // those are statically generated - without this the new picture waits for the
  // revalidate window. This is what makes one edit land across the whole site.
  revalidatePath("/", "layout");

  return { ok: true, message: `Saved ${name}.` };
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

  await savePairings(supabase, id, originalId, form);

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
