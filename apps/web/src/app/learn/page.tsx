import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";

/** Professional learning shelf (PRD §22): short training modules for teachers. */
export default async function LearnPage() {
  const viewer = await getViewer();

  const modules = await db.module.findMany({
    where: { reviewStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { steps: true } },
      ...(viewer
        ? { progress: { where: { userId: viewer.id }, select: { completedStep: true, completed: true } } }
        : {}),
    },
  });

  const paths = await db.learningPath.findMany({
    where: { reviewStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          module: {
            select: {
              id: true,
              ...(viewer
                ? { progress: { where: { userId: viewer.id }, select: { completed: true } } }
                : {}),
            },
          },
        },
      },
    },
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Professional learning</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Short training modules — classroom practice guides, teaching tips and readings.
        </p>

        {paths.length > 0 && (
          <section className="mt-8">
            <h2 className="font-semibold text-zinc-900">Learning pathways</h2>
            <p className="mt-1 text-sm text-zinc-600">Ordered module sequences for deeper growth.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {paths.map((path) => {
                const total = path.items.length;
                const done = path.items.filter((i) =>
                  "progress" in i.module ? i.module.progress.some((p) => p.completed) : false,
                ).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Link
                    key={path.id}
                    href={`/learn/paths/${path.slug}`}
                    className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-amber-700"
                  >
                    <h3 className="font-semibold text-amber-900">{path.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{total} modules</p>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{path.description}</p>
                    {viewer && total > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 w-full rounded-full bg-zinc-100">
                          <div className="h-2 rounded-full bg-amber-700" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500">{done === total ? "Done ✓" : `${pct}%`}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {modules.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No modules published yet — check back soon.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {modules.map((m) => {
              const p = "progress" in m ? m.progress[0] : undefined;
              const total = m._count.steps;
              const pct = p && total > 0 ? Math.min(100, Math.round((p.completedStep / total) * 100)) : 0;
              return (
                <Link
                  key={m.id}
                  href={`/learn/${m.slug}`}
                  className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-amber-700"
                >
                  <h2 className="font-semibold text-amber-900">{m.title}</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {total} steps
                    {m.durationMinutes ? ` · ~${m.durationMinutes} min` : ""}
                    {m.audience ? ` · ${m.audience}` : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{m.description}</p>
                  {p && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-zinc-100">
                        <div className="h-2 rounded-full bg-amber-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{p.completed ? "Done ✓" : `${pct}%`}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
