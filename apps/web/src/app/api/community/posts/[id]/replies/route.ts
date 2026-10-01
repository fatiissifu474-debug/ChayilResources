import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { rateLimit, clientKey, limitedResponse } from "@/lib/ratelimit";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/community/posts/[id]/replies { body } — reply to a visible post. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  if (!rateLimit(clientKey(req, "community-reply"), 10)) return limitedResponse();
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await db.discussionPost.findUnique({
    where: { id },
    select: { id: true, hidden: true },
  });
  if (!post || post.hidden) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { body?: unknown };
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 });

  const reply = await db.discussionReply.create({
    data: { postId: id, authorId: viewer.id, body: text.slice(0, 2000) },
    select: { id: true },
  });
  return NextResponse.json({ reply }, { status: 201 });
}
