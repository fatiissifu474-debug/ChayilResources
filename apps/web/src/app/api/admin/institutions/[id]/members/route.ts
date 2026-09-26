import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Staff: add/remove institution members.
 * POST /api/admin/institutions/[id]/members { email } — adds member + INSTITUTIONAL entitlement.
 * DELETE ... { userId } — removes member + their institutional entitlements for it.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const institution = await db.institution.findUnique({ where: { id }, select: { id: true } });
  if (!institution) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { email?: unknown };
  if (typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  const user = await db.user.findUnique({
    where: { email: body.email.toLowerCase().trim() },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "No teacher with that email" }, { status: 404 });

  await db.institutionMember.upsert({
    where: { institutionId_userId: { institutionId: id, userId: user.id } },
    update: {},
    create: { institutionId: id, userId: user.id },
  });
  const existing = await db.entitlement.findFirst({
    where: { userId: user.id, kind: "INSTITUTIONAL", institutionId: id },
    select: { id: true },
  });
  if (!existing) {
    await db.entitlement.create({
      data: { userId: user.id, kind: "INSTITUTIONAL", institutionId: id, grantedById: viewer.id },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { userId?: unknown };
  if (typeof body.userId !== "string" || !body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await db.institutionMember.deleteMany({
    where: { institutionId: id, userId: body.userId },
  });
  await db.entitlement.deleteMany({
    where: { userId: body.userId, kind: "INSTITUTIONAL", institutionId: id },
  });
  return NextResponse.json({ ok: true });
}
