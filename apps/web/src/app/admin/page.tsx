import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminQueue, type QueueItem } from "@/components/AdminQueue";
import { AdminCreateForm } from "@/components/AdminCreateForm";
import { AdminPackForm, AdminPackQueue } from "@/components/AdminPackForm";
import { AdminAccessManager } from "@/components/AdminAccessManager";
import { AdminModuleForm, AdminModuleQueue } from "@/components/AdminLearning";

function toQueueItem(r: {
  id: string;
  title: string;
  type: string;
  level: string;
  reviewStatus: string;
  createdAt: Date;
  subject: { name: string } | null;
  classLevel: { name: string } | null;
  submittedBy: { name: string; organization: string | null } | null;
}): QueueItem {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    level: r.level,
    className: r.classLevel?.name ?? null,
    subjectName: r.subject?.name ?? null,
    submittedBy: r.submittedBy?.name ?? null,
    submittedOrg: r.submittedBy?.organization ?? null,
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

  const [pending, decided, draftPacks, institutions, entitlements, draftModules] = await Promise.all([
    db.resource.findMany({
      where: { reviewStatus: { in: ["DRAFT", "IN_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      include: { subject: true, classLevel: true, submittedBy: { select: { name: true, organization: true } } },
    }),
    db.resource.findMany({
      where: { reviewStatus: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { subject: true, classLevel: true, submittedBy: { select: { name: true } } },
    }),
    db.pack.findMany({
      where: { reviewStatus: { in: ["DRAFT", "IN_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    }),
    db.institution.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    }),
    db.entitlement.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.module.findMany({
      where: { reviewStatus: { in: ["DRAFT", "IN_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { steps: true } } },
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
          <h2 className="font-semibold text-zinc-900">Lesson packs (create + review)</h2>
          <AdminPackForm />
          <h3 className="mt-4 text-sm font-semibold text-zinc-900">Draft packs ({draftPacks.length})</h3>
          <AdminPackQueue
            packs={draftPacks.map((p) => ({ id: p.id, title: p.title, itemCount: p._count.items }))}
          />
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Access management (premium + institutions)</h2>
          <AdminAccessManager
            initial={{
              institutions: institutions.map((i) => ({
                id: i.id,
                name: i.name,
                code: i.code,
                active: i.active,
                members: i.members.map((m) => ({
                  userId: m.user.id,
                  name: m.user.name,
                  email: m.user.email,
                })),
              })),
              entitlements: entitlements.map((e) => ({
                id: e.id,
                kind: e.kind,
                expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
                email: e.user.email,
                name: e.user.name,
              })),
            }}
          />
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Professional learning (create + review)</h2>
          <AdminModuleForm />
          <h3 className="mt-4 text-sm font-semibold text-zinc-900">Draft modules ({draftModules.length})</h3>
          <AdminModuleQueue
            modules={draftModules.map((m) => ({ id: m.id, title: m.title, stepCount: m._count.steps }))}
          />
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
