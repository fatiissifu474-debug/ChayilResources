import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { interpretSearch, type SearchInterpretation } from "@/lib/ai";
import { SiteHeader } from "@/components/SiteHeader";
import { ResourceCard } from "@/components/ResourceCard";
import { EducationLevel, ResourceType } from "@prisma/client";

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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const query = q?.trim() ?? "";
  const validType =
    type && (Object.values(ResourceType) as string[]).includes(type)
      ? (type as ResourceType)
      : null;

  let results: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    level: string;
    badges: string[];
    subject: { name: string } | null;
    classLevel: { name: string } | null;
  }> = [];

  let understood: SearchInterpretation | null = null;
  let relaxed = false;

  if (query.length > 0) {
    // Smarter search: let AI split "JHS 2 fractions lesson plan" into filters.
    // Falls back to plain keyword search when AI is unavailable or too strict.
    try {
      const [classNames, subjectNames] = await Promise.all([
        db.classLevel.findMany({ select: { name: true } }),
        db.subject.findMany({ select: { name: true } }),
      ]);
      understood = await interpretSearch(query, {
        levels: Object.values(EducationLevel) as string[],
        classes: classNames.map((c) => c.name),
        subjects: [...new Set(subjectNames.map((s) => s.name))],
        types: Object.values(ResourceType) as string[],
      });
    } catch {
      understood = null;
    }

    const runSearch = (useAi: boolean) =>
      db.resource.findMany({
        where: {
          reviewStatus: "APPROVED",
          ...(validType ? { type: validType } : {}),
          ...(useAi && understood
            ? {
                ...(understood.levels.length > 0 ? { level: { in: understood.levels } } : {}),
                ...(understood.types.length > 0 && !validType ? { type: { in: understood.types } } : {}),
                ...(understood.subjects.length > 0
                  ? { subject: { name: { in: understood.subjects } } }
                  : {}),
                ...(understood.classes.length > 0
                  ? { classLevel: { name: { in: understood.classes } } }
                  : {}),
                ...(understood.topics.length > 0
                  ? {
                      topics: {
                        some: {
                          topic: { name: { in: understood.topics, mode: "insensitive" } },
                        },
                      },
                    }
                  : {}),
                ...(understood.keywords.length > 0
                  ? {
                      OR: understood.keywords.flatMap((k) => [
                        { title: { contains: k, mode: "insensitive" } },
                        { description: { contains: k, mode: "insensitive" } },
                      ]),
                    }
                  : {}),
              }
            : {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              }),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { subject: true, classLevel: true },
      });

    results = await runSearch(true);
    if (results.length === 0 && understood && understood.keywords.length > 0) {
      // No exact matches: broaden to the AI keywords instead of the raw phrase.
      relaxed = true;
      results = await db.resource.findMany({
        where: {
          reviewStatus: "APPROVED",
          ...(validType ? { type: validType } : {}),
          OR: understood.keywords.flatMap((k) => [
            { title: { contains: k, mode: "insensitive" } },
            { description: { contains: k, mode: "insensitive" } },
          ]),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { subject: true, classLevel: true },
      });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    await db.searchLog
      .create({ data: { query, userId: session?.user?.id } })
      .catch(() => {});
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Search resources</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Try “JHS 2 fractions lesson plan” or “SHS Biology photosynthesis”.
        </p>
        <form method="get" action="/search" className="mt-4 flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by class, subject, topic…"
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <select name="type" defaultValue={validType ?? ""} className="rounded-md border border-zinc-300 px-3 py-2">
            <option value="">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-amber-800 px-5 py-2 font-medium text-white"
          >
            Search
          </button>
        </form>

        {query.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-zinc-600">
              {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
              {validType && <> · {validType.replace(/_/g, " ")}</>}
            </p>
            {understood && (
              <p className="mt-1 text-xs text-zinc-500">
                ✨ Understood as:{" "}
                {[
                  ...understood.levels,
                  ...understood.classes,
                  ...understood.subjects,
                  ...understood.types.map((t) => t.replace(/_/g, " ")),
                  ...understood.keywords.map((k) => `“${k}”`),
                ].join(" · ") || "general search"}
              </p>
            )}
            {relaxed && (
              <p className="mt-1 text-xs text-zinc-500">
                No exact matches — showing broader keyword results.
              </p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {results.map((r) => (
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
          </div>
        )}
      </main>
    </>
  );
}
