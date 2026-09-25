import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/resources/[id]/save — bookmark. DELETE — remove bookmark. */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resource = await db.resource.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.savedResource.upsert({
    where: { userId_resourceId: { userId: viewer.id, resourceId: id } },
    update: {},
    create: { userId: viewer.id, resourceId: id },
  });
  return NextResponse.json({ saved: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.savedResource.deleteMany({
    where: { userId: viewer.id, resourceId: id },
  });
  return NextResponse.json({ saved: false });
}
