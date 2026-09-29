import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/community/posts/[id]/report — flag for moderator review. */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await db.discussionPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.discussionPost.update({ where: { id }, data: { flagged: true } });
  return NextResponse.json({ ok: true });
}
