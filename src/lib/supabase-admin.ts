import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client - full read/write, bypasses Row Level Security.
 *
 * NEVER import this from a client component. It reads
 * SUPABASE_SERVICE_ROLE_KEY, which has no `NEXT_PUBLIC_` prefix precisely so
 * that Next refuses to bundle it for the browser; the only callers are the
 * server actions in src/app/admin/actions.ts.
 *
 * Returns null when the key is absent so the admin page can say "not
 * configured" rather than throwing at import time.
 */
export function getAdminSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "thetonezone-admin" } },
  });
}
