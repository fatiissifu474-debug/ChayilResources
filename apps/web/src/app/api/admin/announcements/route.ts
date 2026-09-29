import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { logStaffAction } from "@/lib/audit";

/** Staff: list announcements / post one (surfaced on /notifications per prefs). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const announcements = await db.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ announcements });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { title?: unknown; body?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!title || !text) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const announcement = await db.announcement.create({
    data: {
      title: title.slice(0, 200),
      body: text.slice(0, 2000),
      createdById: viewer.id,
    },
    select: { id: true },
  });
  await logStaffAction(viewer.id, "announcement.post", "announcement", announcement.id, title);
  return NextResponse.json({ announcement }, { status: 201 });
}
