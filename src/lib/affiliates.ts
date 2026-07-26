import type { RetailerId } from "./types";

/**
 * Affiliate configuration, driven entirely by environment variables.
 *
 * Set your codes in `.env.local` (see `.env.example`). Every outbound link on
 * the site is generated here, so there is exactly one place to change.
 *
 * Next.js inlines NEXT_PUBLIC_* at build time, so these must be referenced as
 * full literal `process.env.NEXT_PUBLIC_X` expressions — destructuring or
 * dynamic keys would not be replaced and would read as undefined in the browser.
 */
const ENV = {
  amazon: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? "",
  reverb: process.env.NEXT_PUBLIC_REVERB_AFFILIATE_ID ?? "",
  gear4music: process.env.NEXT_PUBLIC_GEAR4MUSIC_AFFILIATE_ID ?? "",
  awinPublisher: process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID ?? "",
  awinGear4musicMerchant: process.env.NEXT_PUBLIC_AWIN_GEAR4MUSIC_MERCHANT_ID ?? "",
};

interface RetailerConfig {
  label: string;
  searchBase: string;
  queryParam: string;
  tagParam: string;
  tag: string;
}

const RETAILERS: Record<RetailerId, RetailerConfig> = {
  amazon: {
    label: "Amazon",
    searchBase: "https://www.amazon.co.uk/s",
    queryParam: "k",
    tagParam: "tag",
    tag: ENV.amazon,
  },
  reverb: {
    label: "Reverb",
    searchBase: "https://reverb.com/marketplace",
    queryParam: "query",
    tagParam: "aid",
    tag: ENV.reverb,
  },
  gear4music: {
    label: "Gear4music",
    searchBase: "https://www.gear4music.com/search",
    queryParam: "q",
    tagParam: "affid",
    tag: ENV.gear4music,
  },
};

export const RETAILER_ORDER: RetailerId[] = ["amazon", "reverb", "gear4music"];

export interface RetailerLink {
  id: RetailerId;
  label: string;
  href: string;
  /** True when a real affiliate code is attached to this link. */
  tracked: boolean;
}

/**
 * Gear4music's programme runs through Awin, which tracks via a redirect URL
 * rather than a query parameter. When Awin IDs are configured we wrap the
 * destination; otherwise we link direct and untracked.
 */
function wrapAwin(destination: string): string | null {
  const { awinPublisher, awinGear4musicMerchant } = ENV;
  if (!awinPublisher || !awinGear4musicMerchant) return null;

  return (
    `https://www.awin1.com/cread.php?awinmid=${encodeURIComponent(awinGear4musicMerchant)}` +
    `&awinaffid=${encodeURIComponent(awinPublisher)}` +
    `&ued=${encodeURIComponent(destination)}`
  );
}

export function buildRetailerLink(retailer: RetailerId, query: string): RetailerLink {
  const config = RETAILERS[retailer];

  const url = new URL(config.searchBase);
  url.searchParams.set(config.queryParam, query);

  let href = url.toString();
  let tracked = false;

  if (retailer === "gear4music") {
    const awin = wrapAwin(href);
    if (awin) {
      href = awin;
      tracked = true;
    } else if (config.tag) {
      url.searchParams.set(config.tagParam, config.tag);
      href = url.toString();
      tracked = true;
    }
  } else if (config.tag) {
    url.searchParams.set(config.tagParam, config.tag);
    href = url.toString();
    tracked = true;
  }

  return { id: retailer, label: config.label, href, tracked };
}

export function buildRetailerLinks(pedal: {
  name: string;
  brand: string;
  searchQuery?: string;
}): RetailerLink[] {
  const query = pedal.searchQuery ?? `${pedal.brand} ${pedal.name}`;
  return RETAILER_ORDER.map((retailer) => buildRetailerLink(retailer, query));
}
