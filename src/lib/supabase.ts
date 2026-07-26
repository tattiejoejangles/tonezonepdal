import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only Supabase client for the public catalogue.
 *
 * The publishable key is safe in the browser — Row Level Security allows
 * SELECT and nothing else, so the worst anyone can do with it is read data
 * that's already on the page. Writes need the service role key, which only
 * scripts/push-to-supabase.mjs and the dashboard ever use.
 *
 * Returns null when the env vars are missing so the app can fall back to its
 * bundled copy of the catalogue instead of crashing.
 */
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  client =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false },
          global: { headers: { "x-application-name": "thetonezone" } },
        })
      : null;

  return client;
}
