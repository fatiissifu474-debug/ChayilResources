import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col px-6 py-16">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900">
          Find the right resource for the right class, subject and topic — quickly.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600">
          ChayilResources is a curriculum-aligned library of textbooks, lesson plans,
          worksheets and assessments for Primary, JHS, SHS and TVET teachers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/browse"
            className="rounded-full bg-emerald-800 px-6 py-2.5 font-medium text-white"
          >
            Browse resources
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-zinc-300 px-6 py-2.5 font-medium text-zinc-700"
          >
            Search
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-zinc-300 px-6 py-2.5 font-medium text-zinc-700"
          >
            Create free account
          </Link>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">🔍 Search</h2>
            <p className="mt-1 text-sm text-zinc-600">
              “JHS 2 fractions lesson plan”, “Primary 5 reading comprehension”.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">🗂️ Browse by curriculum</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Level → Class → Subject → Topic → Resources.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">📌 Save &amp; use offline</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Bookmark resources for lesson prep, even with poor connectivity.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
