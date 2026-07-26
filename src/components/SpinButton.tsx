"use client";

import { useCallback, useRef, useState } from "react";

/**
 * The button from button.mp4.
 *
 * Rest: a white pill with a soft drop shadow, a coloured circular badge on the
 * left holding an icon, and a bold dark label.
 *
 * On click: the pill collapses horizontally into a circle while the label and
 * badge fade out, a ring spinner rotates in the middle, then it expands back.
 *
 * Width can't be transitioned from `auto`, so the element's current width is
 * pinned in pixels first, then animated down to its own height (making it a
 * perfect circle) and back.
 */

const COLLAPSE_MS = 420;
const SPIN_MS = 1100;

interface CommonProps {
  icon: React.ReactNode;
  /** Tailwind background class for the circular badge, e.g. "bg-amber-400". */
  accent: string;
  /** Colour of the glyph inside the badge. */
  iconTone?: "light" | "dark";
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

type LinkProps = CommonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a"; href: string };
type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

const SIZES = {
  sm: { pill: "h-11 pr-5 pl-1.5 text-sm", badge: "h-8 w-8", gap: "gap-2.5" },
  md: { pill: "h-14 pr-7 pl-2 text-base", badge: "h-10 w-10", gap: "gap-3.5" },
  lg: { pill: "h-16 pr-8 pl-2.5 text-lg", badge: "h-11 w-11", gap: "gap-4" },
};

/** Drives the collapse → spin → restore sequence on a pinned-width element. */
function useSpin() {
  const ref = useRef<HTMLElement | null>(null);
  const [spinning, setSpinning] = useState(false);
  const busy = useRef(false);

  const spin = useCallback(() => {
    const el = ref.current;
    if (!el || busy.current) return;

    busy.current = true;
    const width = el.offsetWidth;
    const height = el.offsetHeight;

    el.style.width = `${width}px`;
    void el.offsetWidth; // Flush the pinned width before animating away from it.

    setSpinning(true);
    el.style.width = `${height}px`;

    window.setTimeout(() => {
      el.style.width = `${width}px`;
      setSpinning(false);
      window.setTimeout(() => {
        el.style.width = "";
        busy.current = false;
      }, COLLAPSE_MS);
    }, SPIN_MS);
  }, []);

  return { ref, spinning, spin };
}

export function SpinButton(props: LinkProps | ButtonProps) {
  const {
    icon,
    accent,
    iconTone = "light",
    children,
    className = "",
    size = "md",
    ...rest
  } = props;

  const { ref, spinning, spin } = useSpin();
  const dims = SIZES[size];

  const shared = {
    "aria-busy": spinning || undefined,
    // min-w-0 matters: as a flex item the default `min-width: auto` floors the
    // element at its content width, which silently blocks the collapse to a
    // circle even though the explicit width is applied.
    className: `tz-pill relative inline-flex min-w-0 shrink-0 items-center justify-start overflow-hidden rounded-full bg-white font-bold text-stone-900 ${dims.pill} ${dims.gap} ${className}`,
  };

  const inner = (
    <>
      <span
        className={`flex shrink-0 items-center justify-center rounded-full transition-[opacity,transform] duration-200 ${dims.badge} ${accent} ${
          iconTone === "dark" ? "text-stone-900" : "text-white"
        } ${spinning ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}
      >
        <span className="h-1/2 w-1/2">{icon}</span>
      </span>

      <span
        className={`whitespace-nowrap transition-[opacity,transform] duration-200 ${
          spinning ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100"
        }`}
      >
        {children}
      </span>

      {/* Ring spinner, centred once the pill has become a circle. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          spinning ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg viewBox="0 0 44 44" className="tz-pill__spinner h-1/2 w-1/2">
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="88 25"
            opacity="0.85"
          />
        </svg>
      </span>
    </>
  );

  if (rest.as === "a") {
    const { onClick, ...anchorProps } = rest as LinkProps;
    delete (anchorProps as { as?: unknown }).as;
    return (
      <a
        {...anchorProps}
        {...shared}
        ref={ref as React.Ref<HTMLAnchorElement>}
        onClick={(event) => {
          spin();
          onClick?.(event);
        }}
      >
        {inner}
      </a>
    );
  }

  const { onClick, type, ...buttonProps } = rest as ButtonProps;
  delete (buttonProps as { as?: unknown }).as;
  return (
    <button
      {...buttonProps}
      {...shared}
      type={type ?? "button"}
      ref={ref as React.Ref<HTMLButtonElement>}
      onClick={(event) => {
        spin();
        onClick?.(event);
      }}
    >
      {inner}
    </button>
  );
}
