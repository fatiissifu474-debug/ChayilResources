import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { PublisherUpgrade } from "@/components/PublisherUpgrade";

/** Publisher portal (PRD §17): submit with attribution, track review status. */
export default async function PublisherPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const profile = await db.user.findUniqueOrThrow({ where: { id: viewer.id } });
  const staff = isStaff(viewer);

  if (profile.role !== "PUBLISHER" && !staff) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-bold text-zinc-900">Publisher portal</h1>
          <p className="mt-2 text-sm text-zinc-600">
            For publishers, NGOs and education organizations contributing approved resources.
          </p>
          <PublisherUpgrade />
        </main>
      </>
    );
  }

  const [submissions, counts] = await Promise.all([
    db.resource.findMany({
      where: staff ? {} : { submittedById: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { subject: true, classLevel: true, submittedBy: { select: { name: true, organization: true } } },
    }),
    db.resource.groupBy({
      by: ["reviewStatus"],
      where: staff ? {} : { submittedById: viewer.id },
      _count: { reviewStatus: true },
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Publisher portal</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {profile.organization ? `${profile.organization} · ` : ""}
          {counts.map((c) => `${c._count.reviewStatus} ${c.reviewStatus.replace(/_/g, " ").toLowerCase()}`).join(" · ") || "No submissions yet."}
        </p>
        <div className="mt-4">
          <Link href="/contribute" className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white">
            Submit a resource
          </Link>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm">
              <Link href={`/resources/${s.id}`} className="font-medium text-emerald-900 hover:underline">
                {s.title}
              </Link>{" "}
              <span className="text-zinc-500">
                — {s.reviewStatus.replace(/_/g, " ")}
                {s.submittedBy?.organization ? ` · ${s.submittedBy.organization}` : ""}
              </span>
            </div>
          ))}
          {submissions.length === 0 && (
            <p className="text-sm text-zinc-500">Nothing submitted yet.</p>
          )}
        </div>
      </main>
    </>
  );
}
