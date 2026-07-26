# Search suggestions, clickable clone cards, cheapest-alternative popup

Date: 2026-07-26

Three additive changes. Nothing existing is removed or repurposed — every
control on the site keeps the behaviour it has today.

## 1. Live search suggestions

Typing into either search box drops a panel of matching pedals below it, each
row showing a photo, name and price.

**Hard rule:** the panel is hidden while the input is empty. Focusing or
clicking the box shows nothing. Suggestions appear from the first character
typed and disappear again if the box is cleared. This is what keeps the
bundled index (below) worth its weight — the data is inert until someone
actually searches.

### Matching

`src/lib/filter.ts` already scores both halves of the catalogue:

- `scoreEntry` ranks originals on name, brand, tags and their clones' names.
- `filterAlternatives` ranks clones on name, brand and aliases.

Typing `behr` already scores Behringer clones correctly through the second of
these. Rather than write a third set of matching rules to keep in sync, a new
pure function calls both and merges:

```ts
export interface Suggestion {
  kind: "original" | "clone";
  href: string;            // /pedal/[slug] or /clone/[slug]
  name: string;
  brand: string;
  priceGBP: number;
  imageUrl: string | null;
  originalName?: string;   // clones only — "alternative to Tube Screamer"
  relevance: number;
}

export function searchSuggestions(
  index: SearchIndex,
  query: string,
  limit?: number,          // default 8
): Suggestion[];
```

Results from both halves are interleaved by relevance and capped at 8, so one
prolific brand cannot crowd out a better-matching original.

### The dropdown

One component, `SearchSuggestions.tsx`, used by both search boxes.

- Each row: square thumbnail (`PedalImage`), brand eyebrow, name, price on the
  right, and a small `Clone` / `Original` tag so it is obvious at a glance
  which kind of pedal it is.
- Clicking a row navigates to that pedal's own page — `/clone/[slug]` for a
  clone, `/pedal/[slug]` for an original.
- Keyboard: down/up move the highlight, Enter opens the highlighted row,
  Escape closes the panel without clearing the query.
- Accessibility: `role="listbox"` on the panel, `role="option"` on rows,
  `aria-activedescendant` on the input.
- Closes on outside click and on blur.

The hero box keeps live-filtering the grid below it as you type. The dropdown
sits on top of that; Escape dismisses the dropdown and leaves the filtered
grid alone.

## 2. Getting the pedal list to the header search

`HeaderSearch` lives in the root layout, so it is present on every page and
currently has no catalogue data at all.

**Decision: bundle a compact index into the page.** `layout.tsx` becomes async,
builds the index server-side and passes it to `HeaderSearch` as a prop.

`src/lib/search-index.ts` defines a client-safe shape carrying only the six
fields a suggestion row renders. Everything heavy — `description`, `pros`,
`cons`, `controls`, `artists`, `gallery`, `verdict` — is dropped.

Measured on `/clone/daphon-e20od`: 29KB raw, **6KB gzipped**, against a 20.6KB
gzipped page. Higher than the 4KB estimated when this was chosen, because
product image URLs are long and unique — they don't compress the way the
repeated brand names do. Still under the weight of one thumbnail, and the
suggestions are instant, so the decision stands.

If it ever needs trimming, dropping `cloneNames` / `cloneBrands` from originals
is the cheapest cut. The cost is that searching a clone brand would stop
surfacing the expensive pedal it copies — the clones themselves would still
appear, which is what that query is really asking for.

Rejected alternative: a `/api/search` route handler. It keeps the index off the
client, but costs a round trip per keystroke and adds an endpoint whose ranking
would have to be kept in step with `filter.ts`. Not worth it at this catalogue
size.

`getCatalogue` gets wrapped in React's `cache()`. The layout and the page would
otherwise each hit Supabase on the same request — and `getOriginalBySlug`
already calls it a second time today, so this is a fix regardless.

This does **not** reintroduce the problem documented in the comment at the top
of `HeaderSearch.tsx`. That comment warns against reading `?q=` with
`useSearchParams`, which would opt every statically rendered page into
client-side rendering. The index arrives as a prop instead, and submitting
still pushes `?q=` exactly as it does now.

## 3. Clone cards on a pedal page open that clone's page

The cards under "Cheaper alternatives" on `/pedal/[slug]` become clickable.

`AlternativeCard` contains retailer `<a>` tags and the **More info** `<button>`.
Wrapping the card in a `<Link>` would be invalid HTML and would swallow those
clicks. Instead, a stretched-link overlay: an absolutely positioned `<Link>`
covering the card at `z-0`, with the retailer row and the More info button
raised to `z-10`. The heading takes a hover colour so the card reads as
clickable.

Resulting behaviour:

| Click target | Result |
| --- | --- |
| Anywhere on the card | `/clone/[slug]` |
| **More info** | Popup opens — unchanged |
| A retailer button | The retailer — unchanged |

The **More info** button stays exactly where it is. This was the explicit
requirement: add the navigation, do not replace the popup.

## 4. Cheapest-alternative box gets a photo and a popup

The emerald "Cheapest alternative: X" panel on `/pedal/[slug]` moves into a new
client component, `CheapestAlternative.tsx`.

- The existing text and `SavingsBadge` are kept as they are.
- A thumbnail of the clone is added on the left.
- The panel becomes a button that opens the **same** `PedalModal` the More info
  buttons use — same gallery, same Overview / Controls / Artists tabs.

The pedal page already computes `cheapest`; it passes that plus
`getDetail(cheapest, artists)` into the component.

## 5. `PedalModal` gains an optional `href`

One new optional prop. When set, a **Go to pedal** button renders in the modal
footer alongside the retailer buttons.

Both `AlternativesPanel` and `CheapestAlternative` pass `/clone/[slug]`, so
every popup on the site gets the button. This is consistent with change 3,
which makes the cards themselves navigate to the same place.

## Files

| File | Change |
| --- | --- |
| `src/lib/search-index.ts` | new — client-safe index type and builder |
| `src/lib/filter.ts` | add `Suggestion`, `searchSuggestions` |
| `src/components/SearchSuggestions.tsx` | new — the dropdown |
| `src/components/SearchBar.tsx` | wire in the dropdown |
| `src/components/HeaderSearch.tsx` | wire in the dropdown, accept index prop |
| `src/app/layout.tsx` | async; build and pass the index |
| `src/data/catalogue.ts` | `cache()` around `getCatalogue`; index builder |
| `src/components/AlternativeCard.tsx` | stretched-link overlay |
| `src/components/CheapestAlternative.tsx` | new |
| `src/app/pedal/[slug]/page.tsx` | use `CheapestAlternative` |
| `src/components/PedalModal.tsx` | optional `href` → "Go to pedal" |

## Verification

The project has no test framework, and this change does not justify
introducing one. Verification is:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Driving the running app in the browser: empty box shows no panel; typing
  `behr` lists Behringer clones with photo, name and price; clicking a row
  lands on that pedal's page; a clone card navigates while More info still
  opens the popup; the cheapest-alternative box opens the popup and its
  **Go to pedal** button works.
