import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trademarks & copyright",
  description:
    "How The Tone Zone uses brand names, product photography and artist names.",
};

const UPDATED = "29 July 2026";

export default function TrademarksPage() {
  return (
    <>
      <h1>Trademarks &amp; copyright</h1>
      <p className="tz-updated">Last updated {UPDATED}</p>

      <h2>Brand and product names</h2>
      <p>
        All product names, brand names, model numbers and logos referred to on
        this site are the property of their respective owners. Boss and Roland
        are trademarks of Roland Corporation; Ibanez of Hoshino Gakki;
        Electro-Harmonix of New Sensor Corp; Marshall, Fender, Vox, MXR, Dunlop,
        Strymon, Behringer, Mooer, Joyo, Donner, Harley Benton, TC Electronic and
        every other name used here belong to their own proprietors. This list is
        illustrative, not exhaustive.
      </p>
      <p>
        We use these names descriptively, to identify the equipment being
        discussed and compared. That is nominative use: it is necessary to
        identify a product in order to write about it, we use no more of the name
        than is needed, and we suggest no sponsorship or endorsement.{" "}
        <strong>
          The Tone Zone is not affiliated with, endorsed by, or authorised by any
          manufacturer or retailer named on this site.
        </strong>
      </p>

      <h2>&ldquo;Clone&rdquo;, &ldquo;alternative&rdquo; and comparison</h2>
      <p>
        Describing one pedal as a budget alternative to another is comparative
        commentary and editorial opinion. It is not a claim that the two products
        are the same, that either is a counterfeit, or that one is manufactured
        or licensed by the other&apos;s maker. Where a manufacturer has publicly
        described their own product as based on a classic circuit, we report that.
      </p>

      <h2>Product photography</h2>
      <p>
        Product images are used to identify the item being discussed and
        linked to. Where a photograph comes from Wikimedia Commons under a
        Creative Commons licence, the licence is credited beneath the image, as
        that licence requires. Retailer product shots are used in the context of
        linking to that retailer&apos;s listing for the item.
      </p>
      <p>
        If you own the rights to an image used here and would rather it was not,
        tell us and we will remove it promptly - see below.
      </p>

      <h2>Artist names and photographs</h2>
      <p>
        Artists are named to record documented, publicly reported associations
        between a musician and a piece of equipment. Naming a player is not a
        claim that they endorse this site, the product, or any alternative
        listed against it.
      </p>
      <p>
        Where an artist photograph is shown it is used under the licence
        attached to it, credited where that licence requires. We do not use press
        or promotional photography without permission.
      </p>

      <h2>Video</h2>
      <p>
        Demo videos are embedded from YouTube using YouTube&apos;s own player and
        remain hosted by, and under the control of, their uploaders. We do not
        host, download or re-encode video, and embedding does not imply the
        uploader endorses this site.
      </p>

      <h2>Our own material</h2>
      <p>
        The comparisons, descriptions, tonal match assessments, pros and cons,
        page design, code and The Tone Zone name and mark are ours. Please do not
        republish substantial portions without asking.
      </p>

      <h2>Takedown and corrections</h2>
      <p>
        If you are a rights holder and believe something here infringes your
        rights, or if any brand or artist reference is wrong, contact us through
        the <Link href="/suggest">suggestion form</Link> with the page and the
        detail. We will review it promptly and remove or correct anything we
        cannot properly justify.
      </p>
    </>
  );
}
