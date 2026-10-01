import { SiteHeader } from "@/components/SiteHeader";

/** Privacy notice (pilot version — have counsel review before public launch). */
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-zinc-900">Privacy notice</h1>
        <p className="mt-1 text-sm text-zinc-500">Pilot version — last updated September 2026.</p>
        <div className="mt-4 flex flex-col gap-4 text-sm text-zinc-700">
          <section>
            <h2 className="font-semibold text-zinc-900">1. Data we store</h2>
            <p>Account: name, email and password (hashed). Profile: levels, classes, subjects,
              school, country, organization where provided. Activity: saved resources, collections,
              downloads, views, searches, feedback, contributions, learning progress and community posts.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">2. Why we store it</h2>
            <p>To personalize your dashboard and recommendations, operate the review process,
              run institutional access, and measure whether the platform helps teachers (see Analytics).</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">3. Where it lives</h2>
            <p>During the pilot, data lives on the pilot host (PostgreSQL) and uploaded files in
              managed storage. AI features send prompts (never passwords) to our language-model
              provider to generate the requested output.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">4. Cookies & sessions</h2>
            <p>We use a single session cookie to keep you logged in. No advertising trackers.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">5. Your rights</h2>
            <p>Ask your pilot lead to correct or delete your account and data at any time.
              Deletion removes your profile, saves, collections and posts; anonymized usage
              statistics may be retained.</p>
          </section>
          <section>
            <h2 className="font-semibold text-zinc-900">6. Children</h2>
            <p>Accounts are for teachers and education staff, not learners. Do not upload
              learners&apos; personal data in contributions or community posts.</p>
          </section>
        </div>
      </main>
    </>
  );
}
