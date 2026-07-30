import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate disclosure",
  description: "How The Tone Zone makes money, and what that does and doesn't affect.",
};

const UPDATED = "29 July 2026";

export default function AffiliatesPage() {
  return (
    <>
      <h1>Affiliate disclosure</h1>
      <p className="tz-updated">Last updated {UPDATED}</p>

      <p>
        <strong>
          Some links on this site are affiliate links. If you buy through one we
          may earn a commission, at no extra cost to you.
        </strong>{" "}
        The price you pay is exactly the same as it would be had you gone to the
        retailer directly.
      </p>

      <h2>Which links</h2>
      <p>
        The retailer buttons - Amazon, Reverb and Gear4music - may carry a
        tracking tag identifying this site as the referrer. Where we hold no
        affiliate arrangement, the same button is a plain link and earns
        nothing. Affiliate links are marked up as{" "}
        <code>rel=&quot;sponsored nofollow&quot;</code> in the page source.
      </p>
      <p>
        The Tone Zone is a participant in the Amazon EU Associates Programme, an
        affiliate advertising programme designed to provide a means for sites to
        earn advertising fees by advertising and linking to Amazon.co.uk. As an
        Amazon Associate we earn from qualifying purchases.
      </p>

      <h2>What it does not affect</h2>
      <ul>
        <li>
          <strong>Which alternatives we list.</strong> Cheap pedals from brands
          with no affiliate programme at all are listed and recommended
          throughout, and they are frequently the top pick.
        </li>
        <li>
          <strong>Tonal match figures, pros and cons.</strong> These are written
          without reference to what any link pays. We list the cons of budget
          pedals we link to, which would be a strange way to maximise commission.
        </li>
        <li>
          <strong>Sort order.</strong> Listings sort by closest match or by
          price, never by what earns most.
        </li>
      </ul>
      <p>
        We would rather tell you a £25 pedal is plastic and buffered than sell
        you one, so the honest note in the cons column stays even when it costs
        us a click.
      </p>

      <h2>No paid placement</h2>
      <p>
        Nobody can pay to be added to the catalogue, to have a tonal match
        raised, or to have a competitor removed. If that ever changes it will be
        disclosed clearly on the page in question, not buried here.
      </p>

      <h2>Prices</h2>
      <p>
        Prices shown on this site are approximate and recorded manually. They are
        not fed live from any retailer, and Amazon prices in particular change
        frequently - the price on Amazon at the time of purchase is the one that
        applies.
      </p>
    </>
  );
}
