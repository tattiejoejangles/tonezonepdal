"use server";

import { getSupabase } from "@/lib/supabase";
import {
  isSuggestionKind,
  SUGGESTION_FIELDS,
  type SuggestionKind,
} from "@/lib/suggestions";

export interface SuggestState {
  ok: boolean;
  message: string;
}

const text = (form: FormData, key: string) =>
  (form.get(key) ?? "").toString().trim();

/**
 * Accepts a public suggestion.
 *
 * Uses the ANON client deliberately, not the service role. The suggestions
 * table's RLS policy allows insert and nothing else, so this endpoint can only
 * ever add a pending row - it cannot read other people's submissions or touch
 * the catalogue, which is the right blast radius for something anyone on the
 * internet can call.
 *
 * Nothing here writes to `originals` or `alternatives`. Approving is a
 * separate, authenticated action in /admin.
 */
export async function submitSuggestion(
  _previous: SuggestState,
  form: FormData,
): Promise<SuggestState> {
  const kind = text(form, "kind");
  if (!isSuggestionKind(kind)) {
    return { ok: false, message: "Pick what kind of change this is." };
  }

  const field = text(form, "field");
  if (!SUGGESTION_FIELDS.some((option) => option.id === field)) {
    return { ok: false, message: "Pick what it's about." };
  }

  const body = text(form, "body");
  if (body.length < 10) {
    return {
      ok: false,
      message: "Give us a bit more detail - at least a sentence.",
    };
  }
  if (body.length > 4000) {
    return { ok: false, message: "That's too long - keep it under 4000 characters." };
  }

  // Honeypot. A field hidden from people and irresistible to naive bots; if
  // it has content, accept the request and drop it on the floor rather than
  // returning an error the bot could learn from.
  if (text(form, "website") !== "") {
    return { ok: true, message: "Thanks - we'll take a look." };
  }

  const contact = text(form, "contact");
  if (contact.length > 200) {
    return { ok: false, message: "That contact detail is too long." };
  }

  const targetKindRaw = text(form, "target_kind");
  const targetKind =
    targetKindRaw === "original" || targetKindRaw === "alternative"
      ? targetKindRaw
      : null;
  const targetSlug = text(form, "target_slug") || null;

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "Suggestions aren't switched on yet. Try again later.",
    };
  }

  const { error } = await supabase.from("suggestions").insert({
    kind: kind satisfies SuggestionKind,
    target_kind: targetKind,
    target_slug: targetSlug,
    field,
    body,
    contact: contact || null,
  });

  if (error) {
    console.error("[suggestions] insert failed:", error.message);
    return { ok: false, message: "Couldn't save that just now. Try again shortly." };
  }

  return {
    ok: true,
    message: "Thanks - that's in the queue. Nothing changes on the site until it's reviewed.",
  };
}
