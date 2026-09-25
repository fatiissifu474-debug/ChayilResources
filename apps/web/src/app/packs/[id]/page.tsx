import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { ResourceCard } from "@/components/ResourceCard";
import { PackSaveAll } from "@/components/PackSaveAll";
import { ResourceType } from "@prisma/client";

const SLOTS: Array<{ title: string; hint: string; types: ResourceType[] }> = [
  {
    title: "1 · Learn",
    hint: "Textbook and reading material",
    types: ["TEXTBOOK", "READING_MATERIAL", "PRESENTATION", "VIDEO", "DIAGRAM"],
  },
  {
    title: "2 · Plan",
    hint: "Guides and lesson plans",
    types: ["TEACHER_GUIDE", "LESSON_PLAN", "SCHEME_OF_LEARNING", "TEACHING_STRATEGY"],
  },
  {
    title: "3 · Practice",
    hint: "Activities and worksheets",
    types: ["CLASSROOM_ACTIVITY", "PRACTICAL_ACTIVITY", "WORKSHEET", "PROJECT_IDEA", "POSTER"],
  },
  {
    title: "4 · Check",
    hint: "Assessment and revision",
    types: ["ASSESSMENT", "QUIZ", "EXAM_PREP", "REVISION_MATERIAL"],
  },
];

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  const staff = isStaff(viewer);

  const pack = await db.pack.findUnique({
    where: { id },
    include: {
      subject: true,
      classLevel: true,
      items: {
        orderBy: { position: "asc" },
        include: { resource: { include: { subject: true, classLevel: true } } },
      },
    },
  });
  if (!pack) notFound();
  if (pack.reviewStatus !== "APPROVED" && !staff) notFound();

  const approvedItems = pack.items.filter((i) => staff || i.resource.reviewStatus === "APPROVED");
  const used = new Set<string>();
  const slots = SLOTS.map((slot) => ({
    ...slot,
    items: approvedItems.filter((i) => {
      if (used.has(i.resource.id)) return false;
      if (!slot.types.includes(i.resource.type)) return false;
      used.add(i.resource.id);
      return true;
    }),
  }));
  const leftover = approvedItems.filter((i) => !used.has(i.resource.id));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/packs" className="underline">Packs</Link>
          {pack.classLevel && <> → {pack.classLevel.name}</>}
          {pack.subject && <> → {pack.subject.name}</>}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{pack.title}</h1>
        <p className="mt-2 text-zinc-700">{pack.description}</p>
        {pack.objectives && (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-900">Learning objectives</h2>
            <p className="mt-1 text-sm text-zinc-700">{pack.objectives}</p>
          </div>
        )}

        <PackSaveAll packId={pack.id} authed={!!viewer} itemCount={approvedItems.length} />

        {slots.map((slot) => (
          <section key={slot.title} className="mt-8">
            <h2 className="font-semibold text-zinc-900">
              {slot.title} <span className="font-normal text-zinc-500">— {slot.hint}</span>
            </h2>
            {slot.items.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">Nothing in this section yet.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {slot.items.map((i) => (
                  <ResourceCard
                    key={i.resource.id}
                    resource={{
                      id: i.resource.id,
                      title: i.resource.title,
                      description: i.resource.description,
                      type: i.resource.type,
                      level: i.resource.level,
                      badges: i.resource.badges,
                      subjectName: i.resource.subject?.name ?? null,
                      className: i.resource.classLevel?.name ?? null,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {leftover.length > 0 && (
          <section className="mt-8">
            <h2 className="font-semibold text-zinc-900">More resources</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {leftover.map((i) => (
                <ResourceCard
                  key={i.resource.id}
                  resource={{
                    id: i.resource.id,
                    title: i.resource.title,
                    description: i.resource.description,
                    type: i.resource.type,
                    level: i.resource.level,
                    badges: i.resource.badges,
                    subjectName: i.resource.subject?.name ?? null,
                    className: i.resource.classLevel?.name ?? null,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
