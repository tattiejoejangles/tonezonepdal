import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Password gate for /admin.
 *
 * Deliberately minimal - this is a private authoring tool for one person, not
 * a user account system. It exists because the admin route writes to Supabase
 * with the service-role key, and an unauthenticated write endpoint on a public
 * domain would let anyone edit the catalogue.
 *
 * The cookie stores a hash of the password, never the password itself, and is
 * httpOnly so page scripts can't read it. Comparisons are constant-time so the
 * gate can't be probed a character at a time.
 *
 * With ADMIN_PASSWORD unset, `isAuthed` always returns false and every write
 * is refused. Failing closed matters: a missing env var on a deploy must not
 * silently open the door.
 */

export const ADMIN_COOKIE = "tz_admin";

function tokenFor(password: string): string {
  return createHash("sha256").update(`thetonezone:${password}`).digest("hex");
}

/** Constant-time compare of two hex strings of equal length. */
function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** The cookie value a correct password produces. */
export function sessionToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password ? tokenFor(password) : null;
}

export function passwordMatches(candidate: string): boolean {
  const expected = sessionToken();
  return expected !== null && sameToken(tokenFor(candidate), expected);
}

export async function isAuthed(): Promise<boolean> {
  const expected = sessionToken();
  if (!expected) return false;

  const jar = await cookies();
  const found = jar.get(ADMIN_COOKIE)?.value;
  return typeof found === "string" && sameToken(found, expected);
}
