import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/admin/resources/[id]/review — { decision: "approve" | "reject" } (staff only). */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { decision?: unknown };
  if (body.decision !== "approve" && body.decision !== "reject") {
    return NextResponse.json({ error: "decision must be approve or reject" }, { status: 400 });
  }

  const updated = await db.resource.update({
    where: { id },
    data:
      body.decision === "approve"
        ? {
            reviewStatus: "APPROVED",
            badges: Array.from(new Set([...resource.badges, "REVIEWED"])),
          }
        : { reviewStatus: "REJECTED" },
    select: { id: true, reviewStatus: true, badges: true },
  });

  return NextResponse.json({ resource: updated });
}
