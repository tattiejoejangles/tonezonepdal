import { redirect } from "next/navigation";

/**
 * /legal has a layout but nothing of its own to show.
 *
 * It exists because Next's typed routes require an index page for a segment
 * that has a layout, and because /legal is a URL people type. The terms are the
 * document the other three refer back to, so that's where it lands.
 */
export default function LegalIndexPage() {
  redirect("/legal/terms");
}
