import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { ResourceCard, type CardResource } from "@/components/ResourceCard";
import { EducationLevel } from "@prisma/client";

function toCard(r: {
  id: string;
  title: string;
  description: string;
  type: string;
  level: string;
  badges: string[];
  subject: { name: string } | null;
  classLevel: { name: string } | null;
}): CardResource {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    level: r.level,
    badges: r.badges,
    subjectName: r.subject?.name ?? null,
    className: r.classLevel?.name ?? null,
  };
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const profile = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  if (!profile.profileCompleted) redirect("/onboarding");

  const levels = profile.teachingLevels as EducationLevel[];
  const levelFilter = levels.length > 0 ? { level: { in: levels } } : {};

  const [recommended, recent, saved, savedCount, continueLearning] = await Promise.all([
    db.resource.findMany({
      where: { reviewStatus: "APPROVED", ...levelFilter },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { subject: true, classLevel: true },
    }),
    db.resource.findMany({
      where: { reviewStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { subject: true, classLevel: true },
    }),
    db.savedResource.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { resource: { include: { subject: true, classLevel: true } } },
    }),
    db.savedResource.count({ where: { userId: profile.id } }),
    db.viewLog.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { resource: { include: { subject: true, classLevel: true } } },
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Welcome{profile.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋
        </h1>

        <section className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold text-zinc-900">My teaching</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Levels: {levels.length > 0 ? levels.join(", ") : "—"} · Subjects:{" "}
            {profile.subjects.length > 0 ? profile.subjects.join(", ") : "—"}
            {profile.school ? ` · ${profile.school}` : ""}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Recommended for you</h2>
          {recommended.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No recommendations yet — check back soon.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {recommended.map((r) => (
                <ResourceCard key={r.id} resource={toCard(r)} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Continue learning</h2>
          {continueLearning.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              Resources you open will show up here for quick access.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {continueLearning.map((v) => (
                <ResourceCard key={v.id} resource={toCard(v.resource)} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Recently added</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {recent.map((r) => (
              <ResourceCard key={r.id} resource={toCard(r)} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Saved resources ({savedCount})</h2>
          {saved.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nothing saved yet.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {saved.map((s) => (
                <ResourceCard key={s.resource.id} resource={toCard(s.resource)} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
