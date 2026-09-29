import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { NewPostForm } from "@/components/CommunityForms";

/** Teacher community (PRD §24): moderated, professional discussion. */
export default async function CommunityPage() {
  const viewer = await getViewer();

  const posts = await db.discussionPost.findMany({
    where: { hidden: false },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { name: true } },
      _count: { select: { replies: true } },
    },
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Teacher community</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Teaching ideas, classroom challenges, resource recommendations — moderated for
          professional learning, not a general social feed.
        </p>

        {viewer ? (
          <NewPostForm />
        ) : (
          <p className="mt-4 text-sm text-zinc-600">
            <Link href="/login" className="font-medium text-amber-700 underline">Log in</Link>{" "}
            to join the discussion.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {posts.length === 0 && (
            <p className="text-sm text-zinc-500">No discussions yet — start the first one.</p>
          )}
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/community/${p.id}`}
              className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-amber-700"
            >
              <p className="font-semibold text-zinc-900">{p.title}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {p.author.name}
                {p.tag ? ` · ${p.tag}` : ""} · {p._count.replies} repl{p._count.replies === 1 ? "y" : "ies"}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
