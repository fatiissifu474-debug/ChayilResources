import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { ResourceCard } from "@/components/ResourceCard";
import { EducationLevel, ResourceType } from "@prisma/client";

const ASSESSMENT_TYPES: ResourceType[] = ["ASSESSMENT", "QUIZ", "EXAM_PREP"];

const LEVEL_LABELS: Record<EducationLevel, string> = {
  PRIMARY: "Primary",
  JHS: "JHS",
  SHS: "SHS",
  TVET: "TVET",
};

/** Assessment Resource Centre (PRD §19): quizzes, class exercises and exam prep by class. */
export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; classId?: string }>;
}) {
  const { level, classId } = await searchParams;
  const validLevel =
    level && (Object.values(EducationLevel) as string[]).includes(level)
      ? (level as EducationLevel)
      : null;

  if (!validLevel) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="text-2xl font-bold text-zinc-900">Assessment Resource Centre</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Class exercises, quizzes, revision and exam-style questions — choose a level.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.values(EducationLevel) as EducationLevel[]).map((l) => (
              <Link
                key={l}
                href={`/assessments?level=${l}`}
                className="rounded-lg border border-zinc-200 bg-white p-6 text-lg font-semibold text-emerald-900 hover:border-emerald-700"
              >
                {LEVEL_LABELS[l]}
              </Link>
            ))}
          </div>
        </main>
      </>
    );
  }

  const classes = await db.classLevel.findMany({
    where: { level: validLevel },
    orderBy: { position: "asc" },
  });
  const selectedClass = classId
    ? await db.classLevel.findFirst({ where: { id: classId, level: validLevel } })
    : null;

  const resources = selectedClass
    ? await db.resource.findMany({
        where: {
          reviewStatus: "APPROVED",
          classLevelId: selectedClass.id,
          type: { in: ASSESSMENT_TYPES },
        },
        orderBy: { createdAt: "desc" },
        include: { subject: true, classLevel: true },
      })
    : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/assessments" className="underline">Assessment Centre</Link> → {LEVEL_LABELS[validLevel]}
          {selectedClass && <> → {selectedClass.name}</>}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">
          {selectedClass ? `${selectedClass.name} assessments` : `${LEVEL_LABELS[validLevel]} — choose a class`}
        </h1>

        {!selectedClass && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/assessments?level=${validLevel}&classId=${c.id}`}
                className="rounded-lg border border-zinc-200 bg-white p-4 font-medium text-emerald-900 hover:border-emerald-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {selectedClass && (
          <div className="mt-4">
            {resources.length === 0 ? (
              <p className="text-sm text-zinc-500">No assessments here yet — check back soon.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {resources.map((r) => (
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
          </div>
        )}
      </main>
    </>
  );
}
