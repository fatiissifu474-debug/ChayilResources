import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { CollectionManager, type ManagerCollection } from "@/components/CollectionManager";
import { InstitutionJoin } from "@/components/InstitutionJoin";

/** My Resources — saved, collections, downloads, recently viewed. */
export default async function MyResourcesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const [saved, collections, downloads, submissions, views] = await Promise.all([
    db.savedResource.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "desc" },
      include: { resource: { include: { subject: true, classLevel: true } } },
    }),
    db.collection.findMany({
      where: { userId: viewer.id },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          include: { resource: { include: { subject: true, classLevel: true } } },
        },
      },
    }),
    db.downloadLog.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { resource: { include: { subject: true, classLevel: true } } },
    }),
    db.resource.findMany({
      where: { submittedById: viewer.id },
      orderBy: { createdAt: "desc" },
      include: { subject: true, classLevel: true },
    }),
    db.viewLog.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { resource: { include: { subject: true, classLevel: true } } },
    }),
  ]);

  const managerData: ManagerCollection[] = collections.map((c) => ({
    id: c.id,
    name: c.name,
    items: c.items.map((i) => ({
      resourceId: i.resource.id,
      title: i.resource.title,
      subjectName: i.resource.subject?.name ?? null,
      className: i.resource.classLevel?.name ?? null,
    })),
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">My resources</h1>
        <div className="mt-4">
          <InstitutionJoin />
        </div>

        <section className="mt-6">
          <h2 className="font-semibold text-zinc-900">Collections ({collections.length})</h2>
          <div className="mt-2">
            <CollectionManager initial={managerData} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">My contributions ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              Nothing submitted yet.{" "}
              <Link href="/contribute" className="font-medium text-emerald-700 underline">
                Contribute a resource
              </Link>
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {submissions.map((s) => (
                <li key={s.id} className="text-sm">
                  <Link href={`/resources/${s.id}`} className="text-emerald-900 hover:underline">
                    {s.title}
                  </Link>{" "}
                  <span className="text-zinc-500">— {s.reviewStatus.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Saved ({saved.length})</h2>
          {saved.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nothing saved yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {saved.map((s) => (
                <li key={s.resource.id} className="text-sm">
                  <Link href={`/resources/${s.resource.id}`} className="text-emerald-900 hover:underline">
                    {s.resource.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Recent downloads</h2>
          {downloads.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No downloads yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {downloads.map((d) => (
                <li key={d.id} className="text-sm">
                  <Link href={`/resources/${d.resource.id}`} className="text-emerald-900 hover:underline">
                    {d.resource.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-zinc-900">Recently viewed</h2>
          {views.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nothing viewed yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {views.map((v) => (
                <li key={v.id} className="text-sm">
                  <Link href={`/resources/${v.resource.id}`} className="text-emerald-900 hover:underline">
                    {v.resource.title}
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
