import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms on which you may use The Tone Zone.",
};

const UPDATED = "29 July 2026";

export default function TermsPage() {
  return (
    <>
      <h1>Terms of use</h1>
      <p className="tz-updated">Last updated {UPDATED}</p>

      <p>
        The Tone Zone is an independent editorial site that compares expensive
        guitar pedals and amplifiers with cheaper alternatives. By using the
        site you accept these terms. If you do not accept them, please do not
        use the site.
      </p>

      <h2>Who we are</h2>
      <p>
        The Tone Zone is operated as a personal project by its owner. We are not
        affiliated with, endorsed by, or authorised by any manufacturer, brand
        or retailer named anywhere on this site.
      </p>

      <h2>Prices are estimates, not offers</h2>
      <p>
        Every price shown is an approximate UK street price recorded at some
        point in the past. Prices change constantly, vary by retailer, and may be
        wrong. Nothing on this site is an offer to sell, a quotation, or a
        representation that an item is available at the price shown. Always check
        the retailer&apos;s own listing before buying.
      </p>

      <h2>Editorial opinions</h2>
      <p>
        Comparisons, &ldquo;tonal match&rdquo; percentages, pros and cons, and
        verdicts are our subjective editorial opinion, offered in good faith. A
        tonal match figure is a judgement about how close two pieces of
        equipment sound to our ears and to the consensus we have read - it is not
        a measurement, and it is not a statement of fact about either product.
      </p>
      <p>
        Nothing here is professional advice. Do not rely on this site as the
        sole basis for a purchase.
      </p>

      <h2>Accuracy</h2>
      <p>
        We try to keep the catalogue accurate, but we do not warrant that it is
        complete, current or error-free. Specifications, artist associations and
        product availability may be out of date or mistaken. If you spot
        something wrong, please{" "}
        <Link href="/suggest">tell us</Link> and we will look at it.
      </p>

      <h2>Outbound links</h2>
      <p>
        The site links to third-party retailers and to video hosted on YouTube.
        We do not control those sites and are not responsible for their content,
        prices, availability, delivery, returns or privacy practices. Your
        purchase is a contract between you and that retailer, and their terms
        apply. Some outbound links are affiliate links - see our{" "}
        <Link href="/legal/affiliates">affiliate disclosure</Link>.
      </p>

      <h2>Your contributions</h2>
      <p>
        If you submit a suggestion, you confirm that you are entitled to share
        the information, that it is accurate to the best of your knowledge, and
        that it is not confidential or defamatory. You grant us a
        non-exclusive, royalty-free licence to use, edit and publish the
        substance of your suggestion on the site. We may accept, edit or reject
        any submission, and we are not obliged to publish or respond.
      </p>
      <p>
        Do not submit anything that infringes someone else&apos;s rights, and do
        not include personal information about other people.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>
          Do not scrape, copy or republish substantial parts of the catalogue
          without permission.
        </li>
        <li>
          Do not attempt to interfere with the site, its hosting, or its
          security, or to gain access to the admin area.
        </li>
        <li>Do not use the site for anything unlawful.</li>
      </ul>

      <h2>Our content</h2>
      <p>
        The written comparisons, descriptions, layout, code and branding of this
        site belong to us. Product names, brand names and product photography
        belong to their respective owners - see{" "}
        <Link href="/legal/trademarks">trademarks and copyright</Link>.
      </p>

      <h2>Liability</h2>
      <p>
        The site is provided &ldquo;as is&rdquo;. To the fullest extent
        permitted by law, we exclude all warranties and are not liable for any
        loss arising from your use of the site or reliance on its content,
        including loss arising from a purchase you made after reading it.
      </p>
      <p>
        Nothing in these terms limits liability for death or personal injury
        caused by negligence, for fraud, or for anything else that cannot
        lawfully be limited. If you are a consumer, your statutory rights are
        unaffected.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The version published here is the one that
        applies, and the date above tells you when it last changed.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales, and the courts
        of England and Wales have exclusive jurisdiction.
      </p>

      <h2>Contact</h2>
      <p>
        Use the <Link href="/suggest">suggestion form</Link> for anything about
        the catalogue.
      </p>
    </>
  );
}
