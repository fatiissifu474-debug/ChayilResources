import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminQueue, type QueueItem } from "@/components/AdminQueue";
import { AdminCreateForm } from "@/components/AdminCreateForm";

function toQueueItem(r: {
  id: string;
  title: string;
  type: string;
  level: string;
  reviewStatus: string;
  createdAt: Date;
  subject: { name: string } | null;
  classLevel: { name: string } | null;
}): QueueItem {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    level: r.level,
    className: r.classLevel?.name ?? null,
    subjectName: r.subject?.name ?? null,
    reviewStatus: r.reviewStatus,
    createdAt: r.createdAt.toISOString(),
  };
}

export default async function AdminPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  if (!isStaff(viewer)) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-2xl font-bold text-zinc-900">Restricted area</h1>
          <p className="mt-2 text-zinc-600">
            Content administration is limited to reviewers and admins.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-emerald-700 underline">
            Back to dashboard
          </Link>
        </main>
      </>
    );
  }

  const [pending, decided] = await Promise.all([
    db.resource.findMany({
      where: { reviewStatus: { in: ["DRAFT", "IN_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      include: { subject: true, classLevel: true },
    }),
    db.resource.findMany({
      where: { reviewStatus: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { subject: true, classLevel: true },
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Content administration</h1>

        <section className="mt-6">
          <h2 className="font-semibold text-zinc-900">Add a resource (creates a draft)</h2>
          <AdminCreateForm />
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">
            Review queue ({pending.length})
          </h2>
          <AdminQueue initialPending={pending.map(toQueueItem)} />
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Recently decided</h2>
          <div className="mt-3 flex flex-col gap-2">
            {decided.map((r) => (
              <div key={r.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm">
                <Link href={`/resources/${r.id}`} className="font-medium text-emerald-900 hover:underline">
                  {r.title}
                </Link>{" "}
                <span className="text-zinc-500">— {r.reviewStatus}</span>
              </div>
            ))}
            {decided.length === 0 && (
              <p className="text-sm text-zinc-500">Nothing decided yet.</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
