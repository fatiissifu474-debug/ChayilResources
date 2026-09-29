import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";

/** GET /api/admin/suggestions — pending pack suggestions (staff only). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const suggestions = await db.packSuggestion.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      pack: { select: { id: true, title: true } },
      resource: { select: { id: true, title: true } },
      user: { select: { name: true } },
    },
  });
  return NextResponse.json({ suggestions });
}
