import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { LearnStepButton } from "@/components/LearnStepButton";

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  const staff = isStaff(viewer);

  const module = await db.module.findUnique({
    where: { slug },
    include: { steps: { orderBy: { position: "asc" } } },
  });
  if (!module) notFound();
  if (module.reviewStatus !== "APPROVED" && !staff) notFound();

  const progress = viewer
    ? await db.moduleProgress.findUnique({
        where: { userId_moduleId: { userId: viewer.id, moduleId: module.id } },
      })
    : null;

  const total = module.steps.length;
  const done = progress?.completedStep ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/learn" className="underline">Professional learning</Link>
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{module.title}</h1>
        <p className="mt-2 text-zinc-700">{module.description}</p>
        {module.objectives && (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-900">You will learn to</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{module.objectives}</p>
          </div>
        )}

        {viewer && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="h-2 w-full rounded-full bg-zinc-100">
              <div className="h-2 rounded-full bg-emerald-700" style={{ width: `${pct}%` }} />
            </div>
            <span className="shrink-0 text-sm text-zinc-600">
              {progress?.completed ? "Completed ✓" : `${done}/${total} steps`}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {module.steps.map((s) => {
            const isDone = done >= s.position;
            return (
              <article key={s.id} className="rounded-lg border border-zinc-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-zinc-900">
                    Step {s.position}: {s.title}
                  </h2>
                  {viewer && <LearnStepButton slug={module.slug} step={s.position} done={isDone} />}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{s.body}</p>
              </article>
            );
          })}
        </div>

        {!viewer && (
          <p className="mt-6 text-sm text-zinc-600">
            <Link href="/login" className="font-medium text-emerald-700 underline">Log in</Link>{" "}
            to track your progress through this module.
          </p>
        )}
      </main>
    </>
  );
}
