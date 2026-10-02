import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";

/** Read a learner lesson step by step, or download the book. */
export default async function LearnerLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lesson = await db.learnerLesson.findUnique({
    where: { id },
    include: { subject: true, classLevel: true, topic: true },
  });
  if (!lesson || lesson.reviewStatus !== "APPROVED") notFound();

  const related = await db.learnerLesson.findMany({
    where: {
      reviewStatus: "APPROVED",
      id: { not: id },
      basicLevel: lesson.basicLevel,
      subjectId: lesson.subjectId ?? undefined,
    },
    orderBy: { title: "asc" },
    take: 4,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/learners" className="underline">Learner Resources</Link>
          {` → Basic ${lesson.basicLevel}`}
          {lesson.subject && <> → {lesson.subject.name}</>}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{lesson.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {[lesson.classLevel?.name, lesson.topic?.name, lesson.sourceRef].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-3 text-zinc-700">{lesson.description}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {lesson.fileKey ? (
            <a
              href={`/api/learners/${lesson.id}/download`}
              className="rounded-full bg-amber-800 px-5 py-2 text-sm font-medium text-white"
            >
              ⬇ Download the book
            </a>
          ) : (
            <span className="rounded-full border border-dashed border-zinc-300 px-5 py-2 text-sm text-zinc-500">
              File coming soon
            </span>
          )}
        </div>

        <article className="mt-8 border-t border-zinc-200 pt-6">
          <h2 className="font-semibold text-zinc-900">Read step by step</h2>
          <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
            {lesson.bodyText}
          </div>
        </article>

        {related.length > 0 && (
          <section className="mt-8 border-t border-zinc-200 pt-6">
            <h2 className="font-semibold text-zinc-900">More in this level</h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {related.map((r) => (
                <li key={r.id} className="text-sm">
                  <Link href={`/learners/${r.id}`} className="text-amber-900 hover:underline">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
