import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

/** GET — visible posts with authors + reply counts. POST — new post (teachers). */
export async function GET() {
  const posts = await db.discussionPost.findMany({
    where: { hidden: false },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { name: true } },
      _count: { select: { replies: true } },
    },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const postBody = typeof body.body === "string" ? body.body.trim() : "";
  const tag = typeof body.tag === "string" && body.tag.trim() ? body.tag.trim().slice(0, 60) : null;
  if (!title || !postBody) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const post = await db.discussionPost.create({
    data: {
      authorId: viewer.id,
      title: title.slice(0, 150),
      body: postBody.slice(0, 3000),
      tag,
    },
    select: { id: true },
  });
  return NextResponse.json({ post }, { status: 201 });
}
