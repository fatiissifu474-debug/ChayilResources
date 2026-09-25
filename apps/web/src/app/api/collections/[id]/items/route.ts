import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

interface Params {
  params: Promise<{ id: string }>;
}

async function ownedCollection(collectionId: string, userId: string) {
  return db.collection.findFirst({ where: { id: collectionId, userId } });
}

/** POST /api/collections/[id]/items { resourceId } — add (idempotent). */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await ownedCollection(id, viewer.id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { resourceId?: unknown };
  if (typeof body.resourceId !== "string" || !body.resourceId) {
    return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
  }
  const resource = await db.resource.findUnique({
    where: { id: body.resourceId },
    select: { id: true },
  });
  if (!resource) return NextResponse.json({ error: "Unknown resource" }, { status: 400 });

  await db.collectionItem.upsert({
    where: { collectionId_resourceId: { collectionId: id, resourceId: body.resourceId } },
    update: {},
    create: { collectionId: id, resourceId: body.resourceId },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** DELETE /api/collections/[id]/items { resourceId } — remove. */
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await ownedCollection(id, viewer.id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { resourceId?: unknown };
  if (typeof body.resourceId !== "string" || !body.resourceId) {
    return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
  }
  await db.collectionItem.deleteMany({
    where: { collectionId: id, resourceId: body.resourceId },
  });
  return NextResponse.json({ ok: true });
}
