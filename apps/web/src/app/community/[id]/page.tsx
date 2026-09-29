import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { ReplyForm, ReportButton } from "@/components/CommunityForms";

export default async function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();

  const post = await db.discussionPost.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      replies: {
        where: { hidden: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!post || post.hidden) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-sm text-zinc-500">
          <Link href="/community" className="underline">Community</Link>
          {post.tag && <> → {post.tag}</>}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{post.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">by {post.author.name}</p>
        <p className="mt-3 whitespace-pre-line text-zinc-700">{post.body}</p>
        <div className="mt-2">
          <ReportButton postId={post.id} />
        </div>

        <section className="mt-8 border-t border-zinc-200 pt-6">
          <h2 className="font-semibold text-zinc-900">
            Replies ({post.replies.length})
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {post.replies.map((r) => (
              <div key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <p className="whitespace-pre-line text-sm text-zinc-700">{r.body}</p>
                <p className="mt-1 text-xs text-zinc-500">— {r.author.name}</p>
              </div>
            ))}
            {post.replies.length === 0 && (
              <p className="text-sm text-zinc-500">No replies yet.</p>
            )}
          </div>
          {viewer ? (
            <ReplyForm postId={post.id} />
          ) : (
            <p className="mt-4 text-sm text-zinc-600">
              <Link href="/login" className="font-medium text-amber-700 underline">Log in</Link>{" "}
              to reply.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
