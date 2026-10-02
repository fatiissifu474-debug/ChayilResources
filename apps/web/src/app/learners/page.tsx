import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";

const BASIC_LEVELS = [7, 8, 9];
const COMING = [1, 2, 3, 4, 5, 6];

/** Learner Resources: step-by-step learner books, organized by Basic level. */
export default async function LearnersPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level } = await searchParams;
  const basic = level ? parseInt(level, 10) : NaN;
  const active = BASIC_LEVELS.includes(basic) ? basic : null;

  const lessons = active
    ? await db.learnerLesson.findMany({
        where: { basicLevel: active, reviewStatus: "APPROVED" },
        orderBy: { title: "asc" },
        include: { subject: true, classLevel: true },
      })
    : [];

  const bySubject = new Map<string, typeof lessons>();
  for (const l of lessons) {
    const key = l.subject?.name ?? "General";
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(l);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Learner Resources</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Step-by-step lessons that walk you through each topic — with thinking
          activities and checks along the way. Pick your Basic level.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {BASIC_LEVELS.map((b) => (
            <Link
              key={b}
              href={`/learners?level=${b}`}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${active === b ? "border-amber-800 bg-amber-800 text-white" : "border-zinc-300 text-zinc-700"}`}
            >
              Basic {b}
            </Link>
          ))}
          {COMING.map((b) => (
            <span key={b} className="rounded-full border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-400">
              Basic {b} · soon
            </span>
          ))}
        </div>

        {active && (
          <div className="mt-6">
            {lessons.length === 0 ? (
              <p className="text-sm text-zinc-500">No learner lessons here yet — check back soon.</p>
            ) : (
              [...bySubject.entries()].map(([subject, items]) => (
                <section key={subject} className="mt-6">
                  <h2 className="font-semibold text-zinc-900">{subject}</h2>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {items.map((l) => (
                      <Link
                        key={l.id}
                        href={`/learners/${l.id}`}
                        className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-amber-700"
                      >
                        <p className="font-medium text-amber-900">{l.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{l.description}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </main>
    </>
  );
}
