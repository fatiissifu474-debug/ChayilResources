import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { canDownloadResource } from "@/lib/access";
import { SiteHeader } from "@/components/SiteHeader";
import { ResourceCard } from "@/components/ResourceCard";
import { SaveButton } from "@/components/SaveButton";
import { CollectionAdder } from "@/components/CollectionAdder";
import { AdminFileUpload } from "@/components/AdminFileUpload";
import { FeedbackWidget } from "@/components/FeedbackWidget";

const BADGE_STYLES: Record<string, string> = {
  REVIEWED: "bg-green-100 text-green-800",
  CURRICULUM_ALIGNED: "bg-blue-100 text-blue-800",
  CONTRIBUTOR: "bg-purple-100 text-purple-800",
  RECOMMENDED: "bg-amber-100 text-amber-800",
};

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getViewer();
  const staff = isStaff(viewer);

  const resource = await db.resource.findUnique({
    where: { id },
    include: {
      subject: true,
      classLevel: true,
      topics: { include: { topic: true } },
    },
  });
  if (!resource) notFound();
  // Drafts stay invisible to teachers; reviewers/admins can preview them.
  if (resource.reviewStatus !== "APPROVED" && !staff) notFound();

  await db.viewLog
    .create({ data: { resourceId: id, userId: viewer?.id } })
    .catch(() => {});

  const mayDownload = await canDownloadResource(viewer, resource.access);

  const [feedbackRows, savedEntry, related] = await Promise.all([
    db.feedback.groupBy({
      by: ["kind"],
      where: { resourceId: id },
      _count: { kind: true },
    }),
    viewer
      ? db.savedResource.findUnique({
          where: { userId_resourceId: { userId: viewer.id, resourceId: id } },
        })
      : Promise.resolve(null),
    db.resource.findMany({
      where: resource.subjectId
        ? { reviewStatus: "APPROVED", id: { not: id }, subjectId: resource.subjectId }
        : { reviewStatus: "APPROVED", id: { not: id }, level: resource.level },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { subject: true, classLevel: true },
    }),
  ]);

  const counts: Record<string, number> = Object.fromEntries(
    feedbackRows.map((r) => [r.kind, r._count.kind]),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/browse" className="underline">Browse</Link>
          {resource.classLevel && <> → {resource.classLevel.name}</>}
          {resource.subject && <> → {resource.subject.name}</>}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {resource.badges.map((b) => (
            <span
              key={b}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[b] ?? "bg-zinc-100 text-zinc-700"}`}
            >
              {b.replace(/_/g, " ")}
            </span>
          ))}
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
            {resource.reviewStatus.replace(/_/g, " ")}
          </span>
          {resource.access === "PREMIUM" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              PREMIUM
            </span>
          )}
        </div>

        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{resource.title}</h1>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
          <div><dt className="text-zinc-500">Level</dt><dd className="font-medium">{resource.level}</dd></div>
          <div><dt className="text-zinc-500">Class</dt><dd className="font-medium">{resource.classLevel?.name ?? "—"}</dd></div>
          <div><dt className="text-zinc-500">Subject</dt><dd className="font-medium">{resource.subject?.name ?? "—"}</dd></div>
          <div><dt className="text-zinc-500">Type</dt><dd className="font-medium">{resource.type.replace(/_/g, " ")}</dd></div>
          <div><dt className="text-zinc-500">Topic</dt><dd className="font-medium">{resource.topics.length > 0 ? resource.topics.map((t) => t.topic.name).join(", ") : "—"}</dd></div>
          <div><dt className="text-zinc-500">Pages / length</dt><dd className="font-medium">{resource.pages ?? "—"}</dd></div>
          <div><dt className="text-zinc-500">Author / publisher</dt><dd className="font-medium">{[resource.author, resource.publisher].filter(Boolean).join(" · ") || "—"}</dd></div>
          <div><dt className="text-zinc-500">Edition / date</dt><dd className="font-medium">{resource.edition ?? "—"}</dd></div>
          <div><dt className="text-zinc-500">Copyright</dt><dd className="font-medium">{resource.copyrightHolder}</dd></div>
          <div><dt className="text-zinc-500">Permitted use</dt><dd className="font-medium">{resource.permittedUse}</dd></div>
        </dl>

        <p className="mt-4 text-zinc-700">{resource.description}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <SaveButton resourceId={id} initialSaved={!!savedEntry} authed={!!viewer} />
          {resource.fileKey ? (
            mayDownload ? (
              <a
                href={`/api/resources/${id}/download`}
                className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700"
              >
                ⬇ Download
              </a>
            ) : (
              <span
                className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2 text-sm text-amber-800"
                title="Download requires Premium or institutional access"
              >
                🔒 Premium — preview only
              </span>
            )
          ) : (
            <span className="rounded-full border border-dashed border-zinc-300 px-5 py-2 text-sm text-zinc-500">
              File coming soon
            </span>
          )}
        </div>

        <div className="mt-4">
          <CollectionAdder resourceId={id} authed={!!viewer} />
        </div>

        {staff && (
          <div className="mt-4">
            <AdminFileUpload resourceId={id} hasFile={!!resource.fileKey} />
          </div>
        )}

        <section className="mt-8 border-t border-zinc-200 pt-6">
          <h2 className="font-semibold text-zinc-900">Teacher feedback</h2>
          <div className="mt-2">
            <FeedbackWidget resourceId={id} counts={counts} authed={!!viewer} />
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-8 border-t border-zinc-200 pt-6">
            <h2 className="font-semibold text-zinc-900">Related resources</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
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
          </section>
        )}
      </main>
    </>
  );
}
