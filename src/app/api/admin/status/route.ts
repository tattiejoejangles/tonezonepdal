import { NextResponse } from "next/server";

import { isAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Whether this browser is signed into admin.
 *
 * Exists so the Edit button can appear on pedal pages without those pages
 * having to read cookies. Reading a cookie during render would opt all ~120
 * pedal and clone pages out of static generation, which is a steep price for a
 * button only one person ever sees.
 *
 * Leaks nothing: it reports a boolean, and the session cookie stays httpOnly.
 */
export async function GET() {
  return NextResponse.json(
    { authed: await isAuthed() },
    { headers: { "cache-control": "no-store" } },
  );
}
