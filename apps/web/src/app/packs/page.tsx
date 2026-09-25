import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";

/** Lesson preparation packs (PRD §20): curated resource sets per class/subject. */
export default async function PacksPage() {
  const packs = await db.pack.findMany({
    where: { reviewStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      subject: true,
      classLevel: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Lesson preparation packs</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Everything for a class and subject in one place — learn, plan, practice, check.
        </p>
        {packs.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No packs published yet — check back soon.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {packs.map((p) => (
              <Link
                key={p.id}
                href={`/packs/${p.id}`}
                className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-emerald-700"
              >
                <h2 className="font-semibold text-emerald-900">{p.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {[p.classLevel?.name, p.subject?.name, p.level].filter(Boolean).join(" · ")}
                  {"  "}· {p._count.items} resources
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{p.description}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
