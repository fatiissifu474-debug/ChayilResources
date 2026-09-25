import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/packs/[id]/save-all — bookmark every resource in the pack. */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pack = await db.pack.findUnique({
    where: { id },
    include: { items: { select: { resourceId: true } } },
  });
  if (!pack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pack.reviewStatus !== "APPROVED" && !isStaff(viewer)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await db.savedResource.createMany({
    data: pack.items.map((i) => ({ userId: viewer.id, resourceId: i.resourceId })),
    skipDuplicates: true,
  });
  return NextResponse.json({ saved: result.count });
}
