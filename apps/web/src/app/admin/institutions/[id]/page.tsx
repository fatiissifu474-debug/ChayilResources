import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";

/** Institution-wide view: members and their platform activity. */
export default async function InstitutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!isStaff(viewer)) redirect("/dashboard");

  const institution = await db.institution.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });
  if (!institution) redirect("/admin");

  const memberIds = institution.members.map((m) => m.user.id);
  const [savedCounts, downloadCounts, submissionCounts] = await Promise.all([
    db.savedResource.groupBy({ by: ["userId"], where: { userId: { in: memberIds } }, _count: { userId: true } }),
    db.downloadLog.groupBy({ by: ["userId"], where: { userId: { in: memberIds } }, _count: { userId: true } }),
    db.resource.groupBy({ by: ["submittedById"], where: { submittedById: { in: memberIds } }, _count: { submittedById: true } }),
  ]);
  const savedOf = new Map(savedCounts.map((r) => [r.userId, r._count.userId]));
  const dlOf = new Map(downloadCounts.map((r) => [r.userId, r._count.userId]));
  const subOf = new Map(submissionCounts.map((r) => [r.submittedById, r._count.submittedById]));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/admin" className="underline">Admin</Link> → Institutions
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{institution.name}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Join code: <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono">{institution.code}</code> ·{" "}
          {institution.active ? "Active" : "Inactive"} · {institution.members.length} members
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="px-4 py-2">Teacher</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Saved</th>
                <th className="px-4 py-2">Downloads</th>
                <th className="px-4 py-2">Submissions</th>
              </tr>
            </thead>
            <tbody>
              {institution.members.map((m) => (
                <tr key={m.user.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2">{m.user.name} <span className="text-zinc-400">({m.user.email})</span></td>
                  <td className="px-4 py-2">{m.user.role}</td>
                  <td className="px-4 py-2">{savedOf.get(m.user.id) ?? 0}</td>
                  <td className="px-4 py-2">{dlOf.get(m.user.id) ?? 0}</td>
                  <td className="px-4 py-2">{subOf.get(m.user.id) ?? 0}</td>
                </tr>
              ))}
              {institution.members.length === 0 && (
                <tr><td className="px-4 py-2 text-zinc-500">No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
