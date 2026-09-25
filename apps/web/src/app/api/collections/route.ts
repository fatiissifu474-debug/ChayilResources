import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

/** GET /api/collections — my collections with items. POST — create { name }. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collections = await db.collection.findMany({
    where: { userId: viewer.id },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: { resource: { include: { subject: true, classLevel: true } } },
      },
    },
  });
  return NextResponse.json({ collections });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const collection = await db.collection.create({
    data: { userId: viewer.id, name: name.slice(0, 80) },
  });
  return NextResponse.json({ collection }, { status: 201 });
}
