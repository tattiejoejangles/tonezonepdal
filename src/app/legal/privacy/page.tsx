import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & cookies",
  description: "What data The Tone Zone collects, and what it does not.",
};

const UPDATED = "29 July 2026";

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy &amp; cookies</h1>
      <p className="tz-updated">Last updated {UPDATED}</p>

      <p>
        Short version: there are no accounts, no analytics cookies and no
        advertising trackers. The only personal data we ever hold is an email
        address, and only if you choose to type one into a suggestion.
      </p>

      <h2>What stays in your browser</h2>
      <p>
        Saved gear and any tone ratings you give are stored in your own
        browser&apos;s local storage. They never reach our servers, they are not
        an account, and clearing your browser data deletes them. That is why
        your saved list does not follow you to another device.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Suggestions.</strong> If you submit one we store what you
          wrote, which page it was about, and the email address if you gave one.
          The email is used only to follow up on that suggestion.
        </li>
        <li>
          <strong>Server logs.</strong> Our host records standard request
          information, including IP address, for security and to keep the site
          running.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <ul>
        <li>No accounts, passwords or payment details - we never take payments.</li>
        <li>No analytics or advertising cookies, and no cross-site tracking.</li>
        <li>We do not sell or share personal data.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        The public site sets no cookies. The private admin area sets one
        strictly necessary session cookie, which only its operator ever
        receives. Because we set no analytics or marketing cookies, there is no
        consent banner to click through.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li>
          <strong>Vercel</strong> hosts the site and processes request logs.
        </li>
        <li>
          <strong>Supabase</strong> stores the catalogue and any suggestions.
        </li>
        <li>
          <strong>YouTube.</strong> Demo videos are embedded through
          youtube-nocookie.com, which avoids tracking cookies until you press
          play. Pressing play brings Google&apos;s own privacy policy into effect.
        </li>
        <li>
          <strong>Retailers.</strong> Following an outbound link hands you over
          to that retailer, who may set their own cookies, including affiliate
          tracking - see the{" "}
          <Link href="/legal/affiliates">affiliate disclosure</Link>.
        </li>
        <li>
          <strong>Product and artist images</strong> are loaded from third-party
          hosts, which means those hosts can see that your browser requested an
          image.
        </li>
      </ul>

      <h2>How long we keep things</h2>
      <p>
        Suggestions are kept while they are useful for maintaining the
        catalogue. Ask us and we will delete yours, along with any email address
        attached to it.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK data protection law you can ask for a copy of the personal data
        we hold about you, ask us to correct or delete it, or object to our
        processing it. In practice the only thing we are likely to hold is an
        email on a suggestion. You can also complain to the Information
        Commissioner&apos;s Office.
      </p>

      <h2>Children</h2>
      <p>
        The site is not directed at children and we do not knowingly collect
        their data.
      </p>

      <h2>Contact</h2>
      <p>
        Send privacy requests through the{" "}
        <Link href="/suggest">suggestion form</Link>.
      </p>
    </>
  );
}
