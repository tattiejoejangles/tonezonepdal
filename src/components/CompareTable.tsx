import Link from "next/link";

import { MatchBadge } from "./MatchBadge";
import { PedalImage } from "./PedalImage";
import { RetailerButtons } from "./RetailerButtons";
import {
  buildSpecRows,
  headToHead,
  priceVerdict,
  specCoverage,
  type ComparableItem,
  type CompareRow,
  type ScorePoint,
} from "@/lib/compare";
import { formatPrice } from "@/lib/format";
import { matchWasAdjusted } from "@/lib/reviews";

/**
 * Two pieces of gear, line by line.
 *
 * A two-column grid rather than a <table>: the cells hold photos, badges and
 * buy buttons, and the whole thing has to become one column on a phone -
 * neither of which a real table does gracefully. Row labels sit in their own
 * lane on desktop and become inline captions on mobile.
 *
 * Three things carry the comparison, in this order:
 *
 * 1. The scorecard. A long table does not answer "so which one", so the page
 *    leads with the axes on which one genuinely beats the other, biggest first.
 * 2. Winner marks on the rows that have a better and a worse side. Board space,
 *    weight and current draw have a right answer; power voltage and enclosure
 *    material do not, and those stay unmarked rather than being given a tick
 *    for the sake of symmetry.
 * 3. Coverage, stated plainly at the bottom. A blank row means "not published",
 *    not "hasn't got one", and the reader cannot tell those apart unaided.
 *
 * Every fact here is read from the two items' own spec data through
 * `lib/specs.ts`. The comparison holds no data of its own, so filling in a
 * pedal's specs improves its page and every comparison it appears in at once.
 */
export function CompareTable({
  left,
  right,
}: {
  left: ComparableItem;
  right: ComparableItem;
}) {
  const specRows = buildSpecRows(left, right);
  const points = headToHead(left, right);
  const coverage = specCoverage(left, right);
  const cheaper =
    left.priceGBP === right.priceGBP
      ? null
      : left.priceGBP < right.priceGBP
        ? "left"
        : "right";

  return (
    <div className="space-y-6">
      {/* Headline: the two of them, and who is cheaper. */}
      <div className="tz-panel overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
          <ItemHead item={left} cheapest={cheaper === "left"} />
          <ItemHead item={right} cheapest={cheaper === "right"} />
        </div>

        <p className="border-t tz-rule bg-[var(--tz-sunken)] px-5 py-3 text-sm font-bold text-stone-700 sm:px-6">
          {priceVerdict(left, right)}
        </p>
      </div>

      <Scorecard left={left} right={right} points={points} />

      <CompareSection title="The basics">
        <Row label="Price" differs={left.priceGBP !== right.priceGBP}>
          <Cell strong>{formatPrice(left.priceGBP)}</Cell>
          <Cell strong>{formatPrice(right.priceGBP)}</Cell>
        </Row>

        <Row label="Brand" differs={left.brand !== right.brand}>
          <Cell>{left.brand}</Cell>
          <Cell>{right.brand}</Cell>
        </Row>

        <Row label="Type" differs={left.kind !== right.kind}>
          <Cell>{left.kind === "clone" ? "Budget alternative" : "Original"}</Cell>
          <Cell>{right.kind === "clone" ? "Budget alternative" : "Original"}</Cell>
        </Row>

        <Row
          label="Tonal match"
          hint="Our rating, adjusted by approved reviews."
          differs={
            left.matchQuality !== undefined &&
            right.matchQuality !== undefined &&
            left.matchQuality !== right.matchQuality
          }
        >
          <Cell>
            {left.matchQuality !== undefined ? (
              <MatchBadge match={left.matchQuality} size="sm" />
            ) : (
              <Absent>Not a clone</Absent>
            )}
          </Cell>
          <Cell>
            {right.matchQuality !== undefined ? (
              <MatchBadge match={right.matchQuality} size="sm" />
            ) : (
              <Absent>Not a clone</Absent>
            )}
          </Cell>
        </Row>

        <Row
          label="Owner rating"
          hint="Approved reviews only."
          differs={
            (left.reviewSummary?.average ?? null) !==
            (right.reviewSummary?.average ?? null)
          }
        >
          <Cell>
            <Rating item={left} />
          </Cell>
          <Cell>
            <Rating item={right} />
          </Cell>
        </Row>

        <Row label="Copies" differs={left.comparedTo?.slug !== right.comparedTo?.slug}>
          <Cell>
            <Copies item={left} />
          </Cell>
          <Cell>
            <Copies item={right} />
          </Cell>
        </Row>

        <Row label="Cheapest way in" differs={false}>
          <Cell>
            <Cheapest item={left} />
          </Cell>
          <Cell>
            <Cheapest item={right} />
          </Cell>
        </Row>
      </CompareSection>

      {/* The spec sheet: one row per vocabulary field, always the same order. */}
      <CompareSection title="Specs">
        {specRows.length === 0 ? (
          <p className="px-5 py-4 text-sm text-stone-500">
            Neither has confirmed specs yet.
          </p>
        ) : (
          specRows.map((row) => <SpecRow key={row.label} row={row} />)
        )}
      </CompareSection>

      {(left.pros?.length || right.pros?.length) && (
        <CompareSection title="Pros and cons">
          <Row label="Pros" differs={false}>
            <Cell>
              <ProsConsList items={left.pros} sign="+" tone="text-emerald-700" />
            </Cell>
            <Cell>
              <ProsConsList items={right.pros} sign="+" tone="text-emerald-700" />
            </Cell>
          </Row>
          <Row label="Cons" differs={false}>
            <Cell>
              <ProsConsList items={left.cons} sign="−" tone="text-rose-700" />
            </Cell>
            <Cell>
              <ProsConsList items={right.cons} sign="−" tone="text-rose-700" />
            </Cell>
          </Row>
        </CompareSection>
      )}

      <CompareSection title="Context">
        <Row label="In a line" differs={false}>
          <Cell>{left.blurb}</Cell>
          <Cell>{right.blurb}</Cell>
        </Row>

        <Row label="Players" differs={false}>
          <Cell>
            {left.artists.length > 0 ? (
              left.artists.join(" · ")
            ) : (
              <Absent>None recorded</Absent>
            )}
          </Cell>
          <Cell>
            {right.artists.length > 0 ? (
              right.artists.join(" · ")
            ) : (
              <Absent>None recorded</Absent>
            )}
          </Cell>
        </Row>

        {(left.verdict || right.verdict) && (
          <Row label="Our verdict" differs={false}>
            <Cell>{left.verdict ?? <Absent>—</Absent>}</Cell>
            <Cell>{right.verdict ?? <Absent>—</Absent>}</Cell>
          </Row>
        )}
      </CompareSection>

      <CompareSection title="Where to buy">
        <Row label="Retailers" differs={false}>
          <Cell>
            <RetailerButtons pedal={left} size="sm" />
          </Cell>
          <Cell>
            <RetailerButtons pedal={right} size="sm" />
          </Cell>
        </Row>
      </CompareSection>

      {/* The caveat on everything above. */}
      <p className="tz-body px-1 text-xs text-stone-500">
        Specs come from each item&apos;s own page, so a blank row means we
        haven&apos;t confirmed that figure - not that it hasn&apos;t got one. We
        have {coverage.left.filled} of {coverage.left.total} fields for the{" "}
        {left.name} and {coverage.right.filled} for the {right.name}.{" "}
        <Link
          href={`/suggest?kind=${left.kind === "clone" ? "alternative" : "original"}&slug=${left.slug}`}
          className="font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900"
        >
          Know one we&apos;re missing?
        </Link>
      </p>
    </div>
  );
}

/**
 * The verdict, before the table.
 *
 * Two columns of won points rather than one interleaved list, so each side's
 * case reads as a case. A side with nothing says so plainly - "nothing decisive"
 * is a real result and better than an empty column.
 */
function Scorecard({
  left,
  right,
  points,
}: {
  left: ComparableItem;
  right: ComparableItem;
  points: ScorePoint[];
}) {
  if (points.length === 0) {
    return (
      <div className="tz-panel p-5">
        <h3 className="tz-heading text-base text-stone-900">Nothing to split them</h3>
        <p className="tz-body mt-1 text-sm text-stone-500">
          Same price, and neither has published a figure the other one has. Read
          the pros and cons below.
        </p>
      </div>
    );
  }

  const forLeft = points.filter((point) => point.winner === "left");
  const forRight = points.filter((point) => point.winner === "right");

  return (
    <div className="tz-panel overflow-hidden">
      <h3 className="tz-eyebrow border-b tz-rule bg-[var(--tz-sunken)] px-5 py-3 text-stone-500">
        Who wins what
      </h3>
      <div className="grid gap-x-5 md:grid-cols-2 md:divide-x md:divide-stone-100">
        <ScoreColumn name={left.name} points={forLeft} />
        <ScoreColumn name={right.name} points={forRight} />
      </div>
    </div>
  );
}

function ScoreColumn({ name, points }: { name: string; points: ScorePoint[] }) {
  return (
    <div className="p-5">
      <p className="tz-heading text-sm text-stone-900">{name}</p>

      {points.length === 0 ? (
        <p className="tz-body mt-2 text-sm text-stone-400">
          Nothing decisive on the numbers.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {points.map((point) => (
            <li key={point.label} className="flex gap-2.5">
              <span
                aria-hidden
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                  point.headline
                    ? "bg-emerald-600"
                    : "bg-stone-400"
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 text-sm">
                <span className="font-bold text-stone-900">{point.label}</span>
                <span className="text-stone-500"> · {point.detail}</span>
                {point.margin && (
                  <span className="block text-xs text-stone-400 tabular-nums">
                    {point.margin} {point.label === "Price" ? "" : "better"}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One spec row, with a winner mark where the field has a better direction. */
function SpecRow({ row }: { row: CompareRow }) {
  return (
    <Row label={row.label} differs={row.differs} hint={row.hint}>
      <Cell>
        <SpecValue value={row.left} won={row.winner === "left"} margin={row.margin} />
      </Cell>
      <Cell>
        <SpecValue value={row.right} won={row.winner === "right"} margin={row.margin} />
      </Cell>
    </Row>
  );
}

function SpecValue({
  value,
  won,
  margin,
}: {
  value: string | null;
  won: boolean;
  margin?: string;
}) {
  if (value === null) return <Absent>Not listed</Absent>;

  if (!won) return <>{value}</>;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="font-bold text-stone-900">{value}</span>
      <span className="inline-flex items-baseline gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
        <span aria-hidden>✓</span>
        {margin ? <span className="tabular-nums">{margin} better</span> : "Better"}
      </span>
    </span>
  );
}

function Rating({ item }: { item: ComparableItem }) {
  const summary = item.reviewSummary;

  if (!summary || summary.votes === 0 || summary.average == null) {
    return <Absent>No reviews yet</Absent>;
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="font-bold text-stone-900 tabular-nums">
        {summary.average.toFixed(1)}/5
      </span>
      <span className="text-xs text-stone-500">
        {summary.votes} {summary.votes === 1 ? "player" : "players"}
      </span>
      {item.editorialMatch !== undefined &&
        item.matchQuality !== undefined &&
        matchWasAdjusted(item.editorialMatch, item.matchQuality) && (
          <span className="block text-xs text-stone-400">
            moved the match from {item.editorialMatch}%
          </span>
        )}
    </span>
  );
}

function Copies({ item }: { item: ComparableItem }) {
  if (!item.comparedTo) return <Absent>It is the original</Absent>;
  return (
    <Link
      href={`/pedal/${item.comparedTo.slug}`}
      className="font-bold text-amber-700 underline underline-offset-2"
    >
      {item.comparedTo.name}
    </Link>
  );
}

function Cheapest({ item }: { item: ComparableItem }) {
  if (!item.cheapest) return <Absent>—</Absent>;
  return (
    <>
      {item.cheapest.name} at{" "}
      <span className="font-bold tabular-nums">
        {formatPrice(item.cheapest.priceGBP)}
      </span>
    </>
  );
}

function ItemHead({
  item,
  cheapest,
}: {
  item: ComparableItem;
  cheapest: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="tz-well relative aspect-square w-24 shrink-0 sm:w-28">
        <PedalImage
          src={item.imageUrl}
          name={item.name}
          brand={item.brand}
          sizes="112px"
        />
        <span
          className={`tz-ribbon top-[8%] ${
            item.kind === "clone" ? "tz-ribbon--green" : "tz-ribbon--dark"
          }`}
        >
          {item.kind === "clone" ? "Budget" : "Original"}
        </span>
      </div>

      <div className="min-w-0">
        <p className="tz-brand text-amber-700">{item.brand}</p>
        <h2 className="tz-heading mt-0.5 text-lg text-stone-900">
          <Link href={item.href} className="hover:text-amber-800">
            {item.name}
          </Link>
        </h2>
        <p className="tz-heading mt-1.5 text-2xl text-stone-900 tabular-nums">
          {formatPrice(item.priceGBP)}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {cheapest && (
            <span className="tz-tag bg-emerald-700 text-white">
              Cheaper
            </span>
          )}
          {item.reviewSummary?.average != null && item.reviewSummary.votes > 0 && (
            <span className="tz-tag bg-stone-100 text-stone-700">
              ★{" "}
              <span className="tabular-nums">
                {item.reviewSummary.average.toFixed(1)}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CompareSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tz-panel overflow-hidden">
      <h3 className="tz-eyebrow border-b tz-rule bg-[var(--tz-sunken)] px-5 py-3 text-stone-500">
        {title}
      </h3>
      <div className="divide-y divide-stone-100">{children}</div>
    </section>
  );
}

function Row({
  label,
  differs,
  hint,
  children,
}: {
  label: string;
  differs: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid gap-x-5 gap-y-1 px-5 py-3 md:grid-cols-[minmax(0,10rem)_1fr_1fr] ${
        differs ? "bg-amber-50/60" : ""
      }`}
    >
      <div className="md:pt-0.5">
        <p className="text-xs font-bold text-stone-500">
          {label}
          {differs && (
            <span
              className="ml-1.5 font-medium text-amber-700"
              title="These two differ"
            >
              ≠
            </span>
          )}
        </p>
        {hint && (
          <p className="mt-0.5 hidden text-[11px] leading-snug text-stone-400 md:block">
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function Cell({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`min-w-0 text-sm ${
        strong ? "tz-heading text-base text-stone-900 tabular-nums" : "tz-body text-stone-700"
      }`}
    >
      {children}
    </div>
  );
}

function Absent({ children }: { children: React.ReactNode }) {
  return <span className="text-stone-400">{children}</span>;
}

function ProsConsList({
  items,
  sign,
  tone,
}: {
  items?: string[];
  sign: string;
  tone: string;
}) {
  if (!items || items.length === 0) return <Absent>—</Absent>;
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className={`shrink-0 font-bold ${tone}`}>{sign}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
