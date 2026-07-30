import Link from "next/link";

const PAGES = [
  { href: "/legal/terms", label: "Terms of use" },
  { href: "/legal/privacy", label: "Privacy & cookies" },
  { href: "/legal/affiliates", label: "Affiliate disclosure" },
  { href: "/legal/trademarks", label: "Trademarks & copyright" },
];

/**
 * Shared shell for the legal pages.
 *
 * One narrow measure and one set of type styles across all four, plus a nav so
 * someone who lands on the privacy page from a footer link can find the terms
 * without going back.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tz-page py-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,14rem)_minmax(0,44rem)]">
        <nav aria-label="Legal" className="lg:sticky lg:top-24 lg:self-start">
          <p className="tz-eyebrow mb-3 text-stone-400">Legal</p>
          <ul className="space-y-1">
            {PAGES.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-stone-600 transition-colors hover:bg-amber-50 hover:text-amber-800"
                >
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* `tz-prose` gives these pages readable long-form type without
            pulling in a typography plugin for four documents. */}
        <article className="tz-prose">{children}</article>
      </div>
    </div>
  );
}
