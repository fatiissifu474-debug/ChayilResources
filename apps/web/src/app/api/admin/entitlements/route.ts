import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { EntitlementKind } from "@prisma/client";

/**
 * POST /api/admin/entitlements { email, kind, expiresInDays? } — grant access (staff only).
 * GET — list recent entitlements (staff only).
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entitlements = await db.entitlement.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ entitlements });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { email?: unknown; kind?: unknown; expiresInDays?: unknown };
  if (typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (body.kind !== EntitlementKind.PREMIUM && body.kind !== EntitlementKind.INSTITUTIONAL) {
    return NextResponse.json({ error: "kind must be PREMIUM or INSTITUTIONAL" }, { status: 400 });
  }
  const days = typeof body.expiresInDays === "number" && body.expiresInDays > 0 ? body.expiresInDays : null;

  const user = await db.user.findUnique({
    where: { email: body.email.toLowerCase().trim() },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "No teacher with that email" }, { status: 404 });

  const entitlement = await db.entitlement.create({
    data: {
      userId: user.id,
      kind: body.kind,
      expiresAt: days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null,
      grantedById: viewer.id,
    },
  });
  return NextResponse.json({ entitlement }, { status: 201 });
}
