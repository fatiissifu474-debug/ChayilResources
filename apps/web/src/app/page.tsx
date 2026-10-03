import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { BooksArt, ClassroomArt, SchoolArt } from "@/components/LandingArt";

/** Landing page — the front door: a clear "Begin here" path into the product. */
export const dynamic = "force-dynamic"; // live DB counts: never prerender at build time

export default async function Home() {
  const [resources, subjects, classes] = await Promise.all([
    db.resource.count({ where: { reviewStatus: "APPROVED" } }),
    db.subject.count(),
    db.classLevel.count(),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-5xl items-center gap-8 px-6 py-14 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              For Primary & JHS teachers · Basic 1–9 · Ghana
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Find the right resource for the right class — quickly.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-zinc-600">
              ChayilResources is your curriculum-aligned library and lesson-preparation
              companion: textbooks, lesson plans, worksheets and assessments, organized
              around what you teach.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-amber-800 px-8 py-3 text-lg font-medium text-white"
              >
                Begin here
              </Link>
              <Link
                href="/browse"
                className="rounded-full border border-zinc-300 px-8 py-3 text-lg font-medium text-zinc-700"
              >
                Explore resources
              </Link>
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              Free to start · Works on any device · Built for low connectivity
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
              <ClassroomArt />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
              <BooksArt />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
              <SchoolArt />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-200 bg-amber-50">
          <div className="mx-auto grid max-w-5xl grid-cols-3 gap-4 px-6 py-6 text-center">
            <div>
              <p className="text-3xl font-bold text-amber-900">{resources}</p>
              <p className="text-sm text-zinc-600">Reviewed resources</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-900">{subjects}</p>
              <p className="text-sm text-zinc-600">Subjects covered</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-900">{classes}</p>
              <p className="text-sm text-zinc-600">Classes supported</p>
            </div>
          </div>
        </section>

        {/* Three ways to begin */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold text-zinc-900">Three ways to begin</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/search" className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-amber-700">
              <h3 className="font-semibold text-zinc-900">🔍 Search</h3>
              <p className="mt-1 text-sm text-zinc-600">“JHS 2 fractions lesson plan”, “Primary 5 reading comprehension”.</p>
            </Link>
            <Link href="/browse" className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-amber-700">
              <h3 className="font-semibold text-zinc-900">🗂️ Browse by curriculum</h3>
              <p className="mt-1 text-sm text-zinc-600">Level → Class → Subject → Topic → Resources.</p>
            </Link>
            <Link href="/packs" className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-amber-700">
              <h3 className="font-semibold text-zinc-900">🎒 Lesson packs</h3>
              <p className="mt-1 text-sm text-zinc-600">Everything for a class and subject: learn, plan, practice, check.</p>
            </Link>
          </div>
        </section>

        {/* Levels */}
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <h2 className="text-2xl font-bold text-zinc-900">Who it serves</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Primary", "Lower & upper primary · Basic 1–6", "PRIMARY"],
              ["JHS", "BECE-ready teaching resources · Basic 7–9", "JHS"],
            ].map(([label, blurb, level]) => (
              <Link
                key={level}
                href={`/browse?level=${level}`}
                className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-amber-700"
              >
                <h3 className="font-semibold text-amber-900">{label}</h3>
                <p className="mt-1 text-sm text-zinc-600">{blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Mission band */}
        <section className="bg-zinc-900 text-white">
          <div className="mx-auto max-w-5xl px-6 py-12 text-center">
            <p className="text-xl font-medium">
              “Spend less time searching, more time preparing effective learning experiences.”
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-full bg-amber-500 px-8 py-3 font-medium text-zinc-900"
            >
              Begin here — it&apos;s free
            </Link>
          </div>
        </section>

        <footer className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-zinc-500">
          <Link href="/terms" className="underline">Terms of use</Link>
          {" · "}
          <Link href="/privacy" className="underline">Privacy notice</Link>
        </footer>
      </main>
    </>
  );
}
