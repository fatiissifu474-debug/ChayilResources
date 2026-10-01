import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

/** Terms of use (pilot version — have counsel review before public launch). */
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-zinc-900">Terms of use</h1>
        <p className="mt-1 text-sm text-zinc-500">Pilot version — last updated September 2026.</p>
        <div className="mt-4 flex flex-col gap-4 text-sm text-zinc-700">
          <section>
            <h2 className="font-semibold text-zinc-900">1. What ChayilResources is</h2>
            <p>A curriculum-aligned library and lesson-preparation companion for teachers.
              Accounts are for teachers, school staff, reviewers, publishers and approved partners.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">2. Your account</h2>
            <p>Keep your password private. You are responsible for activity under your account.
              One account per person; do not share logins across a school — use institutional access instead.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">3. Using resources</h2>
            <p>Every resource states its copyright holder and permitted use — respect it.
              Downloaded materials are for classroom preparation, not redistribution, unless the
              permitted use says otherwise.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">4. Contributions & community</h2>
            <p>Only submit work you own or are licensed to share. Community discussion must stay
              professional; moderators may hide or remove content that is off-topic, abusive or infringing.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">5. Availability</h2>
            <p>During the pilot the service may change or pause for maintenance. We aim to keep
              saved resources and downloads usable offline at all times.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">6. Contact</h2>
            <p>Questions about these terms: contact your pilot lead or school champion. See also our{" "}
              <Link href="/privacy" className="text-amber-700 underline">privacy notice</Link>.</p>
          </section>
        </div>
      </main>
    </>
  );
}
