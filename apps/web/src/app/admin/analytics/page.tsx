import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-32 rounded-full bg-zinc-100">
      <div className="h-2 rounded-full bg-amber-700" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

/** Analytics for education organizations (PRD §33 + Phase 3): usage at a glance. */
export default async function AnalyticsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!isStaff(viewer)) redirect("/dashboard");

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    teachers,
    resourcesByStatus,
    searchesTotal,
    searchesWeek,
    viewsTotal,
    downloadsTotal,
    savesTotal,
    feedbackTotal,
    problemFlags,
    topSearches,
    topViewed,
    recentUsers,
    attentionFeedback,
  ] = await Promise.all([
    db.user.count({ where: { role: "TEACHER" } }),
    db.resource.groupBy({ by: ["reviewStatus"], _count: { reviewStatus: true } }),
    db.searchLog.count(),
    db.searchLog.count({ where: { createdAt: { gte: since } } }),
    db.viewLog.count(),
    db.downloadLog.count(),
    db.savedResource.count(),
    db.feedback.count(),
    db.feedback.count({ where: { kind: { in: ["INCORRECT", "OUTDATED", "INAPPROPRIATE"] } } }),
    db.searchLog.groupBy({ by: ["query"], _count: { query: true }, orderBy: { _count: { query: "desc" } }, take: 10 }),
    db.viewLog.groupBy({ by: ["resourceId"], _count: { resourceId: true }, orderBy: { _count: { resourceId: "desc" } }, take: 8 }),
    db.user.findMany({ where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } }, select: { createdAt: true } }),
    db.feedback.findMany({
      where: { kind: { in: ["INCORRECT", "OUTDATED", "INAPPROPRIATE"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { resource: { select: { id: true, title: true } }, user: { select: { name: true } } },
    }),
  ]);

  const topViewedIds = topViewed.map((v) => v.resourceId);
  const topResources = topViewedIds.length
    ? await db.resource.findMany({ where: { id: { in: topViewedIds } }, select: { id: true, title: true } })
    : [];
  const titleOf = new Map(topResources.map((r) => [r.id, r.title]));
  const maxViews = topViewed[0]?._count.resourceId ?? 1;
  const maxSearch = topSearches[0]?._count.query ?? 1;

  const signupsByDay = new Map<string, number>();
  for (const u of recentUsers) {
    const day = u.createdAt.toISOString().slice(0, 10);
    signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1);
  }
  const signupDays = [...signupsByDay.entries()].sort().slice(-14);
  const maxSignups = Math.max(1, ...signupDays.map(([, n]) => n));

  const kpis: Array<[string, number | string]> = [
    ["Teachers", teachers],
    ["Searches (7d / total)", `${searchesWeek} / ${searchesTotal}`],
    ["Resource views", viewsTotal],
    ["Downloads", downloadsTotal],
    ["Saves", savesTotal],
    ["Feedback signals", feedbackTotal],
    ["Problem flags", problemFlags],
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-600">Whether teachers are finding and using resources.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {kpis.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              <p className="text-sm text-zinc-600">{label}</p>
            </div>
          ))}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-600">Resources by status</p>
            <ul className="mt-1 text-sm">
              {resourcesByStatus.map((r) => (
                <li key={r.reviewStatus}>{r.reviewStatus.replace(/_/g, " ")}: <strong>{r._count.reviewStatus}</strong></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="font-semibold text-zinc-900">Top searches</h2>
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {topSearches.map((s) => (
                <li key={s.query} className="flex items-center justify-between gap-2">
                  <span className="truncate">“{s.query}” · {s._count.query}</span>
                  <Bar pct={(s._count.query / maxSearch) * 100} />
                </li>
              ))}
              {topSearches.length === 0 && <li className="text-zinc-500">No searches yet.</li>}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="font-semibold text-zinc-900">Most viewed resources</h2>
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {topViewed.map((v) => (
                <li key={v.resourceId} className="flex items-center justify-between gap-2">
                  <Link href={`/resources/${v.resourceId}`} className="truncate text-amber-900 hover:underline">
                    {titleOf.get(v.resourceId) ?? v.resourceId} · {v._count.resourceId}
                  </Link>
                  <Bar pct={(v._count.resourceId / maxViews) * 100} />
                </li>
              ))}
              {topViewed.length === 0 && <li className="text-zinc-500">No views yet.</li>}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="font-semibold text-zinc-900">New teachers (14 days)</h2>
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {signupDays.map(([day, n]) => (
                <li key={day} className="flex items-center justify-between gap-2">
                  <span>{day} · {n}</span>
                  <Bar pct={(n / maxSignups) * 100} />
                </li>
              ))}
              {signupDays.length === 0 && <li className="text-zinc-500">No signups in range.</li>}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="font-semibold text-zinc-900">Feedback needing attention</h2>
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {attentionFeedback.map((f) => (
                <li key={f.id}>
                  <Link href={`/resources/${f.resource.id}`} className="text-amber-900 hover:underline">
                    {f.resource.title}
                  </Link>{" "}
                  <span className="text-zinc-500">— {f.kind.toLowerCase().replace(/_/g, " ")} by {f.user.name}</span>
                </li>
              ))}
              {attentionFeedback.length === 0 && <li className="text-zinc-500">Nothing flagged.</li>}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
