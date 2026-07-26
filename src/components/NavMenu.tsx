"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

export interface NavMenuItem {
  href: string;
  label: string;
  blurb?: string;
}

/**
 * A header dropdown — currently "Pedals", listing every genre.
 *
 * Opens three ways, because hover alone strands anyone not using a mouse:
 * pointer hover, click/tap, and the keyboard (Enter, Space or Down on the
 * trigger). Escape closes and returns focus to the trigger.
 *
 * `hoverOpen` and `open` are tracked separately so a menu opened by clicking
 * doesn't vanish the moment the pointer drifts off it.
 *
 * Generic on purpose: adding an "Amps" menu later is another instance with a
 * different item list, not a second component.
 */
export function NavMenu({
  label,
  items,
}: {
  label: string;
  items: NavMenuItem[];
}) {
  const [clickOpen, setClickOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const open = clickOpen || hoverOpen;

  function close() {
    setClickOpen(false);
    setHoverOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setClickOpen(true);
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setClickOpen((value) => !value)}
        className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          className="tz-pop absolute top-full right-0 z-40 mt-3 w-72 bg-white shadow-2xl ring-1 ring-stone-200"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="block border-b border-stone-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-amber-50 focus-visible:bg-amber-50 focus-visible:outline-none"
            >
              <span className="block text-sm font-bold text-stone-900">
                {item.label}
              </span>
              {item.blurb && (
                <span className="tz-body mt-0.5 block text-xs text-stone-500">
                  {item.blurb}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
