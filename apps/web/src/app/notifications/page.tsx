import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { ResourceCard } from "@/components/ResourceCard";
import { EducationLevel } from "@prisma/client";

const SINCE_DAYS = 14;

/**
 * Notifications stub (PRD §23): purposeful updates only —
 * new resources in the teacher's subjects + updates to saved resources.
 * Granular preferences arrive in Phase 2.
 */
export default async function NotificationsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const profile = await db.user.findUniqueOrThrow({ where: { id: viewer.id } });
  if (!profile.profileCompleted) redirect("/onboarding");

  const since = new Date(Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000);
  const levels = profile.teachingLevels as EducationLevel[];

  const [newInSubjects, savedUpdates] = await Promise.all([
    levels.length > 0
      ? db.resource.findMany({
          where: { reviewStatus: "APPROVED", createdAt: { gte: since }, level: { in: levels } },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { subject: true, classLevel: true },
        })
      : Promise.resolve([]),
    db.savedResource.findMany({
      where: { userId: viewer.id, resource: { updatedAt: { gte: since } } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { resource: { include: { subject: true, classLevel: true } } },
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Notifications</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Only purposeful updates — new resources in your subjects and changes to saved
          resources. Notification preferences arrive in a later release.
        </p>

        <section className="mt-6">
          <h2 className="font-semibold text-zinc-900">
            New in your subjects (last {SINCE_DAYS} days)
          </h2>
          {newInSubjects.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nothing new for you right now.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {newInSubjects.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={{
                    id: r.id,
                    title: r.title,
                    description: r.description,
                    type: r.type,
                    level: r.level,
                    badges: r.badges,
                    subjectName: r.subject?.name ?? null,
                    className: r.classLevel?.name ?? null,
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Updates to your saved resources</h2>
          {savedUpdates.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No updates to saved resources.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {savedUpdates.map((s) => (
                <li key={s.resource.id} className="text-sm">
                  <Link href={`/resources/${s.resource.id}`} className="text-emerald-900 hover:underline">
                    {s.resource.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
