import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/packs/[id]/suggest { resourceId } — propose a resource for a pack. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pack = await db.pack.findUnique({ where: { id }, select: { id: true, reviewStatus: true } });
  if (!pack || (pack.reviewStatus !== "APPROVED" && !isStaff(viewer))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { resourceId?: unknown };
  if (typeof body.resourceId !== "string" || !body.resourceId) {
    return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
  }
  const resource = await db.resource.findUnique({
    where: { id: body.resourceId },
    select: { id: true, reviewStatus: true },
  });
  if (!resource || resource.reviewStatus !== "APPROVED") {
    return NextResponse.json({ error: "Only approved resources can be suggested" }, { status: 400 });
  }

  const suggestion = await db.packSuggestion.upsert({
    where: {
      packId_resourceId_userId: { packId: id, resourceId: body.resourceId, userId: viewer.id },
    },
    update: {},
    create: { packId: id, resourceId: body.resourceId, userId: viewer.id },
  });
  return NextResponse.json({ suggestion: { id: suggestion.id, status: suggestion.status } }, { status: 201 });
}
