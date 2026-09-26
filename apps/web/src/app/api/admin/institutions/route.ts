import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";

function makeCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

/**
 * Institutions for group access (PRD §25 institutional model).
 * POST /api/admin/institutions { name } — create with a join code (staff only).
 * GET — list with member counts (staff only).
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const institutions = await db.institution.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });
  return NextResponse.json({ institutions });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const institution = await db.institution.create({
    data: { name: name.slice(0, 120), code: makeCode(), createdById: viewer.id },
  });
  return NextResponse.json({ institution }, { status: 201 });
}
