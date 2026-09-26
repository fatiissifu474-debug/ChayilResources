import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { Role } from "@prisma/client";

/**
 * POST /api/profile/publisher { organization? } — one-way self-upgrade
 * TEACHER → PUBLISHER at signup. Publishers gain the portal + attribution,
 * but every submission is still reviewed. profileCompleted is untouched,
 * so onboarding still runs.
 */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = await db.user.findUnique({
    where: { id: viewer.id },
    select: { role: true },
  });
  if (current?.role !== Role.TEACHER) {
    return NextResponse.json(
      { error: "Only teacher accounts can self-register as publishers" },
      { status: 400 },
    );
  }

  const body = (await req.json()) as { organization?: unknown };
  const organization =
    typeof body.organization === "string" && body.organization.trim().length > 0
      ? body.organization.trim().slice(0, 120)
      : null;

  const profile = await db.user.update({
    where: { id: viewer.id },
    data: { role: Role.PUBLISHER, organization },
    select: { id: true, role: true, organization: true },
  });
  return NextResponse.json({ profile });
}
