import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { logStaffAction } from "@/lib/audit";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/admin/suggestions/[id]/review { decision } — approve joins the pack. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const suggestion = await db.packSuggestion.findUnique({ where: { id } });
  if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { decision?: unknown };
  if (body.decision !== "approve" && body.decision !== "reject") {
    return NextResponse.json({ error: "decision must be approve or reject" }, { status: 400 });
  }

  if (body.decision === "approve") {
    const last = await db.packItem.findFirst({
      where: { packId: suggestion.packId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await db.packItem.upsert({
      where: {
        packId_resourceId: { packId: suggestion.packId, resourceId: suggestion.resourceId },
      },
      update: {},
      create: {
        packId: suggestion.packId,
        resourceId: suggestion.resourceId,
        position: (last?.position ?? -1) + 1,
      },
    });
  }

  const updated = await db.packSuggestion.update({
    where: { id },
    data: { status: body.decision === "approve" ? "APPROVED" : "REJECTED" },
    select: { id: true, status: true },
  });
  await logStaffAction(viewer.id, `suggestion.${body.decision}`, "suggestion", id);
  return NextResponse.json({ suggestion: updated });
}
