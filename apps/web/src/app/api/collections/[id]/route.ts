import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

interface Params {
  params: Promise<{ id: string }>;
}

/** DELETE /api/collections/[id] — delete my collection. */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await db.collection.deleteMany({
    where: { id, userId: viewer.id },
  });
  if (deleted.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
