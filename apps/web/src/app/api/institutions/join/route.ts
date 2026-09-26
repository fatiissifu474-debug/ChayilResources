import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

/** POST /api/institutions/join { code } — teacher joins an institution by code. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { code?: unknown };
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const institution = await db.institution.findUnique({ where: { code } });
  if (!institution || !institution.active) {
    return NextResponse.json({ error: "Unknown or inactive code" }, { status: 404 });
  }

  await db.institutionMember.upsert({
    where: { institutionId_userId: { institutionId: institution.id, userId: viewer.id } },
    update: {},
    create: { institutionId: institution.id, userId: viewer.id },
  });
  const existing = await db.entitlement.findFirst({
    where: { userId: viewer.id, kind: "INSTITUTIONAL", institutionId: institution.id },
    select: { id: true },
  });
  if (!existing) {
    await db.entitlement.create({
      data: { userId: viewer.id, kind: "INSTITUTIONAL", institutionId: institution.id },
    });
  }

  return NextResponse.json({ institution: { id: institution.id, name: institution.name } });
}
