import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";

/** Learning path detail: modules in order with the teacher's progress. */
export default async function PathPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  const staff = isStaff(viewer);

  const path = await db.learningPath.findUnique({
    where: { slug },
    include: { items: { orderBy: { position: "asc" }, include: { module: true } } },
  });
  if (!path) notFound();
  if (path.reviewStatus !== "APPROVED" && !staff) notFound();

  const progress = viewer
    ? await db.moduleProgress.findMany({
        where: { userId: viewer.id, moduleId: { in: path.items.map((i) => i.moduleId) } },
      })
    : [];
  const doneOf = new Map(progress.map((p) => [p.moduleId, p]));
  const total = path.items.length;
  const doneCount = path.items.filter((i) => doneOf.get(i.moduleId)?.completed).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/learn" className="underline">Professional learning</Link> → Pathways
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{path.title}</h1>
        <p className="mt-2 text-zinc-700">{path.description}</p>

        {viewer && total > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="h-2 w-full rounded-full bg-zinc-100">
              <div className="h-2 rounded-full bg-amber-700" style={{ width: `${pct}%` }} />
            </div>
            <span className="shrink-0 text-sm text-zinc-600">
              {doneCount === total ? "Pathway complete ✓" : `${doneCount}/${total} modules`}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {path.items.map((item, idx) => {
            const done = doneOf.get(item.moduleId)?.completed ?? false;
            return (
              <Link
                key={item.id}
                href={`/learn/${item.module.slug}`}
                className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-amber-700"
              >
                <p className="font-medium text-zinc-900">
                  {idx + 1}. {item.module.title} {done && <span className="text-emerald-700">✓</span>}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{item.module.description}</p>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
