import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { FeedbackKind } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/resources/[id]/feedback — { kind, comment? }. One signal per kind per teacher. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resource = await db.resource.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { kind?: unknown; comment?: unknown };
  if (typeof body.kind !== "string" || !(Object.values(FeedbackKind) as string[]).includes(body.kind)) {
    return NextResponse.json({ error: "Invalid feedback kind" }, { status: 400 });
  }
  const comment =
    typeof body.comment === "string" && body.comment.trim().length > 0
      ? body.comment.trim().slice(0, 1000)
      : null;

  await db.feedback.upsert({
    where: {
      resourceId_userId_kind: { resourceId: id, userId: viewer.id, kind: body.kind as FeedbackKind },
    },
    update: { comment },
    create: { resourceId: id, userId: viewer.id, kind: body.kind as FeedbackKind, comment },
  });

  return NextResponse.json({ ok: true });
}
