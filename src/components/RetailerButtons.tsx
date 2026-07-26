import { SpinButton } from "./SpinButton";
import { buildRetailerLinks } from "@/lib/affiliates";
import type { RetailerId } from "@/lib/types";

/**
 * Outbound retailer buttons, styled after button.mp4: a white pill with a
 * coloured circular icon badge on the left, and a click that collapses the
 * pill into a spinner before restoring.
 *
 * Stacked vertically, one full-width pill per row. A wrapping horizontal row
 * broke into an uneven 2-then-1 shape at most widths; a column reads as a
 * deliberate list of three places to buy.
 *
 * The badge carries the retailer's colour rather than the pill, which keeps
 * the three buttons a consistent set while still telling them apart. Icons are
 * simple representative glyphs rather than copies of trademarked logos —
 * using a retailer's name in text is ordinary nominative use, but reproducing
 * their logo is trademark use and each of these three gates that behind their
 * own affiliate/brand programme.
 */

const BRANDS: Record<
  RetailerId,
  { accent: string; iconTone: "light" | "dark"; cta: string; icon: React.ReactNode }
> = {
  amazon: {
    accent: "bg-linear-to-br from-amber-300 to-amber-500",
    iconTone: "dark",
    cta: "Buy on",
    icon: <AmazonMark />,
  },
  reverb: {
    accent: "bg-linear-to-br from-orange-500 to-rose-600",
    iconTone: "light",
    cta: "Search",
    icon: <ReverbMark />,
  },
  gear4music: {
    accent: "bg-linear-to-br from-slate-600 to-slate-800",
    iconTone: "light",
    cta: "Shop",
    icon: <Gear4MusicMark />,
  },
};

export function RetailerButtons({
  pedal,
  size = "md",
}: {
  pedal: { name: string; brand: string; searchQuery?: string };
  size?: "sm" | "md" | "lg";
}) {
  const links = buildRetailerLinks(pedal);

  return (
    // Capped: full-width pills stretch to ~880px inside a wide card, which
    // reads as three banners rather than three buttons.
    <div className="flex max-w-sm flex-col gap-3">
      {links.map((link) => {
        const brand = BRANDS[link.id];
        return (
          <SpinButton
            key={link.id}
            as="a"
            href={link.href}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            size={size}
            accent={brand.accent}
            iconTone={brand.iconTone}
            icon={brand.icon}
            className="w-full focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {brand.cta} <span className="font-extrabold">{link.label}</span>
          </SpinButton>
        );
      })}
    </div>
  );
}

function AmazonMark() {
  return (
    <svg viewBox="0 0 24 16" aria-hidden className="h-full w-full">
      <path
        d="M1.5 11.5c3.6 2.6 8 3.6 12.2 2.9 1.9-.3 3.8-1 5.5-2 .4-.3.1-.8-.3-.6-3.9 1.6-8.4 1.9-12.5.8-1.7-.5-3.3-1.2-4.7-2.1-.3-.2-.6.2-.2.5Z"
        fill="currentColor"
      />
      <path
        d="M20.7 10.2c-.3-.4-2-.2-2.7-.1-.2 0-.3-.1-.1-.3.9-.6 2.4-.5 2.6-.2.2.3-.1 1.6-.9 2.3-.1.1-.3 0-.2-.1.2-.5.6-1.4.3-1.6Z"
        fill="currentColor"
      />
      <path
        d="M13.4 3.4V2.6c0-.1.1-.2.2-.2h3.6c.1 0 .2.1.2.2v.7c0 .1-.1.3-.3.5l-1.9 2.6c.7 0 1.4.1 2 .4.1.1.2.2.2.3v.9c0 .1-.1.2-.3.2-1.1-.6-2.5-.6-3.6 0-.1.1-.3 0-.3-.2v-.8c0-.2 0-.4.1-.6l2.2-3.1h-1.9c-.1 0-.2-.1-.2-.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ReverbMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-full w-full">
      <g fill="currentColor">
        <rect x="2" y="10" width="2.4" height="4" rx="1.2" />
        <rect x="6.4" y="7" width="2.4" height="10" rx="1.2" />
        <rect x="10.8" y="4" width="2.4" height="16" rx="1.2" />
        <rect x="15.2" y="7.5" width="2.4" height="9" rx="1.2" />
        <rect x="19.6" y="10.5" width="2.4" height="3" rx="1.2" />
      </g>
    </svg>
  );
}

function Gear4MusicMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-full w-full">
      <path
        d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm0 5.6a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z"
        fill="currentColor"
      />
      <path
        d="M20.4 12c0-.5 0-.9-.1-1.4l1.8-1.3-1.7-2.9-2.1.8c-.7-.6-1.4-1-2.2-1.3L15.8 3.7h-3.4l-.3 2.2c-.8.3-1.6.7-2.2 1.3l-2.1-.8-1.7 2.9L7.9 10.6c-.1.5-.1.9-.1 1.4s0 .9.1 1.4l-1.8 1.3 1.7 2.9 2.1-.8c.7.6 1.4 1 2.2 1.3l.3 2.2h3.4l.3-2.2c.8-.3 1.6-.7 2.2-1.3l2.1.8 1.7-2.9-1.8-1.3c.1-.5.1-.9.1-1.4Z"
        fill="currentColor"
        opacity="0.45"
      />
    </svg>
  );
}
