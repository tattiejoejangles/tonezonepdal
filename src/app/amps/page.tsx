import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * Amps live in the same catalogue as pedals and render through the same genre
 * page, so this is a redirect rather than a duplicate implementation. It
 * exists because /amps is the address people will guess, and it gives the
 * section a home of its own if amps ever outgrow being one category.
 */
export const metadata: Metadata = {
  title: "Amps",
  description: "Expensive amps and the budget alternatives that get close.",
};

export default function AmpsPage() {
  redirect("/pedals/amps");
}
