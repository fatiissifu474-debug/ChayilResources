import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/SiteHeader";
import { ResourceCard } from "@/components/ResourceCard";
import { EducationLevel, ResourceType } from "@prisma/client";

interface BrowseParams {
  level?: string;
  classId?: string;
  subjectId?: string;
  type?: string;
}

const LEVEL_LABELS: Record<EducationLevel, string> = {
  PRIMARY: "Primary",
  JHS: "JHS",
  SHS: "SHS",
  TVET: "TVET",
};

// Curated subset for the assessment-centre basics (full list lives in the schema enum).
const TYPE_OPTIONS: ResourceType[] = [
  "LESSON_PLAN",
  "WORKSHEET",
  "ASSESSMENT",
  "QUIZ",
  "EXAM_PREP",
  "TEXTBOOK",
  "TEACHER_GUIDE",
  "VIDEO",
];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<BrowseParams>;
}) {
  const { level, classId, subjectId, type } = await searchParams;
  const validLevel =
    level && (Object.values(EducationLevel) as string[]).includes(level)
      ? (level as EducationLevel)
      : null;
  const validType =
    type && (Object.values(ResourceType) as string[]).includes(type)
      ? (type as ResourceType)
      : null;

  // Step 1: pick a level
  if (!validLevel) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="text-2xl font-bold text-zinc-900">Browse by level</h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.values(EducationLevel) as EducationLevel[]).map((l) => (
              <Link
                key={l}
                href={`/browse?level=${l}`}
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

  const [classes, selectedClass, selectedSubject] = await Promise.all([
    db.classLevel.findMany({
      where: { level: validLevel },
      orderBy: { position: "asc" },
    }),
    classId
      ? db.classLevel.findFirst({ where: { id: classId, level: validLevel } })
      : Promise.resolve(null),
    subjectId
      ? db.subject.findFirst({ where: { id: subjectId, level: validLevel } })
      : Promise.resolve(null),
  ]);

  const subjects = selectedClass
    ? await db.subject.findMany({
        where: { level: validLevel, classLevels: { some: { id: selectedClass.id } } },
        orderBy: { name: "asc" },
      })
    : await db.subject.findMany({
        where: { level: validLevel },
        orderBy: { name: "asc" },
      });

  const resources =
    selectedClass && selectedSubject
      ? await db.resource.findMany({
          where: {
            reviewStatus: "APPROVED",
            classLevelId: selectedClass.id,
            subjectId: selectedSubject.id,
            ...(validType ? { type: validType } : {}),
          },
          orderBy: { createdAt: "desc" },
          include: { subject: true, classLevel: true },
        })
      : [];

  const qs = (extra: Record<string, string>) =>
    `/browse?level=${validLevel}` +
    Object.entries(extra)
      .map(([k, v]) => `&${k}=${v}`)
      .join("");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/browse" className="underline">Levels</Link> → {LEVEL_LABELS[validLevel]}
          {selectedClass && <> → {selectedClass.name}</>}
          {selectedSubject && <> → {selectedSubject.name}</>}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">
          {selectedSubject
            ? `${selectedClass?.name} · ${selectedSubject.name}`
            : selectedClass
              ? `${selectedClass.name} — choose a subject`
              : `${LEVEL_LABELS[validLevel]} — choose a class`}
        </h1>

        {!selectedClass && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={qs({ classId: c.id })}
                className="rounded-lg border border-zinc-200 bg-white p-4 font-medium text-emerald-900 hover:border-emerald-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {selectedClass && !selectedSubject && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={qs({ classId: selectedClass.id, subjectId: s.id })}
                className="rounded-lg border border-zinc-200 bg-white p-4 font-medium text-emerald-900 hover:border-emerald-700"
              >
                {s.name}
              </Link>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-zinc-500">No subjects listed for this class yet.</p>
            )}
          </div>
        )}

        {selectedClass && selectedSubject && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Link
                href={qs({ classId: selectedClass.id, subjectId: selectedSubject.id })}
                className={`rounded-full border px-3 py-1.5 text-sm ${!validType ? "border-emerald-800 bg-emerald-50 text-emerald-900" : "border-zinc-300 text-zinc-700"}`}
              >
                All types
              </Link>
              {TYPE_OPTIONS.map((t) => (
                <Link
                  key={t}
                  href={qs({ classId: selectedClass.id, subjectId: selectedSubject.id, type: t })}
                  className={`rounded-full border px-3 py-1.5 text-sm ${validType === t ? "border-emerald-800 bg-emerald-50 text-emerald-900" : "border-zinc-300 text-zinc-700"}`}
                >
                  {t.replace(/_/g, " ")}
                </Link>
              ))}
            </div>
            {resources.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No approved resources here yet — check back soon.
              </p>
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
