import { db } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { ResourceCard } from "@/components/ResourceCard";

/**
 * Teaching strategies & professional learning shelf (PRD §21–22):
 * practical guidance in What → Why → How → Example form, plus CPD reading.
 * Authors structure strategy descriptions under those four headings.
 */
export default async function StrategiesPage() {
  const strategies = await db.resource.findMany({
    where: { reviewStatus: "APPROVED", type: "TEACHING_STRATEGY" },
    orderBy: { createdAt: "desc" },
    include: { subject: true, classLevel: true },
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Teaching strategies</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Practical guidance for the classroom — each strategy covers{" "}
          <strong>What it is → Why it matters → How to use it → Example</strong>.
        </p>
        {strategies.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No strategies published yet — questioning techniques, retrieval practice,
            differentiation and more are on the way.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {strategies.map((r) => (
              <article key={r.id} className="rounded-lg border border-zinc-200 bg-white p-5">
                <ResourceCard
                  resource={{
                    id: r.id,
                    title: r.title,
                    description: "",
                    type: r.type,
                    level: r.level,
                    badges: r.badges,
                    subjectName: r.subject?.name ?? null,
                    className: r.classLevel?.name ?? null,
                  }}
                />
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{r.description}</p>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
