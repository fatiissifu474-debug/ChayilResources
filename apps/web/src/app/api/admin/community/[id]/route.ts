import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { logStaffAction } from "@/lib/audit";

interface Params {
  params: Promise<{ id: string }>;
}

/** Staff moderation: PATCH { hidden } or DELETE a community post. */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { hidden?: unknown };
  if (typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "hidden must be a boolean" }, { status: 400 });
  }
  const post = await db.discussionPost.update({
    where: { id },
    data: { hidden: body.hidden, flagged: false },
    select: { id: true, hidden: true },
  }).catch(() => null);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logStaffAction(viewer.id, body.hidden ? "post.hide" : "post.unhide", "post", id);
  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.discussionPost.delete({ where: { id } }).catch(() => null);
  await logStaffAction(viewer.id, "post.delete", "post", id);
  return NextResponse.json({ ok: true });
}
